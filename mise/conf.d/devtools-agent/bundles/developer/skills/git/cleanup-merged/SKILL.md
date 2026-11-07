---
name: cleanup-merged
description: Removes local branches and worktrees whose work is already in the default branch, including squash merges, when the user asks to clean up, prune, or tidy finished branches or worktrees, or when a cleanup-merged session-start notice lists candidates, resulting in a previewed, user-confirmed removal through Worktrunk that keeps busy, dirty, young, and unmerged work.
user-invocable: true
---

# Clean up merged branches and worktrees

Remove finished local work. Worktrunk decides what is integrated. This skill adds a preview, a busy-worktree check, and user confirmation.

## Script

`scripts/cleanup-merged.ts` is relative to this installed skill directory, not to the repository. Resolve this skill directory as `CLEANUP_MERGED_SKILL_ROOT`. Run the script by its absolute path, with the target repository as the working directory. Its shebang selects the runtime.

```sh
"$CLEANUP_MERGED_SKILL_ROOT/scripts/cleanup-merged.ts" list
"$CLEANUP_MERGED_SKILL_ROOT/scripts/cleanup-merged.ts" remove <branch>...
```

## Rules

- You MUST NOT use `git branch --merged`. It does not detect squash merges.
- You MUST NOT write your own integration check with `git merge-tree`, `git cherry`, or a diff.
- You MUST NOT remove with `git worktree remove`, `git branch -d`, or `git branch -D`. The `worktrunk` skill owns worktrees, and the script runs `wt remove`.
- You MUST NOT pass `--force`, `--force-delete`, or `-y` to `wt`. If `wt` asks for hook approval, follow the `worktree` skill's `references/troubleshooting/wt-hook-approval-needed.md`.
- You MUST NOT delete remote branches.
- You MUST NOT lower the age guard with `--min-age`, unless a calling playbook tells you to for one named branch.

## Procedure

1. Run `list` from the target repository. If it prints `Nothing to clean up.`, stop and tell the user.
2. Show the user each `remove` line and each `keep` line with its reason. A branch that `list` does not show is unmerged, dirty, or younger than 1 hour. To tell the user which, run `wt list` once. Do not investigate further with `stat`, `/proc`, or `git status`.
3. Ask the user which branches to remove. Use your question tool (`AskUserQuestion` in Claude Code). Offer "all listed", "choose", and "skip".
   - Skip this question when the user accepted the `<cleanup-merged>` session-start question and `list` shows the same branches. That answer is the approval.
   - Skip this question when a calling playbook already holds the user's approval for the named branch.
4. Run `remove` with only the approved branch names. The script checks each branch again before removal and refuses a branch that is no longer a candidate.
5. Report each removed branch, each refused branch with its reason, and each kept branch with its reason.

## What the script keeps

| Case | Why it stays |
|---|---|
| Unmerged commits | Worktrunk does not list it as integrated. |
| Uncommitted or untracked files in the worktree | Worktrunk does not list it. Removal would delete the files. |
| Worktree or branch younger than 1 hour | Worktrunk's age guard. A new branch at the tip of the default branch looks merged. |
| A process runs inside the worktree | An agent or shell still uses it. |
| Remote branches | Out of scope. |

## Session-start check

`hooks/hooks.json` in the developer bundle runs `cleanup-merged.ts session-start` for Claude Code and OMP. The hook checks each repository at most once in 24 hours. It skips child agents (`MUXER_SUBAGENT_DEPTH` of 1 or more). When it finds candidates, it adds a `<cleanup-merged>` block to the context. Act on that block: ask the user in your first reply, then follow this procedure if the user accepts. The hook stores its state in `${XDG_STATE_HOME:-~/.local/state}/cleanup-merged/`.

The hook runs `muxer-subagents detect-agent` to find the current agent. mise links that command into `~/.local/bin`. While `OMP_VERIFIED` in `scripts/cleanup-merged.ts` is `false`, an OMP agent gets an `UNVERIFIED IN OMP` line. When you see it, tell the user whether the block arrived and whether the question appeared.

## Test

```sh
cd "$CLEANUP_MERGED_SKILL_ROOT/scripts" && bun test
```

`scripts/fixture.ts <dir>` builds the disposable repository that the tests and pressure scenarios use.
