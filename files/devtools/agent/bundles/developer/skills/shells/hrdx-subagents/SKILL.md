---
name: hrdx-subagents
description: Uses hrdx as the subagent framework for parallel agent work, independent implementation, focused review, and isolated worktrees, with Codex, Claude Code, Pi, Zot, or registered custom harnesses.
---

# hrdx subagents

Use hrdx to give each child agent its own pane. This keeps agent output visible and lets the parent coordinate several tasks.

## When to use hrdx

Use hrdx when:

- Two or more tasks can run at the same time.
- A task needs an independent review.
- A task needs a separate agent or model.
- A task needs an isolated Git worktree.

Do not use hrdx for a small task that one agent can finish directly.

## Start agents

Inside an hrdx session, create an agent pane with the `agent-right` or `agent-down` action. Select the required harness:

- `claude`
- `codex`
- `pi`
- `zot`
- A custom harness from `harness.json`

If you need a new hrdx session, run:

```bash
hrdx --cwd <project-directory> --agent <harness-kind>
```

Use one pane for each independent task. Give each child a short name and one clear task.

## Use worktrees

Create a separate Git worktree when a child changes code independently:

```bash
git worktree add <worktree-path> -b <branch-name> HEAD
hrdx --cwd <worktree-path> --agent <harness-kind>
```

Keep each child in its assigned worktree. The parent agent reviews the changes before merge.

## Coordinate work

1. Split the request into independent tasks.
2. Create one hrdx pane or worktree for each task.
3. Give each child its task, scope, and output format.
4. Keep the parent agent responsible for synthesis and decisions.
5. Read each result before you merge or apply changes.
6. Close child panes after the work is complete.

Use the hrdx socket API for programmatic control from an editor or script. Read the `hrdx` skill for socket methods and configuration details.

## Safety rules

- Do not give two children the same files to edit.
- Do not merge child changes without a review.
- Do not delete a worktree that contains unreviewed changes.
- Do not assume that one harness supports another harness's flags or session files.
- Use the installed `hrdx --help` output as the authority for command options.
