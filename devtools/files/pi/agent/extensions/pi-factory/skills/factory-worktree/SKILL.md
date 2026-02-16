---
name: factory-worktree
description: "Worktree-based parallel development with pi-factory. Use when multiple agents need to edit code simultaneously without conflicts—each agent gets its own working directory via jj workspace or git worktree."
---

# Worktree-Based Parallel Development

When multiple agents need to edit files simultaneously, they'll conflict if they share a working directory. The solution: give each agent its own worktree. Each has a full working copy but shares the underlying repository. Agents work in complete isolation—own directory, own state, no file conflicts.

## Why Worktrees?

- **No merge conflicts during work** — Each agent has its own copy of every file
- **Full toolchain access** — Each worktree can run its own dev server, tests, linter
- **Atomic merges** — Combine results after all agents finish
- **Clean rollback** — Discard a worktree if an agent fails

## Jujutsu (jj) Variant

### Core Commands

```bash
# Create a workspace (like git worktree add)
jj workspace add /tmp/worktree-auth

# List workspaces
jj workspace list

# Remove workspace tracking (doesn't delete files)
jj workspace forget <workspace-name>

# Delete the directory
rm -rf /tmp/worktree-auth
```

### Basic Pattern

```typescript
import { spawnSync } from "child_process";
import fs from "fs";

export async function run(input, rt) {
  const baseCwd = input.cwd || process.cwd();
  const tasks = input.tasks; // [{ name: "auth", task: "Implement auth module" }, ...]
  const worktrees: string[] = [];

  try {
    // 1. Create worktrees
    for (const t of tasks) {
      const wtPath = `/tmp/pi-worktree-${t.name}-${Date.now()}`;
      worktrees.push(wtPath);

      const result = spawnSync("jj", ["workspace", "add", wtPath], {
        cwd: baseCwd,
        encoding: "utf-8",
      });

      if (result.status !== 0) {
        throw new Error(`Failed to create workspace ${t.name}: ${result.stderr}`);
      }

      rt.observe.log("info", `Created workspace: ${t.name}`, { path: wtPath });
    }

    // 2. Install dependencies in each worktree
    await rt.parallel(
      "install-deps",
      worktrees.map((wt, i) => ({
        agent: "installer",
        systemPrompt: "Install project dependencies. Run the appropriate install command (npm install, pnpm install, bun install, etc.) and verify it succeeds.",
        task: "Install dependencies in this workspace.",
        cwd: wt,
        step: i,
      }))
    );

    // 3. Dispatch parallel agents
    const results = await rt.parallel(
      "worktree-agents",
      tasks.map((t, i) => ({
        agent: t.name,
        systemPrompt: t.systemPrompt || "You are a software engineer. Implement the requested changes. Run tests to verify your work.",
        task: t.task,
        cwd: worktrees[i],
        step: i,
      }))
    );

    // 4. Check results
    const failed = results.filter((r) => r.exitCode !== 0);
    if (failed.length > 0) {
      rt.observe.log("warning", "Some agents failed", {
        failed: failed.map((r) => r.agent),
      });
    }

    // 5. Merge results back
    // Each workspace created its own jj change. Merge them.
    const mergeAgent = await rt.join(
      rt.spawn({
        agent: "merger",
        systemPrompt: `You merge parallel workstream results using jj.
Use 'jj log' to see all changes across workspaces.
Create a merge commit that combines all successful changes.
Resolve any conflicts if they arise.
The main workspace is at: ${baseCwd}`,
        task: `Merge changes from ${worktrees.length} parallel workstreams.
Workspaces: ${worktrees.join(", ")}
Failed agents: ${failed.map((r) => r.agent).join(", ") || "none"}
Use jj to combine the changes into the main workspace.`,
        cwd: baseCwd,
        step: tasks.length,
      })
    );

    // 6. Write summary
    const summaryContent = results
      .map((r) => `## ${r.agent}\n**Status:** ${r.exitCode === 0 ? "✓" : "✗"}\n\n${r.text}`)
      .join("\n\n---\n\n");
    const reportPath = rt.observe.artifact("worktree-report.md", summaryContent);

    return {
      status: failed.length === 0 ? "success" : "partial",
      completed: results.filter((r) => r.exitCode === 0).length,
      failed: failed.length,
      reportPath,
      totalCost: results.reduce((sum, r) => sum + r.usage.cost, 0),
    };
  } finally {
    // 7. Cleanup — always runs
    for (const wt of worktrees) {
      const name = wt.split("/").pop() || "";
      spawnSync("jj", ["workspace", "forget", name], {
        cwd: baseCwd,
        encoding: "utf-8",
      });
      if (fs.existsSync(wt)) {
        fs.rmSync(wt, { recursive: true, force: true });
      }
      rt.observe.log("info", `Cleaned up workspace`, { path: wt });
    }
  }
}
```

### jj Merge Strategies

After parallel work, you have multiple jj changes to combine. Common approaches:

**Rebase onto each other (sequential):**
```bash
# In the main workspace, rebase changes into a sequence
jj rebase -s <change-auth> -d <change-api>
jj rebase -s <change-ui> -d <change-auth>
```

**Create a merge commit:**
```bash
# Create a new change with multiple parents
jj new <change-auth> <change-api> <change-ui> -m "Merge parallel workstreams"
```

**Squash into one:**
```bash
# If you want a single combined change
jj new <change-auth> <change-api> <change-ui>
jj squash
```

## Git Worktree Variant

For repositories using git instead of jj:

### Core Commands

```bash
# Create a worktree on a new branch
git worktree add /tmp/worktree-auth -b feature/auth

