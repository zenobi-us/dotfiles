# Worktree subagents

This guide is the operational reference for running writing agents in isolated Git worktrees with `pi-herdr-agents`. For the complete tool API, installation, and status model, see the [README](../README.md). For the product and open-source research behind these choices, see the [research report](research/worktree-subagent-orchestration.md).

## Quick start

Run Pi inside Herdr from a Git checkout, then give each independent writing task a unique branch:

```typescript
subagent({
  name: "Ticket 123",
  agent: "worker",
  model: "<worker-provider>/<mid-tier-id>",
  thinking: "medium",
  cwd: "/path/to/repository",
  worktree: { branch: "ticket/123", base: "main" },
  task: "Implement ticket 123, run its tests, commit the result, and report the commit SHA. Do not push, merge, or remove the worktree.",
});
```

`base` is optional. When omitted, the extension resolves the source checkout's committed `HEAD` before creating the worktree.

## When to use a worktree

Use one worktree per independent task that may write files or create commits. This prevents workers from overwriting each other's files and indexes.

Use an ordinary subagent pane instead when the task is read-only, interactive, or intentionally shares the current checkout:

```typescript
subagent({
  name: "Scout auth",
  agent: "scout",
  model: "<scout-provider>/<fast-tier-id>",
  thinking: "low",
  task: "Map the auth flow; do not modify files.",
});
```

Worktrees isolate checkouts, indexes, and `HEAD`. They are **not security sandboxes**: worktrees still share the repository's object database and most refs, and the child process has the same host permissions as Pi.

## Launch contract

For a worktree launch:

- `cwd` selects the source Git repository. A relative tool argument is resolved from the parent Pi process's current directory.
- `worktree.branch` is a new, unique branch name. Git/Herdr rejects a branch that cannot be created or is already checked out elsewhere.
- `worktree.base` may be any revision that resolves to a commit in the source repository. It defaults to committed `HEAD`.
- The extension resolves `base` to an exact SHA, writes an ownership manifest, then calls `herdr worktree create --no-focus`.
- The child starts at the root of the returned worktree, in that workspace's root pane.
- Uncommitted and untracked files from the parent checkout are not copied. Commit anything the child must see before spawning it, or pass the needed context in the task.
- Worktree creation does not steal terminal focus.

For an explicit interactive handoff, use `/worktree <worktree> [task]`. It creates the worktree from the current committed branch, forks the active conversation branch into the target-cwd session, launches a normal long-lived Pi process in the returned root pane, and focuses the destination workspace only after Herdr confirms Pi is running with the expected session and worktree cwd. Use `/worktree list` to inspect worktrees for the current repository. The original process and session remain intact; pane movement is not used to change a running shell's cwd.

`worktree` cannot be set in agent frontmatter and is not exposed by the `/subagent <agent> <task>` shorthand. It is selected per call to the `subagent` tool. Ordered model fallback lists are not supported for worktree subagents: a failed attempt retains its worktree and branch for review, so a retry cannot safely reuse the requested branch.

## Parent and worker responsibilities

| Parent/orchestrator | Worker |
| --- | --- |
| Choose a unique branch and committed base | Work only in the provided checkout |
| Provide complete task context | Read existing code before editing |
| Review the returned Git metadata and diff | Run relevant verification |
| Decide how and when to integrate | Commit when the task requests a commit |
| Push, create a PR, merge, or clean up explicitly | Do not push, merge, switch branches, or remove the worktree unless explicitly authorized |

A worker commit is recommended because it gives the parent an exact review and integration unit. Uncommitted worker changes are still retained and reported; they are not discarded.

## Parallel writing pattern

Independent tasks can launch concurrently from the same committed base:

```typescript
subagent({
  name: "API ticket",
  agent: "worker",
  model: "<worker-provider>/<mid-tier-id>",
  thinking: "medium",
  worktree: { branch: "tickets/api", base: "main" },
  task: "Implement the API ticket, test it, and commit. Do not push or merge.",
});

subagent({
  name: "UI ticket",
  agent: "worker",
  model: "<worker-provider>/<mid-tier-id>",
  thinking: "medium",
  worktree: { branch: "tickets/ui", base: "main" },
  task: "Implement the UI ticket, test it, and commit. Do not push or merge.",
});
```

Do not parallelize tasks that edit the same behavior, depend on each other's unmerged output, or require ordered migrations. Run those sequentially, or integrate the prerequisite first and use its committed SHA as the next task's base.

## Lifecycle and ownership manifest

Before asking Herdr to create resources, the extension writes a manifest under:

```text
<parent-session-directory>/artifacts/<parent-session-id>/worktree-runs/<run-id>.json
```

The manifest uses the stable owner identifier `pi-herdr-subagents`, retained for compatibility independently of the npm package name. It records the requested base and branch, observed workspace/pane/path, child session path, timestamps, state, and final Git handoff when available.

Possible states are:

