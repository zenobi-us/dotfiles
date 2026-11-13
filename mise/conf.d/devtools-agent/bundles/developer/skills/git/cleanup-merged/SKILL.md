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

The CLI accepts both `--min-age <age>` and `--min-age=<age>`. Both forms apply the same age and busy-worktree guards. The CLI regression verifies both forms and removal of only the named young integrated branch.

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
4. Run `remove` with only the approved branch names. The script checks each named branch immediately before removal and refuses a branch that is no longer a candidate.
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

## Owned resources and pending cleanup

Before removal, stop and verify registered phase-owned services through their normal shutdown commands. Use the muxer-subagents resource observer before and after normal child pane closure. Preserve its run identity and shutdown observation in the calling workflow handoff. Pane closure alone does not prove that worker descendants stopped.

A busy refusal includes exact process identities where the platform permits. Linux output includes PID, command name, boot identity, start ticks, and working directory. These fields explain the refusal; they do not authorize signals. A working-directory match does not establish ownership. Preserve user and unrelated processes. Signals outside normal owned child closure require explicit approval for the named identities and a fresh identity check. Never bypass the busy or dirty guard.

Worktrunk remains the integration authority. Preserve its reason values, including `ancestor` and `merge_adds_nothing`; do not substitute an independent integration test. If a branch is absent from prune output, report it as not a prune candidate: it can be unmerged, dirty, or younger than the age guard. The named age override does not bypass busy or dirty checks.

The script requests `wt remove --foreground --format=json`. The removal response is an array. The script requires exactly one outcome for the named branch with `branch_outcome` set to `deleted`. It then checks the exact branch and workspace against `wt --config-set list.full=false --config-set list.summary=false list --format=json --branches`, and checks that the workspace path is absent. Supported inventory formats are the schema-1 array and schema-2 envelope. Unknown schemas, incomplete rows, and missing or ambiguous removal matches keep cleanup pending. Retained outcomes, `not_attempted`, `deferred`, malformed output, or incomplete observations remain refused with cleanup pending. Exit zero alone does not prove removal.

Report cleanup pending separately from published acceptance. A failed cleanup does not revoke published acceptance. Keep the exact refusal and owned-resource observations for recovery; do not claim that the branch or worktree was removed.
