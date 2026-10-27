---
name: worktree
description: Route worktree phases and dependency views to their playbooks. Use the goal workflow in a guided-goal interview to complete an initiative or explicit ticket collection.
user-invocable: true
---

Route `UserRequest` to the correct worktree workflow. This skill dispatches only. It does not resolve tickets, run validation, or launch agents itself. All of that lives in the playbook it points to.

# Global workflow rules

- 0. Resolve this installed skill directory as `WORKTREE_SKILL_ROOT`. Script paths are relative to that directory, not the target repository. Invoke `"$WORKTREE_SKILL_ROOT/scripts/router.ts"` directly from the target repository; its shebang selects the runtime.
- 1. Load the `worktree` skill’s `references/receipts.md` file before running a worktree playbook.

Every mutating ticket phase MUST create a durable receipt under the workflow root resolved by
the `shared-context` skill for `<ticket-id>`. `tasks` and goal preparation create no receipts. Receipts in `events/` are
append-only and authoritative. Chat output, pane output, temporary handoff files,
manifests, and projections are not authoritative workflow state.

Every ticket-phase receipt MUST record the ticket `ref`, workflow ID, phase, parent receipt,
source branch, base branch, exact source commit and tree, workflow store and
reference, muxer, workspace path, agent, pane or session identifier, timestamp,
status, and output references.

Goal execution uses the separate coordinator journal contract in `references/receipts.md`. Goal preparation inspects this journal without creating or resetting it. The goal playbook supplies instructions to the current guided-goal interview and coordinates phases only after activation and scoped approval.

`start`, `review`, and `fix` MUST use independent agent sessions. A review or fix MUST run in a fresh agent session in the existing worktree workspace. It MUST NOT send instructions to, resume, or reuse an earlier implementation, review, or fixer session. The `muxer-subagents` skill owns how that fresh session is opened.

Review the exact source commit recorded in the review handoff. A verdict is valid only for that commit. A later source commit invalidates the verdict until a new review completes.

Use one immutable artifact under `artifacts/reviews/` for every review attempt.
Never overwrite an earlier review or copy its body into the tracker. Store
versioned PR drafts under `artifacts/snapshots/`. Resolve manual evidence by
running the `shared-context` skill’s `scripts/shared-context/cli.ts` script with
`resolve evidence`; its store can differ from the workflow store.
Store current views under `projections/`.

Every commit made by a worktree playbook MUST follow the `commit` skill. Ticket-phase commit titles MUST contain the resolved issue reference. This applies to source commits, workflow-artifact commits, tracker-state commits, and the final merge commit. Coordinator-only journal commits use the canonical initiative reference or the frozen ticket references for an explicit collection.

# Rule 0: resolve the project issue tracker

For every local Markdown file used by a worktree workflow, use the `mq-query` skill to locate, read, filter, select, list, summarise, or validate its content. Load the matching mq-query task reference and required upstream reference first. Do not use `grep`, `find`, `rg`, `fd`, `ls`, shell globs, or an ad hoc Markdown parser for that work.

Before loading tracker configuration or reading or changing a ticket, apply the
**Route the request** procedure in the `reading-and-writing-tickets` skill.

Use the `shared-context` skill to understand where artifacts are stored in the repo concerned.

Set `ALIGNMENT_ROOT` to its reported alignment `root`, and read
`docs/agents/issue-tracker.md` from that root. Pass the route table, alignment
root, mode, and repository root to the ticket skill. Do not derive these values.
The ticket skill owns ticket selectors, backend resolution, schema, references,
reads, claims, comments, completion, and tracker commits. This skill owns review
artifacts, receipts, snapshots, evidence, manifests, and workflow projections.

For mutating ticket phases, resolve the workflow root by running the `shared-context` skill’s
`scripts/shared-context/cli.ts` script with `resolve workflow --id <ticket-id> --json`.
When a phase needs evidence, resolve it separately by running the same script with
`resolve evidence --workflow <ticket-id> --run <run-id> --json`.
Use only these paths within the resolved roots: `events/`,
`artifacts/reviews/`, `artifacts/snapshots/`, `artifacts/evidence/`, and
`projections/`. Do not write workflow state into `.scratch/`, `<ticket>/local/`,
the ticket collection, or the source collection.

# Rule 1: resolve the muxer and agent

Load the `muxer-subagents` skill before any playbook that opens a pane or launches a child agent. It owns muxer detection, agent detection, the spawn contracts, and the fresh-session mechanic.

Run the `muxer-subagents` skill’s `scripts/router.ts` script with the `contracts` argument.

Take `muxer`, `agent`, `muxerContract`, and `agentContract` from its output and pass them to the playbook as working context. If it reports `needsOperatorInput: true`, ask the user. Do not guess.

`submit`, `tasks`, and goal preparation do not launch an agent. Skip launch setup for them. Goal preparation may resolve/read contracts for read-only liveness inspection. Authorized goal execution applies launch setup through each mutating phase playbook.

# Route

Resolve the issue tracker before following a playbook that reads or updates a ticket. Mutating playbooks receive the ticket `ref` and backend as working context. `tasks` and `goal` resolve their initiative or ticket selectors through their own procedures.

Run `"$WORKTREE_SKILL_ROOT/scripts/router.ts" route "$ARGUMENTS"` from the target repository.

The command resolves the subcommand and prints JSON: `{ match, subcommand, remainder, playbook }` on success, or `{ match: false, request }` with a non-zero exit on no match. `/skill:worktree tasks [optional ticket id]` routes to `references/playbooks/tasks.md`. `/skill:worktree goal <initiative-id>` and `/skill:worktree goal <ticket-id> [<ticket-id> ...]` route to `references/playbooks/goal.md`. A `/guided-goal` request to use the worktree goal skill loads that playbook directly, with the named selectors, without generating another prompt. Its recovery rules live in `references/goal-recovery.md`.

## On match

1. Read the `worktree` skill’s `references/receipts.md` file.
2. Read `playbook` from the route output.
3. Apply Rule 1 where the playbook opens a pane or launches an agent.
4. Read `muxerContract` where the playbook opens, waits for, or releases a pane.
5. Read `agentContract` where the playbook launches an agent.

## On no match

Read the playbooks named by this router under `references/playbooks/` and choose the one whose goal best matches the request. State which one you chose and why. Ask if two are equally plausible.

# Worktrunk owns git worktrees

Every playbook, muxer contract, and agent contract MUST follow the `worktrunk` skill for creating, switching, removing, and merging worktrees. None may call `git worktree` directly.

# Troubleshooting

Known failure modes live in the `worktree` skill’s `references/troubleshooting/` directory:

- `wt-hook-approval-needed.md`
- `fixer-agent-blocked.md`
- `missing-review-verdict.md`

For `unknown-muxer` or `unknown-agent`, see the `muxer-subagents` skill’s `references/troubleshooting/muxer-or-agent-undetected.md` file.


