# Changes

## 2026-11-25

- Declare snapshot, reference-report and rename-map contracts with explicit historical readers.
- Produce v2 snapshot and JSON reference-report envelopes with `schemaVersion`.
- Validate rollback and rename-map input before network access. Add offline `validate-record`.
- Preserve saved evidence and reject existing snapshot and JSON report output paths. Keep remote approval boundaries unchanged.
- Isolate doctor tests from live credentials. Exercise controlled snapshot and rollback operations.

