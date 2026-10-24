# Worktree receipts

Use receipts as the durable record for every worktree phase.

## Workflow layout

Resolve the workflow record with:

```sh
shared-context resolve workflow --id <ticket-id> --json
```

Resolve each evidence run separately with:

```sh
shared-context resolve evidence --workflow <ticket-id> --run <run-id> --json
```

Use only:

```text
events/
artifacts/reviews/
artifacts/snapshots/
artifacts/evidence/
projections/
manifest.yaml
```

`events/` is authoritative and append-only. `artifacts/` holds immutable
authored outputs and evidence. `projections/` and `manifest.yaml` are generated
and replaceable. Evidence can use a different store from the workflow. Do not
write workflow state to `.scratch/`, `<ticket>/local/`, the ticket collection, or the source collection.

## Rules

- Create one receipt for every `start`, implementation completion, `review`,
  `fix`, `submit`, and `finish` event.
- The parent playbook MUST create a phase-start receipt before it launches an agent.
- The child agent MUST create one phase-result receipt after it completes its work.
- The parent playbook MUST create one phase-complete receipt after it reads and validates the result receipt.
- Store every receipt under `events/`.
- Never overwrite an event or result receipt.
- Allocate a new receipt ID before every write. Fail when the target path already exists.
- Record the exact source commit and tree that the agent inspected or changed.
- Link each receipt to its parent receipt.
- Treat chat, pane output, and `/tmp` handoffs as transport only. They are not workflow state.
- Treat `manifest.yaml` and `projections/` as generated views.
- Name each review artifact `artifacts/reviews/review-<receipt-id>.md`.

## Receipt fields

Every ticket-phase receipt MUST include:

```yaml
schema: worktree-receipt/v1
receipt_id: review-0003
workflow_id: GH-42
phase: review
attempt: 1
parent_receipt: implementation-0002

repository: /absolute/path/to/repository
worktree: /absolute/path/to/worktree
source_branch: feature/ABC-123-example
base_branch: main
source_commit: 0123456789abcdef
source_tree: 0123456789abcdef
created_at: 2026-09-29T12:00:00Z

muxer: hrdx
workspace_path: /absolute/path/to/worktree
pane_id: 42
agent: pi
session_id: session-id-or-null

ticket:
  backend: github
  id: "42"
  ref: https://github.com/owner/repository/issues/42

workflow:
  store: shared
  root: /resolved/shared/root
  ref: shared://workflows/GH-42

evidence:
  store: repository
  ref: workflows/GH-42/artifacts/evidence/manual-001

ticket_ref: https://github.com/owner/repository/issues/42

inputs:
  - kind: ticket
    ref: https://github.com/owner/repository/issues/42
  - kind: evidence
    ref: workflows/GH-42/artifacts/evidence/manual-001

outputs:
  - kind: receipt
    ref: review-0003

status: completed
```

Every receipt MUST list the durable records it consumed in `inputs`.
Every receipt MUST list the durable records it created in `outputs`.
Temporary handoffs MUST NOT appear as authoritative outputs.

When dispatched by a goal coordinator, every phase handoff and ticket-phase receipt MUST carry `goal_run_id` and `goal_dispatch_ref`. Include the reservation in receipt `inputs`; parent and child phases preserve these fields. A standalone worktree command omits them. Reconciliation may link older receipts through a new coordinator event without rewriting those receipts.

When an input or output references an external evidence object, include its
`sha256` checksum with the stable `ref`. Local file evidence does not need a
checksum.

Implementation receipts MUST also record changed files, validation results, the implementation summary, and open questions.

Review receipts MUST also record `verdict: SUCCESS|FAILURE` and every finding with an ID, severity, ADR reference, file, line, description, required change, and validation command.

Fix receipts MUST record the consumed review receipt IDs, resolved finding IDs, unresolved finding IDs, validation results, and the new source commit.

## Receipt protocol

