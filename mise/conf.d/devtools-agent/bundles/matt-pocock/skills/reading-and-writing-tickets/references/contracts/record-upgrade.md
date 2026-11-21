---
title: Lossless tracker record upgrades
type: Procedure
---

# Tracker record upgrades

The installed scripts/record-upgrade.ts adapter implements these declared edges. Each ticket source converts only to tracker-ticket/v2. Each initiative source converts only to tracker-initiative/v2. Supported sources are the exact historical v1 and explicit unversioned legacy contracts.

Validate the source before conversion. Remove only the plain identifier line. Preserve its inline comment as a standalone comment. Insert schemaVersion with the destination identifier. Preserve every other byte, including specification text, comments, unknown YAML, numeric spelling, identity, membership links and direct blockers. Compare the raw content with only the identifier removed before persistence. Compare initiative membership under each source and destination reader too. Reject unversioned initiatives whose body links would change membership when only the Tickets section becomes authoritative. Reject unsupported spellings or content that cannot meet this check.

Only mutable Markdown records can convert. Reject immutable records and paths under events, reviews, artifacts or .git. The record identity must match its ticket filename or initiative directory. Historical plans and event chains have readers, not upgrade edges.

The shared safeUpgrade and bulkUpgrade APIs own declaration validation, path selection, locks, byte checks and atomic persistence. Installation and read-only commands never invoke this adapter. Authorize update before calling safeUpgrade. The update request accepts only non-empty title, work_status and triage strings under fields. Structural changes require their existing tracker operation. The destination validator runs after mutation.

Explicit bulk conversion reports each persisted outcome. A rejected item keeps its original bytes. Earlier successful items remain converted when another item fails. A current valid record remains byte-identical.



Ticket update and bulk upgrade preflight the direct parent initiative before persistence. Follow ticket parents for supported hierarchical membership. Validate the complete initiative Tickets index against all direct children. Reject inconsistent membership without changing the selected ticket. Standalone tickets remain supported. Bulk items with unrelated valid membership remain independent.
