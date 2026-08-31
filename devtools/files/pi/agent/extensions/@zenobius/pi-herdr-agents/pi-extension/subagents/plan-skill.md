---
name: plan
description: >
  Planning workflow. Runs a pre-flight scout, then spawns the planner agent
  which clarifies WHAT to build and figures out HOW, with the ability to
  spawn its own scouts mid-session. Use when asked to "plan",
  "brainstorm", "I want to build X", or "let's design". Requires the
  subagents extension running inside herdr.
---

# Plan

A planning workflow. A scout maps the relevant codebase, then an interactive planner clarifies intent + requirements and designs the technical approach, producing a `plan.md` with ordered implementation tasks.

**Announce at start:** "Let me take a quick look, then I'll send a scout to map the codebase before we start the planning session."

---

## The Flow

```
Phase 1: Quick Assessment (main session — 30s orientation)
    ↓
Phase 2: Scout (autonomous — codebase context)
    ↓
Phase 3: Spawn Planner Agent (interactive — clarifies WHAT, plans HOW, writes ordered tasks)
    ↓
    (Planner may spawn its own scouts mid-session as needed)
    ↓
Phase 4: Review Plan (main session)
    ↓
Phase 5: Execute Plan Tasks (sequential workers, or isolated parallel workers when independent)
    ↓
Phase 6: Integrate Worktree Results (parent-owned, one at a time)
    ↓
Phase 7: Review
```

---

## Runtime

Set `model` and `thinking` on every spawn. Use an exact authenticated provider/model ID: a fast-tier model for scouts, a mid-tier model for ordinary workers, and a frontier-tier model only for architecture or hard diagnosis. Reviewers must use a different provider/family than workers. Do not omit `model` in this workflow.

## Fire-and-forget completion

`subagent` is fire-and-forget. After each spawn:

1. End the parent turn.
2. Let automatic completion delivery resume the parent with the child's result.
3. Continue from that delivered result.

Do **not** poll, check, list, sleep, tail sessions, or wait-loop for child status.

---

## Phase 1: Quick Assessment

Quick orientation — just enough to give the scout a focused mission:

```bash
ls -la
find . -type f -name "*.ts" | head -20  # or relevant extension
cat package.json 2>/dev/null | head -30
```

Spend ~30 seconds. Tech stack, project shape, and the area relevant to the user's request. This tells you what to ask the scout to focus on.

---

## Artifact Paths

For a planning run, pick a short `<name>` (e.g. `auth-redesign`) and use a shared directory under `.pi/plans/YYYY-MM-DD-<name>/` for artifacts the parent or planner chooses to write. Pass explicit paths in each subagent's task when a file is required. Scout and reviewer deliver their findings in their final assistant messages; the planner writes `plan.md`.

Standard filenames:

- `.pi/plans/YYYY-MM-DD-<name>/plan.md`
- `.pi/plans/YYYY-MM-DD-<name>/review.md` (optional, only if a later step materializes reviewer output)

---

## Phase 2: Scout

**Always spawn a scout before the planner.** The scout's final message feeds into the planning session — it lets the planner skip re-asking questions whose answers live in the code, and gives it a solid base to design from.

