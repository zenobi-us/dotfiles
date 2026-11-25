# Changes

## 2026-11-25

- Fix SPEC-001: declare cleanup plan v1 historical input and v2 JSON output.
- Keep JSON stdout parseable for nonempty plans by sending cleanup progress to stderr.
- Validate cleanup plans without rewriting history or changing remote state. Preserve rename, group-change and warning evidence.

- Declare snapshot, reference-report and rename-map contracts with explicit historical readers.
- Produce v2 snapshot and JSON reference-report envelopes with `schemaVersion`.
- Validate rollback and rename-map input before network access. Add offline `validate-record`.
- Preserve saved evidence and reject existing snapshot and JSON report output paths. Keep remote approval boundaries unchanged.
- Isolate doctor tests from live credentials. Exercise controlled snapshot and rollback operations.

