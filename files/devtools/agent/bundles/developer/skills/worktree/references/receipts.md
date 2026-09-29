# Worktree receipts

Use receipts as the durable record for every worktree phase.

## Rules

- Create one receipt for every `start`, implementation completion, `review`, `fix`, and `finish` event.
- Store receipts under the ticket anchor returned by the shared-context CLI.
- Use an append-only `events/` directory. Never overwrite an event or review receipt.
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
status: completed
```

Implementation receipts MUST also record changed files, validation results, the implementation summary, and open questions.

Review receipts MUST also record `verdict: SUCCESS|FAILURE` and every finding with an ID, severity, ADR reference, file, line, description, required change, and validation command.

Fix receipts MUST record the consumed review receipt IDs, resolved finding IDs, unresolved finding IDs, validation results, and the new source commit.

## Projections

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
