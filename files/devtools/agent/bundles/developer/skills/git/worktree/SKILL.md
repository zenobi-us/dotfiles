---
name: worktree
description: Route a worktree subcommand (start, submit, fix, finish, review, continue, tasks) to its playbook, after detecting the active muxer and agent.
disable-model-invocation: true
user-invocable: true
---

Route `UserRequest` to the correct worktree workflow. This skill dispatches only. It does not resolve tickets, run validation, or launch agents itself. All of that lives in the playbook it points to.

# Global workflow rules


Load `skill://worktree/references/receipts.md` before running a worktree playbook.

Every phase MUST create a durable receipt under the workflow root that the
`skill://shared-context` skill resolves for `<ticket-id>`. Receipts in `events/` are
append-only and authoritative. Chat output, pane output, temporary handoff files,
manifests, and projections are not authoritative workflow state.

Every receipt MUST record the ticket `ref`, workflow ID, phase, parent receipt,
source branch, base branch, exact source commit and tree, workflow store and
reference, muxer, workspace path, agent, pane or session identifier, timestamp,
status, and output references.

`start`, `review`, and `fix` MUST use independent agent sessions. A review or fix MUST run in a fresh agent session in the existing worktree workspace. It MUST NOT send instructions to, resume, or reuse an earlier implementation, review, or fixer session. The `skill://muxer-subagents` skill owns how that fresh session is opened.

Review the exact source commit recorded in the review handoff. A verdict is valid only for that commit. A later source commit invalidates the verdict until a new review completes.

Use one immutable artifact under `artifacts/reviews/` for every review attempt.
Never overwrite an earlier review or copy its body into the tracker. Store
versioned PR drafts under `artifacts/snapshots/`. Resolve manual evidence with
`skiLL://shared-context/scripts/shared-context.ts resolve evidence`; its store can differ from the workflow store.
Store current views under `projections/`.

Every commit made by a worktree playbook MUST use the `skill://writing-and-creating-git-commits` skill. Every commit title MUST contain the resolved issue reference. This applies to source commits, workflow-artifact commits, tracker-state commits, and the final merge commit.

# Rule 0: resolve the project issue tracker

For every local Markdown file used by a worktree workflow, use `skill://mq-query` skill to locate, read, filter, select, list, summarise, or validate its content. Load the matching mq-query task reference and required upstream reference first. Do not use `grep`, `find`, `rg`, `fd`, `ls`, shell globs, or an ad hoc Markdown parser for that work.

Before loading tracker configuration or reading or changing a ticket, apply the
**Mandatory ticket-resolution preamble** in
`skill://reading-and-writing-tickets` skill.

Use the `skill://shared-context` skill to understand where artifacts are stored in the repo concerned.

Set `ALIGNMENT_ROOT` to its reported alignment `root`, and read
`docs/agents/issue-tracker.md` from that root. Pass the route table, alignment
root, mode, and repository root to the ticket skill. Do not derive these values.
The ticket skill owns ticket selectors, backend resolution, schema, references,
reads, claims, comments, completion, and tracker commits. This skill owns review
artifacts, receipts, snapshots, evidence, manifests, and workflow projections.

Resolve the workflow root with
`skill://shared-context/scripts/shared-context.ts resolve workflow --id <ticket-id> --json`. Resolve evidence
separately with
`skill://shared-context/scripts/shared-context.ts resolve evidence --workflow <ticket-id> --run <run-id> --json`.
Use only these paths within the resolved roots: `events/`,
`artifacts/reviews/`, `artifacts/snapshots/`, `artifacts/evidence/`, and
`projections/`. Do not write workflow state into `.scratch/`, `<ticket>/local/`,
`tracker/`, or `sources/`.

# Rule 1: resolve the muxer and agent

Load the `skill://muxer-subagents` skill before any playbook that opens a pane or launches a child agent. It owns muxer detection, agent detection, the spawn contracts, and the fresh-session mechanic.

`skill://muxer-subagents/scripts/router.ts contracts`

Take `muxer`, `agent`, `muxerContract`, and `agentContract` from its output and pass them to the playbook as working context. If it reports `needsOperatorInput: true`, ask the user. Do not guess.

`submit` does not launch an agent. Skip this rule for `submit`.

# Route

Resolve the issue tracker before following a playbook that reads or updates a ticket. The playbook receives the ticket `ref` and backend as working context. For `tasks`, follow its backend-specific dependency-tree procedure; it reads tracker data but does not change tickets.

`skill://worktree/scripts/router.ts route "$ARGUMENTS"`

The command resolves the subcommand and prints JSON: `{ match, subcommand, remainder, playbook }` on success, or `{ match: false, request }` with a non-zero exit on no match. `/worktree tasks [optional ticket id]` routes to `references/playbooks/tasks.md`; it does not resolve the muxer or the agent.

## On match

1. Read `skill://worktree/references/receipts.md`.
2. Read `playbook` from the route output.
3. Apply Rule 1 where the playbook opens a pane or launches an agent.
4. Read `muxerContract` where the playbook opens, waits for, or releases a pane.
5. Read `agentContract` where the playbook launches an agent.

## On no match

Read the six files under `skill://worktree/references/playbooks/` and choose the playbook whose goal best matches the request. State which one you chose and why. Ask if two are equally plausible.

# Worktrunk owns git worktrees

Every playbook, muxer contract, and agent contract MUST use the `skill://worktrunk` for creating, switching, removing, and merging worktrees. None may call `git worktree` directly.

# Troubleshooting

Known failure modes live in `skill://worktree/references/troubleshooting/`:

- `wt-hook-approval-needed.md`
- `fixer-agent-blocked.md`
- `missing-review-verdict.md`

For `unknown-muxer` or `unknown-agent`, see `skill://muxer-subagents/references/troubleshooting/muxer-or-agent-undetected.md`.