# List worktrees
git worktree list

# Remove worktree (cleans up git metadata)
git worktree remove /tmp/worktree-auth

# Force remove if dirty
git worktree remove --force /tmp/worktree-auth
```

### Basic Pattern

```typescript
import { spawnSync } from "child_process";
import fs from "fs";

export async function run(input, rt) {
  const baseCwd = input.cwd || process.cwd();
  const baseBranch = input.baseBranch || "main";
  const tasks = input.tasks;
  const worktrees: Array<{ path: string; branch: string }> = [];

  try {
    // 1. Create worktrees with dedicated branches
    for (const t of tasks) {
      const branch = `worktree/${t.name}-${Date.now()}`;
      const wtPath = `/tmp/pi-worktree-${t.name}-${Date.now()}`;
      worktrees.push({ path: wtPath, branch });

      const result = spawnSync(
        "git",
        ["worktree", "add", wtPath, "-b", branch, baseBranch],
        { cwd: baseCwd, encoding: "utf-8" }
      );

      if (result.status !== 0) {
        throw new Error(`Failed to create worktree ${t.name}: ${result.stderr}`);
      }

      rt.observe.log("info", `Created worktree: ${t.name}`, { path: wtPath, branch });
    }

    // 2. Install dependencies
    await rt.parallel(
      "install-deps",
      worktrees.map((wt, i) => ({
        agent: "installer",
        systemPrompt: "Install project dependencies.",
        task: "Run the install command for this project (npm install, etc.)",
        cwd: wt.path,
        step: i,
      }))
    );

    // 3. Dispatch agents
    const results = await rt.parallel(
      "worktree-agents",
      tasks.map((t, i) => ({
        agent: t.name,
        systemPrompt: t.systemPrompt || "Implement the requested changes. Commit your work when done.",
        task: `${t.task}\n\nCommit your changes to the current branch when complete.`,
        cwd: worktrees[i].path,
        step: i,
      }))
    );

    // 4. Merge branches back
    const successful = results
      .map((r, i) => ({ result: r, worktree: worktrees[i] }))
      .filter(({ result }) => result.exitCode === 0);

    const mergeAgent = await rt.join(
      rt.spawn({
        agent: "merger",
        systemPrompt: `You merge git branches from parallel workstreams.
Merge each feature branch into ${baseBranch}.
Handle conflicts if they arise. Prefer keeping both changes when possible.`,
        task: `Merge these branches into ${baseBranch}:
${successful.map(({ worktree }) => `- ${worktree.branch}`).join("\n")}`,
        cwd: baseCwd,
        step: tasks.length,
      })
    );

    return {
      status: "complete",
      completed: successful.length,
      failed: results.filter((r) => r.exitCode !== 0).length,
    };
  } finally {
    // 5. Cleanup
    for (const wt of worktrees) {
      spawnSync("git", ["worktree", "remove", "--force", wt.path], {
        cwd: baseCwd,
        encoding: "utf-8",
      });
      // Delete branch
      spawnSync("git", ["branch", "-D", wt.branch], {
        cwd: baseCwd,
        encoding: "utf-8",
      });
      // Fallback: remove directory if worktree remove didn't
      if (fs.existsSync(wt.path)) {
        fs.rmSync(wt.path, { recursive: true, force: true });
      }
    }
  }
}
```

## Dependency Installation

Each worktree needs its own `node_modules` (or equivalent). Common patterns:

```typescript
// Detect package manager and install
function installDeps(cwd: string): { status: number; stderr: string } {
  if (fs.existsSync(`${cwd}/bun.lockb`)) {
    return spawnSync("bun", ["install"], { cwd, encoding: "utf-8" });
  } else if (fs.existsSync(`${cwd}/pnpm-lock.yaml`)) {
    return spawnSync("pnpm", ["install", "--frozen-lockfile"], { cwd, encoding: "utf-8" });
  } else if (fs.existsSync(`${cwd}/yarn.lock`)) {
    return spawnSync("yarn", ["install", "--frozen-lockfile"], { cwd, encoding: "utf-8" });
  } else {
    return spawnSync("npm", ["ci"], { cwd, encoding: "utf-8" });
  }
}
```

Or let each agent handle it—the installer agent in the examples above will figure out the right command.

## Advanced: Fan-Out with Worktrees + Synthesize

Combine the worktree pattern with fan-out-then-synthesize:

```typescript
export async function run(input, rt) {
  const baseCwd = input.cwd || process.cwd();
  const worktrees: string[] = [];

  const tasks = [
    { name: "api", task: "Add pagination to /api/users endpoint", systemPrompt: "You are a backend engineer." },
    { name: "ui", task: "Add pagination controls to the users table", systemPrompt: "You are a frontend engineer." },
    { name: "tests", task: "Write integration tests for paginated user listing", systemPrompt: "You are a QA engineer." },
  ];

  try {
    // Setup worktrees
    for (const t of tasks) {
      const wt = `/tmp/pi-wt-${t.name}-${Date.now()}`;
      worktrees.push(wt);
      spawnSync("jj", ["workspace", "add", wt], { cwd: baseCwd, encoding: "utf-8" });
    }

    // Install deps in parallel
    await rt.parallel("deps", worktrees.map((wt, i) => ({
      agent: "installer",
      systemPrompt: "Install deps.",
      task: "npm install",
      cwd: wt,
      step: i,
    })));

    // Parallel implementation
    const results = await rt.parallel("implement", tasks.map((t, i) => ({
      agent: t.name,
      systemPrompt: t.systemPrompt,
      task: t.task,
      cwd: worktrees[i],
      step: i,
    })));

    // Synthesize — merge and verify
    const context = results.map(r => `[${r.agent}]\n${r.text}`).join("\n\n");
    const synthesis = await rt.join(rt.spawn({
      agent: "integrator",
      systemPrompt: `You integrate parallel workstreams.
1. Use jj to merge all workspace changes into the main workspace.
2. Resolve any conflicts.
3. Run the full test suite to verify integration.
4. Fix any integration issues.
Main workspace: ${baseCwd}`,
      task: `Integrate these parallel changes:\n\n${context}`,
      cwd: baseCwd,
      step: tasks.length,
    }));

    return {
      status: synthesis.exitCode === 0 ? "success" : "integration_failed",
      report: synthesis.text,
    };
  } finally {
    for (const wt of worktrees) {
      const name = wt.split("/").pop() || "";
      spawnSync("jj", ["workspace", "forget", name], { cwd: baseCwd, encoding: "utf-8" });
      if (fs.existsSync(wt)) fs.rmSync(wt, { recursive: true, force: true });
    }
  }
}
```

## Best Practices

### 1. **Always clean up in `finally`**

Worktrees leak disk space and repository state if not cleaned:

```typescript
try {
  // ... create worktrees, run agents
} finally {
  // ... forget workspaces, delete directories
}
```

### 2. **Use `/tmp` for worktree paths**

Keeps worktrees out of your project directory and OS handles cleanup on reboot:

```typescript
const wtPath = `/tmp/pi-worktree-${name}-${Date.now()}`;
```

### 3. **Include timestamps in paths**

Prevents collisions if you run the same program twice:

```typescript
const wtPath = `/tmp/pi-wt-${name}-${Date.now()}`;
```

### 4. **Install deps before dispatching agents**

Agents shouldn't waste tokens figuring out dependency installation. Do it as a setup step:

```typescript
// Dedicated install step
await rt.parallel("install-deps", worktrees.map(wt => ({
  agent: "installer",
  systemPrompt: "Install dependencies.",
  task: "npm install",
  cwd: wt,
})));

