# Changelog

## 2026-11-21

- Add the muxer contract manifest and authoritative current and historical definitions.
- Produce schemaVersion-based run, completion, resource, contracts, and spawn records. Keep result-delivery as the sole transport owner.
- Retain immutable completion sequences and owned-process identities during cleanup. Reject terminal changes and unsupported records.
- Add explicit read-only historical reads and waits. Preserve old handoffs without conversion.
- Verify a real desktop spawn, completed wait with an intentionally failed domain result, retrieval, acknowledgement, and confirmed owned-process shutdown.

