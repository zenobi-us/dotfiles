# Playbook: goal

Prepare a new or partially completed initiative for OMP goal mode. Return a ready-to-send `/guided-goal` prompt, or recovery context for the same paused goal, after read-only preparation.

## Invocation and boundary

Use `/skill:worktree goal <initiative-id>`. The selector identifies one existing shared-context initiative, not a ticket to claim.

This invocation authorizes preparation only. Read the initiative, specification, plan, tickets, repository configuration, and existing workflow records. Do not claim tickets, create worktrees, write receipts, commit, fetch, merge, push, or launch agents. Do not create missing specs or tickets.

The skill cannot dispatch a built-in slash command by printing it. Return the prompt for the user to send in the same interactive OMP session. Do not send it through a shell or silently replace the interview with `omp --goal`. Once the user sends the prompt and the interview finishes, goal mode starts work immediately.

## Resolve the initiative

1. Load `shared-context`, `reading-and-writing-tickets`, `references/issue-tracker.md`, and the ticket skill's read/list procedures and configured store reference. Use `mq-query` for every local Markdown operation.
2. Resolve the target repository and its context route table. Read its tracker configuration, relevant context, and ADRs. Run installed skill scripts by absolute path from this target repository, not from the skill directory.
3. Require exactly one initiative ID. If it is missing, use the initiative listing procedure in [tasks](tasks.md), then ask for a selector. If the collection is absent, report that fact. If extra selectors or an ambiguous ID are supplied, ask which initiative to prepare. Never choose a root implicitly.
4. Run the shared-context CLI with `resolve initiative --id <initiative-id> --json`. The resolver can return a proposed path for an absent record. Verify that the initiative exists before treating it as a resolved input.
5. Read its index and linked specification and plan. Retain their canonical references and actual requirements. A missing optional plan is acceptable if the spec and tickets define the work. A missing specification or executable ticket set is a preparation blocker; report the exact missing record instead of inventing one.

## Prepare the dependency graph

1. Follow the configured backend's graph procedure in [tasks](tasks.md). For local Markdown, use the ticket skill's absolute `scripts/dep-tree-cli.ts` path with `markdown <repository-root> --initiative <initiative-id>`. Pass the target repository root, not the alignment root.
2. Read every selected ticket through the ticket skill. Record its ID, canonical reference, readiness, work status, direct blockers, acceptance criteria, and validation requirements. Determine initiative membership from its authoritative index and tracker metadata, not from titles or graph position alone.
3. Freeze the selected ticket IDs as the proposed execution scope. Classify traversed blockers outside that scope separately. Do not add an outside prerequisite to the scope merely because graph traversal found it.
4. Reject missing blocker records, self-edges, cycles, ambiguous membership, and incomplete graph coverage. An empty graph is not proof of completion. Stop with the exact preparation blockers; do not emit an execution-ready prompt.
5. Build the recovery map in [Goal recovery and scheduling](../goal-recovery.md). Classify completed work, new starts, safe phase resumptions, active sessions, ownership questions, and inconsistent state. Include exact source/review identities and consumed receipt references. Do not reduce eligibility to unclaimed tickets.
6. Read any existing coordinator journal using the contract in `references/receipts.md`. Preserve its run ID, frozen scope, ownership approvals, counters, outstanding reservations, and OMP accounting. Reconcile the proposed scope with that run; scope changes require explicit approval.
7. Recover authorized existing workflows before new starts, with canonical ticket ID as tie-breaker. Re-read direct blockers for every action. If nothing can start, resume, or progress through observed active work, report the blocking frontier. Completed labels with unfinished cleanup or missing finish receipts require reconciliation, not blanket skipping.

If all tickets have verified terminal finish and acceptance evidence, report completion verification rather than proposing a new implementation run.

## Prepare validation and execution policy

1. Read ticket acceptance criteria, the spec, repository tasks, and project Worktrunk configuration. Identify exact per-ticket validation commands and final integrated checks, including working directories and required evidence. Preserve human/manual checks when required. Do not invent a generic `test` command or run mutating validation during preparation.
2. Resolve the intended base branch and its remote from repository conventions and Worktrunk configuration. Check local state and remote references with read-only commands when needed. Do not assume `main`, `origin`, the current feature branch, or that a local branch is current. Preserve unrelated dirty files.
3. If acceptance criteria are subjective, checks are missing, or the base/remote is ambiguous, finish all reachable preparation and ask one batch of concrete questions. Emit the prompt only after the required values are resolved.
4. Read the `worktrunk` and `muxer-subagents` skills. Resolve/read muxer contracts when needed for read-only liveness inspection. Preparation never opens, resumes, or shuts down agents. Flag hook approvals and missing prerequisites without changing configuration.
5. For a first run, propose one ticket at a time, two fix/review cycles per ticket, 30 mutating phase dispatches, and a 500000-token goal budget unless the user gave other limits. For an existing run, use its original totals and derived remaining allowances. Follow the journal's reservation/accounting rules; obtain explicit approval for renewal, uncertain accounting, or takeover. Never replace prior consumption with a new baseline.
6. Explain the approval boundary before the prompt: sending it authorizes the scoped commits, squash merge, push, and completion that it names. If the user requires approval per merge, preserve that policy and include a human gate before each `finish`; do not promise unattended DAG completion.

## Return the prepared goal

Return the initiative/spec/plan references, frozen ticket IDs, recovery map, first safe action, active sessions, ownership approvals, outside blockers, validation commands, base/remote, and existing journal/run references. Include original limits, consumed counts, and remaining allowances. Keep the summary short; put exact facts in the prompt so it survives context compaction.