// Then dispatch real work
await rt.parallel("work", tasks.map((t, i) => ({
  agent: t.name,
  systemPrompt: t.systemPrompt,
  task: t.task,
  cwd: worktrees[i],
})));
```

### 5. **Scope agent work narrowly**

Each agent should work on a well-defined, non-overlapping area. If two agents edit the same files, merging becomes painful:

```
✅ Agent A: "Implement auth module in src/auth/"
✅ Agent B: "Implement payments in src/payments/"
❌ Agent A: "Refactor the app" — too broad, will conflict
```

### 6. **Verify after merge**

Always run tests/lint after merging parallel changes:

```typescript
const verify = spawnSync("npm", ["test"], { cwd: baseCwd, encoding: "utf-8" });
if (verify.status !== 0) {
  // Fix integration issues
}
```

### 7. **Track worktree count**

Each worktree is a full working copy. On large repos, 5+ simultaneous worktrees can use significant disk space. Start with 2–3 parallel agents and scale up.

## When to Use Worktrees

✅ **Good for:**
- Implementing multiple independent features in parallel
- Parallel refactoring of separate modules
- Running different test suites simultaneously
- Any task where agents would otherwise conflict on files

❌ **Not ideal for:**
- Tasks that heavily overlap in the same files
- Read-only analysis (just use `rt.parallel` with same `cwd`)
- Very small changes (worktree overhead isn't worth it)
- Repos with huge `node_modules` or build artifacts (disk cost)

## Summary

The worktree pattern gives each agent full isolation:
1. **Create** — `jj workspace add` or `git worktree add`
2. **Install** — Dependencies in each worktree
3. **Dispatch** — Parallel agents, each with own `cwd`
4. **Merge** — Combine changes with jj/git
5. **Cleanup** — Forget workspaces, delete directories

Agents never step on each other's toes. The merge step is where conflicts surface—and by scoping work to non-overlapping areas, you minimize that pain.
