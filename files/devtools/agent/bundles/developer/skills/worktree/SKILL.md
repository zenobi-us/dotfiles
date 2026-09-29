---
name: worktree
description: Route a worktree subcommand (start, submit, fix, finish, review, continue) to its playbook, after detecting the active muxer and agent.
disable-model-invocation: true
user-invocable: true
---

Route `UserRequest` to the correct worktree workflow. This skill dispatches only. It does not resolve tickets, run validation, or launch agents itself. All of that lives in the playbook it points to.

# Global workflow rules

Load `references/receipts.md` before running a worktree playbook.

Every phase MUST create a durable receipt under the ticket anchor returned by the shared-context CLI. Receipts are append-only and immutable. Chat output, pane output, and temporary handoff files are transport only and are not authoritative workflow state.

Every receipt MUST record the ticket, workflow ID, phase, parent receipt, source branch, base branch, exact source commit and tree, context root and storage mode, tracker path, muxer, workspace path, agent, pane or session identifier, timestamp, status, and output paths.

`start`, `review`, and `fix` MUST use independent agent sessions. A review or fix MUST open a new pane or tab in the existing worktree workspace. It MUST launch a fresh agent session. It MUST NOT send instructions to, resume, or reuse an earlier implementation, review, or fixer session.

Review the exact source commit recorded in the review handoff. A verdict is valid only for that commit. A later source commit invalidates the verdict until a new review completes.

Use immutable review artifacts for every review attempt. Never overwrite an earlier review. Store the current PR draft and implementation log as projections of the receipt history, not as the source of truth.

Every commit made by a worktree playbook MUST use the `writing-and-creating-git-commits` skill. Every commit title MUST contain the resolved issue reference. This applies to source commits, workflow-artifact commits, tracker-state commits, and the final merge commit.

# Rule 0: resolve the project issue tracker

For every local Markdown file used by a worktree workflow, use `agent-core:mq-query` to locate, read, filter, select, list, summarise, or validate its content. Load the matching mq-query task reference and required upstream reference first. Do not use `grep`, `find`, `rg`, `fd`, `ls`, shell globs, or an ad hoc Markdown parser for that work.

Before loading tracker configuration or reading or changing a ticket, apply the **Mandatory ticket-resolution preamble** in `files/devtools/agent/bundles/matt-pocock/skills/reading-and-writing-tickets/SKILL.md`. Run the shared-context CLI from the repository being worked on, set `ALIGNMENT_ROOT` to the CLI-reported `root`, and read `docs/agents/issue-tracker.md` from that root. Pass the CLI-reported `root`, `storage`, and repository root to the ticket skill. Do not derive `ALIGNMENT_ROOT` or a tracker path from the repository path, ticket ID, origin slug, configuration, or environment. That skill owns ticket selectors, backend resolution, schema, paths, reads, claims, review artifacts, comments, completion, and tracker commits. This skill owns only the Worktrunk workflow.

# Rule 1: detect the muxer

MUST resolve the muxer before routing or running a playbook, every time, in this order:

1. Look for a `<worktree-session muxer="..." agent="...">` tag already in context.
2. If absent or stale, run:
   ```bash
   scripts/router.ts detect-muxer
   ```

Either source gives `herdr`, `zellij`, `tmux`, `hrdx`, or `unknown-muxer`. If detection is wrong, pass `--muxer <actual>` to `route`.

# Rule 2: detect the agent

Use the same tag-first order. If the tag is absent or stale, run:

```bash
scripts/router.ts detect-agent
```

Either source gives `claude`, `pi`, or `unknown-agent`. zot has no confirmed signal. Pass `--agent zot` when the caller knows better.

# Route

Resolve the issue tracker before following a playbook that reads or updates a ticket. The playbook receives the resolved `ticket` and `tracker path` as working context.

```bash
scripts/router.ts route "$ARGUMENTS" --muxer <resolved-muxer> --agent <resolved-agent>
```

Always pass `--muxer` and `--agent` explicitly. The command resolves the subcommand and prints JSON: `{ match, subcommand, remainder, muxer, agent, playbook, muxerContract, agentContract }` on success, or `{ match: false, request }` with a non-zero exit on no match.

## On match

1. Read `references/receipts.md`.
2. Read `references/playbooks/<subcommand>.md`.
3. Read `muxerContract` where the playbook opens, waits for, or releases a pane.
4. Read `agentContract` where the playbook launches an agent.
5. If `muxer` is `unknown-muxer` or `agent` is `unknown-agent` and no override was given, ask the user. Do not guess.

## On no match

Read the six files under `references/playbooks/` and choose the playbook whose goal best matches the request. State which one you chose and why. Ask if two are equally plausible.

# Worktrunk owns worktrees

Every playbook, muxer contract, and agent contract MUST use Worktrunk (`wt`) for creating, switching, removing, and merging worktrees. None may call `git worktree` directly.

# Troubleshooting

Known failure modes live in `references/troubleshooting/`:

- `wt-hook-approval-needed.md`
- `fixer-agent-blocked.md`
- `missing-review-verdict.md`
- `muxer-or-agent-undetected.md`

UserRequest: $ARGUMENTS