| State | Meaning |
| --- | --- |
| `provisioning` | Intent recorded; Herdr creation not yet confirmed |
| `provisioned` | Worktree workspace exists |
| `running` | Child launch command was delivered |
| `ready_for_review` | Child exited successfully; workspace retained |
| `needs_help` | Child called `caller_ping`; workspace retained |
| `failed` | Creation, launch, or execution failed; any created workspace is retained |

The manifest supports ownership and inspection; v1 does not provide automatic reconciliation after a full Pi/Herdr restart. Do not edit manifests by hand.

## Completion handoff

The parent receives the normal child summary plus:

- worktree path
- Herdr workspace ID
- branch
- requested base ref and resolved base SHA
- head SHA
- number of commits in `base..HEAD`
- changed files across committed, staged, unstaged, and untracked work
- untracked files separately
- working-tree state: clean, dirty, or conflicted

`clean` means there are no staged, unstaged, or untracked files. It does **not** mean the branch has no commits or diff relative to its base.

If Git inspection fails, SHA/count/state/file fields are reported as unknown rather than guessed, and the warning is included in the handoff. Inspect the retained workspace directly before integrating or deleting it. Every retained handoff also includes the exact `herdr worktree remove --workspace <workspace-id>` command, but run it only after useful state is preserved.

## Parallel pull-request review without new worktrees

For parallel read-only review, prepare one stable existing checkout of the pull request or retained worker result. Do not create one managed worktree per reviewer.

1. The parent records the exact base and head SHAs and makes sure no writer changes the checkout while review runs.
2. Start each read-only child in an ordinary pane with `cwd` set to that checkout. Omit `worktree`.
3. Give every reviewer the same exact base and head SHAs. Require it to report `git rev-parse HEAD` before its review result.
4. Before the parent reports or publishes the review, recheck the checkout SHA. If it changed, treat the prior reviews as stale and review the new commit again.

```typescript
subagent({
  name: "PR reviewer",
  agent: "reviewer",
  model: "<review-provider>/<mid-tier-id>",
  thinking: "medium",
  cwd: "/path/to/pr-checkout",
  task: "Review base <base-sha> through head <head-sha>. First report git rev-parse HEAD. Do not modify files.",
});
```

A retained worker worktree can be this checkout. The parent owns any final report, PR action, integration, and cleanup.

## Review and integration

Treat completion as a review handoff, not acceptance. Using the path, workspace ID, and base SHA from the result:

```bash
herdr workspace focus <workspace-id>
git -C <worktree-path> status --short
git -C <worktree-path> log --oneline <base-sha>..HEAD
git -C <worktree-path> diff --stat <base-sha>...HEAD
git -C <worktree-path> diff <base-sha>...HEAD
```

Then:

1. Read the worker summary and test evidence.
2. Inspect committed and uncommitted changes.
3. Run relevant tests in the worktree.
4. Resolve dirty or conflicted state in the worktree.
5. Integrate deliberately—merge, cherry-pick, or publish a PR according to the repository's policy.
6. Re-run integration checks on the destination branch.
7. Remove the worktree only after its useful state is preserved.

The extension never pushes, creates a PR, merges, cherry-picks, or changes the parent checkout automatically.

## Failure, help, and restart behavior

- **Creation failure:** the manifest is marked failed. If Herdr created the branch but returned an incomplete response, the extension reconciles a unique branch match through `/worktree list` and records any recovered workspace/path.
- **Launch failure after creation:** the manifest is marked failed and the workspace, forked session, and path are retained. The destination is not focused unless Pi startup is confirmed.
- **Worker failure:** summary and available Git state are returned; the workspace remains open.
- **`caller_ping`:** the child exits with `needs_help`; continue worktree-bound follow-up in the retained workspace rather than through `subagent_resume`.
- **Parent `/reload`, `/new`, `/resume`, or `/fork`:** active in-memory watchers transfer to the replacement parent session.
- **Full process restart or crash:** the worktree remains, but v1 does not automatically rediscover and resume its watcher.

`subagent_resume` resumes a session in a new ordinary Herdr pane. It does not reattach the managed worktree lifecycle or produce a new worktree handoff. For worktree follow-up, focus the retained workspace and resume manually from its shell:

```bash
herdr workspace focus <workspace-id>
pi --session <child-session-path>
```

This manual continuation is not watched by the original parent lifecycle. Do not create another managed worktree for a branch that is already checked out.

## Cleanup

Cleanup is always explicit. First make sure commits, patches, or uncommitted files are no longer needed. Then remove the Herdr worktree workspace:

```bash
herdr worktree remove --workspace <workspace-id>
```

Herdr removes the workspace and linked checkout. Without `--force`, dirty worktrees are protected. Do not use `--force` unless discarding all remaining work is intentional and verified.

The branch is a separate Git ref; inspect and delete it separately only when repository policy allows:

```bash
git branch -d <branch>
```

Use `git branch -D` only when you have independently verified that discarding unmerged commits is safe.

## Current limits

This first version intentionally does not provide:

- automatic push, PR creation, merge, or cherry-pick
- automatic worktree or branch removal
- worktree-aware `subagent_resume`
- durable restart reconciliation
- dependency DAG scheduling or merge queues
- stacked-branch management
- multi-repository workspaces
