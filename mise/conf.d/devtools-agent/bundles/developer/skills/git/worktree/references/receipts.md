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
write workflow state to `.scratch/`, `<ticket>/local/`, `tracker/`, or `sources/`.

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

Every receipt MUST include:

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

Reject `review` without an implementation receipt, `fix` without the latest persisted `FAILURE`, and `finish` without a `SUCCESS` receipt that covers the current source commit.
