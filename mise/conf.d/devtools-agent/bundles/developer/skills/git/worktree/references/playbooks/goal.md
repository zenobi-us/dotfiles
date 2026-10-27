# Playbook: goal

Resolve an initiative or explicit ticket collection into a scoped OMP goal. Supply the interview and execution instructions directly. Keep this session as coordinator.

## Invocation and boundary

Start from OMP's guided-goal interview:

```text
/guided-goal use worktree goal skill to work through the ticket-slug-001 items
/guided-goal use worktree goal skill to work through the initiative-id items
```

For a ticket collection, name each ticket ID. `/skill:worktree goal <initiative-id>` and `/skill:worktree goal <ticket-id> [<ticket-id> ...]` load the same instructions directly. Natural-language requests that name the worktree goal skill must reach this playbook even without a subcommand invocation.

During the interview or a standalone invocation, perform read-only preparation. Read the selected records, repository configuration, and workflow history. Do not claim tickets, create worktrees, write receipts, commit, fetch, merge, push, or launch agents. Do not create missing specs or tickets.

Give the current interview the resolved objective, success criteria, verification, boundaries, and stop conditions below. Do not generate another `/guided-goal` prompt or ask the user to restart the interview. A standalone invocation returns these instructions without activating goal mode. Execution starts only when the current goal is active and its scope, operations, ownership, and limits have explicit user approval. Naming this skill alone does not authorize merge or push.

## Resolve the scope

1. Load `shared-context`, `reading-and-writing-tickets`, `references/issue-tracker.md`, and the ticket skill's read/list procedures and configured store reference. Use `mq-query` for every local Markdown operation.
2. Resolve the target repository and its context route table. Read its tracker configuration, relevant context, and ADRs. Run installed skill scripts by absolute path from this target repository, not from the skill directory.
3. Resolve selectors through the ticket skill and shared-context. Accept one initiative ID or one or more explicit ticket IDs. For a ticket collection, freeze exactly the named tickets; do not expand to their initiative, descendants, or outside blockers. Ask only if a selector is missing, ambiguous, mixes an initiative with tickets, or cannot be resolved. If no selector is supplied, use the initiative listing procedure in [tasks](tasks.md), then ask for a selector.
4. Read the initiative through the ticket skill's initiative procedure and configured backend. For Local Markdown, resolve its directory with `resolve initiative --id <initiative-id> --json` and verify that `index.md` exists. The index is the complete specification and authoritative child list, not a pointer requiring a separate specification file. Validate child membership and read an optional execution plan. Hosted initiatives use their configured native specification record.
5. For explicit tickets, read each record through the configured ticket backend. Retain canonical references and linked requirements, specifications, and plans. Tickets with complete requirements and acceptance criteria do not require an initiative or a separate specification. Report missing required records or an empty executable scope instead of inventing them.

## Prepare the dependency graph

1. Follow the configured backend's graph procedure in [tasks](tasks.md). For local Markdown, use the ticket skill's absolute `scripts/dep-tree-cli.ts` path with `markdown <repository-root> --initiative <initiative-id>` for an initiative, or `markdown <repository-root> --ticket <ticket-id>` for each explicit ticket. Combine graph records by canonical ticket ID. Pass the target repository root, not the alignment root.
2. Read every selected ticket through the ticket skill. Record its ID, canonical reference, readiness, work status, direct blockers, acceptance criteria, and validation requirements. Determine initiative membership from its authoritative index and tracker metadata, not from titles or graph position alone. For explicit collections, the named IDs define membership.
3. Freeze the selected ticket IDs as the proposed execution scope. Classify traversed blockers outside that scope separately. Do not add an outside prerequisite to the scope merely because graph traversal found it.
4. Reject missing blocker records, self-edges, cycles, ambiguous membership, and incomplete graph coverage. An empty graph is not proof of completion. Report exact blockers to the current interview or active goal; keep execution gated until they are resolved.
5. Build the recovery map in [Goal recovery and scheduling](../goal-recovery.md). Classify completed work, new starts, safe phase resumptions, active sessions, ownership questions, and inconsistent state. Include exact source/review identities and consumed receipt references. Do not reduce eligibility to unclaimed tickets.
6. Read any existing coordinator journal using the contract in `references/receipts.md`. Preserve its run ID, frozen scope, ownership approvals, counters, outstanding reservations, and OMP accounting. Reconcile the proposed scope with that run; scope changes require explicit approval.
7. Recover authorized existing workflows before new starts, with canonical ticket ID as tie-breaker. Re-read direct blockers for every action. If nothing can start, resume, or progress through observed active work, report the blocking frontier. Completed labels with unfinished cleanup or missing finish receipts require reconciliation, not blanket skipping.

If all tickets have verified terminal finish and acceptance evidence, report completion verification rather than proposing a new implementation run.

## Prepare validation and execution policy