```typescript
subagent({
  name: "🔍 Scout",
  agent: "scout",
  model: "<scout-provider>/<fast-tier-id>",
  thinking: "low",
  task: `Analyze the codebase for [user's request area]. Map file structure, key modules, patterns, conventions, and existing code related to [feature area]. Focus on what a planner would need to understand before designing this feature.

Put your full findings in your final assistant message.`,
});
```

**End the parent turn.** When completion delivery resumes you, use the scout's final message as planner context. The scout is source-read-only; do not require it to write a file.

The planner can spawn **additional** scouts mid-session if it hits a local codebase gap. That's expected — don't try to pre-scout every possible area.

External facts are not handled by a bundled researcher. Supply or materialize them in the parent when needed, use only capabilities the parent actually has, or leave them as open questions for the planner.

---

## Phase 3: Spawn Planner Agent

Spawn the interactive planner with the scout's context and the user's request. The planner handles everything from here: clarifying intent, compact requirements engineering, ISC, approach exploration, design validation, premortem, and the plan artifact with ordered tasks.

```typescript
subagent({
  name: "💬 Planner",
  agent: "planner",
  model: "<planner-provider>/<frontier-tier-id>",
  thinking: "high",
  interactive: true,
  task: `Plan: [what the user wants to build]

Scout context:
[paste scout findings here — file structure, conventions, patterns, relevant code]

Save the final plan to: .pi/plans/YYYY-MM-DD-<name>/plan.md
Include ordered implementation tasks inside the plan (no todo API).`,
});
```

**The user works with the planner.** It will clarify requirements lightly (1-2 rounds of questions, not a deep spec session), propose approaches, validate the design, run a premortem, and write the plan with complete worker briefs.

When done, the user presses Ctrl+D and the plan is returned to the main session.

### The planner may spawn its own scouts

During the session, the planner can spawn **`scout`** when a design decision depends on existing code it hasn't read. These are internal to the planning session. You'll see them in herdr but don't need to intervene.

### Optional: extra scout after planning

If the planner significantly changed scope (new subsystems, areas the original scout didn't cover), spawn another scout targeting the new areas before workers start:

```typescript
subagent({
  name: "🔍 Scout (updated scope)",
  agent: "scout",
  model: "<scout-provider>/<fast-tier-id>",
  thinking: "low",
  task: "The plan changed scope. Gather context for [new areas]. Read the plan at [plan path]. Focus on [specific files/modules the planner identified that weren't in the original scout]. Put findings in your final assistant message.",
});
```

End the parent turn and fold the delivered scout message into worker tasks.

---

## Phase 4: Review Plan

Once the planner closes, read the plan artifact:

```bash
# or use the read tool
cat .pi/plans/YYYY-MM-DD-<name>/plan.md
```

Review with the user:

> "Here's what the planner produced: [brief summary]. Ready to execute, or anything to adjust?"

---

## Phase 5: Execute Plan Tasks

Choose the workspace mode deliberately:

- **Shared checkout, sequential workers (default):** use when tasks overlap, depend on prior uncommitted work, or are faster to integrate directly.
- **Managed worktrees, parallel workers:** use only when writing tasks are independent and can start from committed state. Give every worker a unique branch.
- **Ordinary panes, parallel agents:** use for read-only scouts and reviewers; they do not need worktrees.

Pass each worker a **complete task or plan section** — goal, files, constraints, examples/references, acceptance criteria, and whether to commit. Do not pass todo IDs or expect a todo API.

Sequential example:

```typescript
subagent({
  name: "🔨 Worker 1/N",
  agent: "worker",
  model: "<worker-provider>/<mid-tier-id>",
  thinking: "medium",
  task: `Implement Task 1 from the plan.

Plan: [plan path]

[Paste the full Task 1 section: goal, files, example/reference, constraints, acceptance]

Run relevant tests. Commit only if this task explicitly requires a commit. Report the commit SHA if you commit.`,
});
```

For independent writing tasks, first ensure their shared base is committed. The parent checkout's uncommitted files are not copied. Then launch each worker with complete context and a unique branch:

```typescript
subagent({
  name: "🔨 Task-1",
  agent: "worker",
  model: "<worker-provider>/<mid-tier-id>",
  thinking: "medium",
  cwd: "/absolute/path/to/source-repo",
  worktree: { branch: "plan-name/task-1", base: "HEAD" },
  task: `Implement Task 1.

Plan and scout context: [paste everything needed, or provide an absolute plan path and paste the full task section]

Run relevant tests. Commit only if the task explicitly requires a commit. Report the commit SHA if you commit. Do not push, merge, switch branches, or remove the worktree.`,
});
```

Launch other independent tasks the same way without waiting. Do not parallelize tasks that edit the same behavior or require another worker's output. For a dependency, integrate the prerequisite first or use its committed SHA as the dependent worker's base.

After each spawn, end the parent turn and continue from automatic completion delivery.

---

## Phase 6: Integrate Worktree Results

A worktree completion is a review handoff, not acceptance. For every result:

1. Use the returned worktree path, workspace ID, branch, and base/head SHAs.
2. Inspect `git status`, `git log <base>..HEAD`, and `git diff <base>...HEAD` in the worktree.
3. Run the relevant tests there.
4. Resolve dirty/conflicted work before integration.
5. Merge or cherry-pick according to repository policy, one result at a time.
6. Re-run affected tests on the destination branch after each integration.
7. Keep the worktree until the result is accepted and preserved; cleanup is explicit.

The extension does not push, create PRs, merge, or remove worktrees automatically. `subagent_resume` does not reattach worktree tracking; continue follow-up in the retained workspace. See `docs/worktree-subagents.md` when this package's guide is available.

Skip this phase when all workers used the shared checkout.

---

## Phase 7: Review

After all shared-checkout changes and accepted worktree results are integrated:

```typescript
subagent({
  name: "Reviewer",
  agent: "reviewer",
  model: "<review-provider>/<mid-tier-id>",
  thinking: "medium",
  interactive: false,
  task: "Review the recent changes. Plan: [plan path]. Put the full review in your final assistant message.",
});
```

End the parent turn. Use the delivered review message.

Triage findings:

- **P0** — Real bugs, security issues → fix now
- **P1** — Genuine traps, maintenance dangers → fix before merging
- **P2** — Minor issues → fix if quick, note otherwise
- **P3** — Nits → skip

Spawn workers with complete fix tasks for P0/P1. Re-review only if fixes were substantial.

---

## Completion Checklist

Before reporting done:

1. Scout ran before the planner?
2. Scout context was passed to the planner?
3. Parallel writers used unique worktree branches from committed bases?
4. Every worktree result was inspected, tested, and integrated deliberately?
5. Every plan task was executed or explicitly deferred?
6. Every requested commit is polished and its SHA reported?
7. Retained worktrees were kept or explicitly cleaned up only after review?
8. Reviewer ran against the integrated result?
9. Reviewer findings were triaged and addressed?
