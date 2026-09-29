# Separate authoritative records from projections

Accepted. Keep receipts, review artifacts, and draft snapshots as durable history, and generate `projections/pr-draft.md`, `projections/implementation-log.md`, and `projections/latest-status.yaml` from that history. Projections may change; the underlying records must remain append-only.

## Considered Options

- Use the draft PR as the source of truth.
- Keep only the latest workflow status.
- Keep immutable history and mutable generated projections.

We chose separate projections so current views remain easy to read without losing review and fix history.