1. Resolve the workflow root before selecting a receipt ID.
2. List the existing receipt IDs under `events/`.
3. Select the next unused sequence number.
4. Write a new file under `events/` with `--no-clobber` or the equivalent
   atomic operation.
5. Read the receipt after writing it.
6. Stop when a required field is missing or the target path exists.

Use these phase result values for `status`:

```text
completed
failed
blocked
```

Use `FINISHED` or `FINISH_FAILED` for terminal finish receipts. The example above shows the normal `completed` value.

Use these finish result states:

```text
FINISHED
FINISH_FAILED
```

A phase-complete receipt MUST link to the phase-result receipt. A projection MUST
NOT replace a receipt.

The append-only history under `events/` is the workflow record.

## Terminal finish receipt

A terminal finish receipt MUST use these fields:

```yaml
merged_commit: abc123
pushed: true
ticket_completed: true
worktree_removed: true
workspace_closed: true
```

When finish fails, it MUST also record:

```yaml
failure_step: push
failure_reason: ...
worktree_preserved: true
workspace_preserved: true
```

## Finish checkpoints and integration evidence

Use the ticket receipt envelope for append-only finish checkpoints. Set `phase: finish`, `status: FINISHING`, and `checkpoint` to the last verified boundary: `prepared`, `merged`, `pushed`, `ticket_completed`, or `worktree_removed`. Record `next_step`. Append `FINISH_FAILED` on failure; never erase earlier checkpoints.

Before merge, record `review_receipt`, `reviewed_source_commit`, `reviewed_source_tree`, `base_before`, `base_branch`, `remote`, `remote_ref`, and `expected_merge_tree`. Compute the expected clean squash result from the reviewed source and recorded base without changing the working tree. If the merge is ambiguous or conflicts, stop. Record the proposed merge message and its ticket reference before invoking Worktrunk.

After merge, record `merged_commit`, `merged_tree`, and its actual parents. The merge must have the recorded base as its sole parent and the expected tree. A ticket reference or matching file names alone is not integration evidence. Record integrated validation commands, working directories, and results.

After push, record `remote_observed_commit` and evidence that `merged_commit` is reachable from it on the named remote ref. Later legitimate commits on the base do not invalidate reachability. After ticket completion, record the canonical tracker reference, observed state, and publication evidence required by its backend. Record actual worktree/workspace identity and removal observations.

If a process stopped after a mutation but before its checkpoint, inspect actual state before retrying. Recover a missing merge checkpoint only if one unique commit is identified by the prepared base parent, expected tree, and recorded merge identity. Reconcile remote and tracker state independently. If evidence cannot establish a boundary, request human input rather than repeat a potentially completed mutation.

Older receipts remain readable. Missing recovery fields are not permission to fabricate evidence. Require independently verifiable evidence or human recovery instructions.

## Goal coordinator journal

This journal is not a ticket-phase receipt. Resolve its workflow with `resolve workflow --id goal-<initiative-id> --json`. Verify that the returned location does not hold another workflow. Preparation reads existing journal events only. Create the journal after the user authorizes execution.

Store append-only YAML events under that workflow's `events/`, with schema `worktree-goal/v1`. Use the receipt protocol's exclusive, no-clobber writes and parent links. Keep projections replaceable. Every event records its unique ID, parent event, timestamp, repository identity, canonical initiative reference, frozen ticket references, workflow store/ref, coordinator session/muxer identity, and event kind.

The first `goal_started` event records the run ID, initial ticket receipt baseline, takeover approvals, per-ticket fix limit, dispatch limit, configured token budget, and associated OMP session/goal ID. The run ID survives coordinator restarts. A new invocation for the same unfinished initiative resumes that run; it does not create fresh allowances.

Before each mutating phase, append a `dispatch_reserved` event with ticket ref, phase, attempt, consumed receipt refs, exact source commit/tree when available, and remaining allowances. The reservation consumes one dispatch even if launch fails or the process stops before a ticket receipt appears. A `fix` reservation also consumes one fix cycle for that ticket. Link the phase-start receipt in a later `dispatch_observed` event. Preserve failed and unresolved reservations; never reserve a duplicate while a prior dispatch could still be active.