1. Read ticket acceptance criteria, the spec, repository tasks, and project Worktrunk configuration. Identify exact per-ticket validation commands and final integrated checks, including working directories and required evidence. Preserve human/manual checks when required. Do not invent a generic `test` command or run mutating validation during preparation.
2. Resolve the intended base branch and its remote from repository conventions and Worktrunk configuration. Check local state and remote references with read-only commands when needed. Do not assume `main`, `origin`, the current feature branch, or that a local branch is current. Preserve unrelated dirty files.
3. If acceptance criteria are subjective, checks are missing, or the base/remote is ambiguous, finish all reachable preparation and ask one batch of concrete questions in the current interview. Proceed only after the required values are resolved.
4. Read the `worktrunk` and `muxer-subagents` skills. Resolve/read muxer contracts when needed for read-only liveness inspection. Preparation never opens, resumes, or shuts down agents. Flag hook approvals and missing prerequisites without changing configuration.
5. For a first run, propose one ticket at a time, two fix/review cycles per ticket, 30 mutating phase dispatches, and a 500000-token goal budget unless the user gave other limits. For an existing run, use its original totals and derived remaining allowances. Follow the journal's reservation/accounting rules; obtain explicit approval for renewal, uncertain accounting, or takeover. Never replace prior consumption with a new baseline.
6. Ask for explicit approval of the frozen scope, phase operations, scoped commits, squash merge, push, ticket completion, existing workflow adoption, and limits during the current interview. Record the approved base/remote and ownership evidence. Preserve a user-required approval gate before each `finish`; do not promise unattended completion under that policy.

## Supply the goal instructions

Give the current interview resolved facts, not a slash-command template. Include the canonical initiative/specification reference (one record), optional plan reference, frozen ticket IDs and references, repository root, context routes, recovery map, first safe action, active sessions, approved ownership, outside blockers, validation commands and working directories, base/remote, journal/run identity, original limits, consumed counts, and remaining allowances. Preserve user constraints and keep these facts in the goal context so they survive compaction.

If this session already has the same active goal, reconcile it and continue within its existing authority. If the same goal is paused, return recovery context and `/goal resume`; preserve its goal and budget. A replacement goal requires verified remaining token allowance or explicit renewal. Do not start a second goal.

### Objective and success criteria

Implement the frozen ticket set against its authoritative requirements. Every selected ticket must satisfy its acceptance criteria and the configured tracker completion rules. Require successful finish receipts, remote integration evidence, and passing final integrated checks on the approved remote/base branch. Local implementation, a submitted PR, or a completed label alone is insufficient.

### Verification

Use the resolved per-ticket commands, working directories, manual checks, and evidence requirements. Run the final integrated checks on the integrated result. Before goal completion, compare current tracker state, exact reviewed commit/tree, finish receipts, and remote base commit state with every acceptance criterion.

### Execution boundaries

After goal activation and approval, initialize or resume the durable coordinator journal under `references/receipts.md`. Re-resolve physical paths after worktree changes. Use the ticket skill for tracker operations, Worktrunk for worktrees, and `muxer-subagents` for independent sessions.

Execute one ticket at a time through the installed `start`, `review`, `fix`, and `finish` playbooks. Follow [Goal recovery and scheduling](../goal-recovery.md). Before every dispatch, reconcile active sessions, reservations, ownership, readiness, and direct blockers. Recover approved existing workflows before new starts. Start only ready, unclaimed tickets with completed direct blockers. Observe active agents instead of launching duplicates.

Dispatch review after implementation/fix, fix after a matching FAILURE, fresh review after source changes, and finish after matching SUCCESS. Use finish's checkpoint recovery for interrupted integration. Do not repeat verified merge, push, completion, or cleanup. Use explicit phase playbooks, not continue's submit/finish choice. Preserve phase preconditions, independent sessions, receipts, validation, and publication rules.

Keep the source worktree through push and ticket completion with Worktrunk merge's `--no-remove` option. Remove it only when finish permits removal. New worktrees must contain current published tracker context; branch-local snapshots are not shared live state.

Change only code, tests, documentation, and resolved tracker/workflow records required by the frozen tickets. Preserve unrelated user changes. Keep outside prerequisites outside the authorized scope. Do not deploy, alter secrets, force-push, or bypass hook approvals.

### Limits and stop conditions

Follow the journal's reservation and accounting contract. Persist a dispatch reservation before every mutating phase. Failed and unresolved reservations consume allowance. Preserve original baselines and counts across coordinator restarts. Use verified remaining OMP token allowance, not a reset budget. Stop at a reached cap or unverifiable history. Renew limits only with explicit recorded user approval.

Stop for ambiguous requirements, missing/cyclic blockers, incomplete outside prerequisites, untrusted hooks, unresolved conflicts, invalid receipts, failed publication, or uncertain ownership/accounting. Changed reviewed source requires a fresh review. If unfinished tickets cannot start, resume, or progress through observed active work, report blocked, not complete.

Checkpoint the coordinator journal before pausing or reporting blocked/capped. Preserve worktrees and receipts. Ask the user to pause with `/goal pause`. Report ticket, branch, worktree, active child sessions, outstanding reservations, last valid receipts, and next recovery action. Independently launched children require separate inspection and shutdown through the muxer workflow. The OMP token budget is not a hard spending limit for those children.

## Common mistakes

- **Wrong command:** OMP's built-in `/worktree` command is not this skill. Name the worktree goal skill in the interview or use `/skill:worktree goal`.
- **Preparation as execution:** Interview preparation creates no claims, worktrees, goal state, or workflow receipts. Active execution requires explicit scoped approval.
- **Nested interview:** Supply instructions to the current `/guided-goal` interview instead of returning a second prompt.
- **Graph as authority:** A rendered graph does not replace ticket readiness, membership, claim state, or completion evidence.
- **Started DAG as blocked:** An implemented or reviewed ticket can have a safe recovery action even when no ticket is unclaimed.
- **Restart as fresh budget:** Resume the durable run and its consumed reservations; request explicit renewal instead of resetting limits.