Resolve ownership, scope, limit, and accounting questions before emitting an execution-ready prompt. If this session already has the same paused OMP goal, return the recovery context and `/goal resume`; keep the existing goal and budget. If it is already active, report that state without starting a second goal. A replacement goal requires the journal's verified remaining token allowance or explicit renewal.

Otherwise return one fenced text block that begins with `/guided-goal`. Fill every field below with resolved facts. Omit absent optional fields instead of leaving placeholders. Preserve user constraints and existing run identity.

```text
/guided-goal Complete initiative {initiative ID and canonical reference}.

## Objective
Implement the frozen ticket set {IDs and canonical references} against {spec reference} and {plan reference, if present}, in repository {absolute repository root}.
Use the shared-context route table {resolved stores and references}. Re-resolve physical paths during execution; preparation paths are not authority after a worktree change.
I explicitly authorize the worktree workflow's start, review, fix, and finish playbooks for these tickets, including recovery of existing work. Keep this session as coordinator. Follow the installed worktree skill's references/goal-recovery.md and references/receipts.md. Use the ticket skill for tracker operations, Worktrunk for worktrees, and muxer-subagents for independent sessions. Adopt only these existing ticket workflows: {approved ticket refs and approval evidence, or none}.

## Success criteria
Every frozen ticket satisfies its acceptance criteria and has verified completion under the configured tracker rules. Successful finish receipts and remote integration evidence cover the work. Final integrated checks pass on {remote/base branch}. Do not shrink the frozen scope or count external prerequisites as authorized work.

## Verification
Per-ticket checks and working directories: {exact commands/actions and required evidence}.
Final integrated checks and working directory: {exact commands/actions}.
Before goal completion, inspect current tracker state, exact reviewed commit/tree, finish receipts, and remote base commit state. Match every criterion to current evidence. Local implementation, a submitted PR, or a completed label alone is insufficient.

## Boundaries
Execute one ticket at a time. Reconciled recovery map and first safe action: {ticket-to-phase/observe/finish-recovery map with receipt and source identities}. Dependency order for new work: {ordered IDs, or none}. Existing coordinator run/journal: {canonical ref and run ID, or first run}.
Before dispatch, reconcile active sessions, unresolved reservations, ownership, readiness, and direct blockers. Recover authorized existing work before starting new work. For new tickets, select only ready, unclaimed tickets with completed direct blockers. Never start a duplicate implementation or steal a claim.
Use the recovery map to dispatch review after implementation/fix, fix after a matching FAILURE, fresh review after source changes, or finish after matching SUCCESS. Observe active agents instead of launching duplicates. For interrupted finish, use finish's checkpoint recovery; do not repeat verified merge, push, completion, or cleanup. Use explicit phase playbooks, not continue's submit/finish choice. Preserve each phase's preconditions, receipts, validation, and publication rules.
I authorize required scoped commits, local squash merge, push to {remote/base branch}, and ticket completion for the frozen tickets only. {Preserve any user-required approval gate here.}
Keep the source worktree through push and ticket completion: preserve it with Worktrunk merge's --no-remove option, then remove it only when finish permits removal. New worktrees must contain current published tracker context; branch-local snapshots are not shared live state.
Change only code, tests, documentation, and resolved tracker/workflow records required by these tickets. Preserve unrelated user changes. Do not deploy, alter secrets, force-push, bypass hook approvals, or execute outside-scope tickets. Outside prerequisites: {IDs, states, and canonical references, or none}.

## Stop conditions
Initialize or resume the durable coordinator journal only after authorization. Run identity, original baseline, limits, and consumption: {resolved values}. Follow references/receipts.md: persist a dispatch reservation before every mutating phase; failed and unresolved reservations consume allowance. Preserve counts across coordinator restarts. Total limits are {fix-cycle total} fix cycles per ticket and {dispatch total} dispatches; remaining allowances are {per-ticket and total remaining counts}. The OMP token allowance for this goal is {verified remaining or explicitly renewed budget}, not a silent reset. Do not dispatch at a reached cap or with unverifiable history. Renew limits only with explicit recorded user approval.
Stop for ambiguous requirements, missing/cyclic blockers, incomplete outside prerequisites, untrusted hooks, unresolved conflicts, invalid receipts, failed publication, uncertain ownership/accounting, or a reached cap. Changed reviewed source requires a fresh review, not stale fix or finish. If unfinished tickets remain but none can start, resume, or progress through observed active work, report blocked, not complete.
Checkpoint the coordinator journal before pausing or reporting blocked/capped. Preserve the worktree and receipts. Ask the user to pause with /goal pause and report ticket, branch, worktree, active child sessions, outstanding reservations, last valid receipts, and next recovery action. Do not call goal complete when blocked or capped. Independently launched children require separate inspection and shutdown through the muxer workflow. The token budget is not a hard spending limit for those children.
```

For a new or replacement goal, end with: “Send this prompt in the same interactive OMP session. The interview may ask for missing decisions. After it creates the goal, execution starts.” For the same paused goal, end with `/goal resume` and its reconciled next action instead. Preparation never activates or resumes goal mode.

## Common mistakes

- **Wrong command:** OMP's built-in `/worktree` command is not this skill. Use `/skill:worktree goal <initiative-id>`.
- **Preparation as execution:** Preparation creates no ticket claims, worktrees, goal state, or workflow receipts.
- **Printed command as dispatch:** A response containing `/guided-goal` does not activate it. The user sends the prepared prompt.
- **Graph as authority:** A rendered graph does not replace ticket readiness, membership, claim state, or completion evidence.
- **Started DAG as blocked:** An implemented or reviewed ticket can have a safe recovery action even when no ticket is unclaimed.
- **Restart as fresh budget:** Resume the durable run and its consumed reservations; request explicit renewal instead of resetting limits.