Append `dispatch_reconciled` after validating the phase result and parent completion receipts. A child marker or result receipt alone is not a completed parent phase. Recover a missing parent completion only from verified result, artifacts, validation, and agent shutdown; record the reconciliation without relaunching the child.

Derive consumed allowances from reservations in this run, not from chat memory or replaceable projections. Resume from the original baseline. Refuse dispatch when the cap is reached or the event chain cannot establish the count. An explicit `limits_renewed` event must record user approval, prior consumption, and the new total limits; preserve all history.

Record observed OMP token usage and its session/goal identity in checkpoints. On the same OMP goal, retain its runtime budget/accounting. Before creating a replacement goal, establish prior consumption from saved authoritative OMP accounting and carry forward only the remaining allowance. If exact accounting is unavailable, request explicit budget renewal; a lower-bound snapshot is not proof of remaining budget. Independent child spending is not bounded by this token budget.

Only one coordinator may write for a run. Verify recorded owner liveness through the muxer contract before taking ownership. A live coordinator must be observed or explicitly handed off, not duplicated. An absent or unverifiable owner requires recorded takeover approval before a new owner event. Do not infer ticket ownership from `claimed` alone. Record which ticket workflows the user permits this run to adopt; claiming or changing ownership remains the ticket skill's operation.

Append a checkpoint at pause, blocked, capped, and completion boundaries. Record outstanding dispatches, active agents, latest valid ticket receipts, recovery actions, and accounting evidence. Publish journal events according to the resolved store's rules. A journal write/publication failure blocks further dispatch.

## Projection requirements

`manifest.yaml` MUST contain:

```yaml
schema: worktree-workflow/v2
workflow_id: ABC-123
ticket_ref: https://github.com/owner/repository/issues/42
initiative: example-initiative
event_root: events
artifact_root: artifacts
projection_root: projections
latest_receipt: finish-0031
state: FINISHED
```

Use `null` for `initiative` when no initiative applies.

`projections/pr-draft.md` MUST contain:

- ticket summary;
- problem statement;
- implementation summary;
- changed files;
- validation results;
- review history;
- resolved findings;
- remaining findings;
- latest reviewer verdict;
- merge status;
- links to all supporting receipts and artifacts.

`projections/implementation-log.md` MUST contain:

- implementation and fix receipt history;
- changed files by phase;
- validation results by phase;
- unresolved questions.

`projections/latest-status.yaml` MUST contain:

```yaml
schema: worktree-latest-status/v1
workflow_id: ...
ticket: ...
state: ...
latest_receipt: ...
latest_source_commit: ...
latest_source_tree: ...
latest_review_verdict: SUCCESS|FAILURE|null
open_findings: []
```

## Snapshots and projections

Create versioned draft snapshots under `artifacts/snapshots/`, for example:

```text
artifacts/snapshots/pr-draft-0002.md
artifacts/snapshots/pr-draft-0004.md
```

Regenerate these convenience views after each implementation or fix:

```text
projections/pr-draft.md
projections/implementation-log.md
projections/latest-status.yaml
```

A projection MUST link to the receipts and review artifacts that support it. A later projection MUST NOT remove earlier review history.

## State transitions

The valid sequence is:

```text
CREATED → IMPLEMENTING → IMPLEMENTED → REVIEWING
REVIEWING → REVIEW_FAILED → FIXING → FIXED → REVIEWING
REVIEWING → REVIEW_PASSED → FINISHING → FINISHED
```

Reject `review` without an implementation receipt, `fix` without the latest persisted `FAILURE`, and a new merge without a `SUCCESS` receipt that covers the current source commit and tree. After a verified merge, finish recovery uses the recorded reviewed-source-to-integration mapping; source-worktree removal does not invalidate that durable evidence.
