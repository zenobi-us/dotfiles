# Worktree receipts

Use receipts as the durable record for every worktree phase.

## Rules

- Create one receipt for every `start`, implementation completion, `review`, `fix`, `submit`, and `finish` event.
- The parent playbook MUST create a phase-start receipt before it launches an agent.
- The child agent MUST create one phase-result receipt after it completes its work.
- The parent playbook MUST create one phase-complete receipt after it reads and validates the result receipt.
- Store receipts under the ticket anchor returned by the shared-context CLI.
- Use an append-only `events/` directory. Never overwrite an event or result receipt.
- Allocate a new receipt ID before every write. Fail when the target path already exists.
- Record the exact source commit and tree that the agent inspected or changed.
- Link each receipt to its parent receipt.
- Treat chat, pane output, and `/tmp` handoffs as transport only. They are not workflow state.
- Treat `projections/` as generated views. The receipt history is authoritative.

## Receipt fields

Every receipt MUST include:

```yaml
schema: worktree-receipt/v1
receipt_id: review-0003
ticket: ABC-123
workflow_id: ABC-123
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

context_root: /resolved/context/root
context_storage: repository
ticket_path: /resolved/ticket/path

inputs:
  - kind: ticket
    ref: ABC-123

outputs:
  - kind: receipt
    ref: review-0003

status: completed
```

Every receipt MUST list the durable records it consumed in `inputs`.
Every receipt MUST list the durable records it created in `outputs`.
Temporary handoffs MUST NOT appear as authoritative outputs.

Implementation receipts MUST also record changed files, validation results, the implementation summary, and open questions.

Review receipts MUST also record `verdict: SUCCESS|FAILURE` and every finding with an ID, severity, ADR reference, file, line, description, required change, and validation command.

Fix receipts MUST record the consumed review receipt IDs, resolved finding IDs, unresolved finding IDs, validation results, and the new source commit.

## Receipt protocol

1. Read the ticket anchor before selecting a receipt ID.
2. List the existing receipt IDs in the anchor.
3. Select the next unused sequence number.
4. Write a new file with `--no-clobber` or the equivalent atomic operation.
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

A phase-complete receipt MUST link to the phase-result receipt. A projection MUST NOT replace a receipt.

The append-only receipt history under the ticket anchor is the workflow record. A separate `workflow.yaml` file is optional and MUST NOT become another source of truth.

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

Create versioned draft snapshots under `snapshots/`, for example:

```text
snapshots/pr-draft-0002.md
snapshots/pr-draft-0004.md
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
