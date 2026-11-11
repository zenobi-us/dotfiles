---
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-16-web-design-metadata
parent: skill-contract-manifests
schema: tracker-ticket/v1
sequence: 16
title: Adopt contracts in web-design source metadata
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Use an authoritative record-family contract for web-design source metadata and its actual consumers.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Declare source-metadata production or acceptance as applicable, authoritative ownership, validation, historical reading, and supported upgrades.
- [ ] Replace the known numeric schemaVersion identifier through an explicit historical contract and declared conversion. Do not classify an unknown explicit version as unversioned.
- [ ] Exercise actual metadata validation and consumption with the current format, the supported historical format, and rejected invalid identifiers.
- [ ] Preserve source locations, asset associations, capture metadata, and checksums. Do not independently version ordinary design prose or opaque assets without a structural consumer need.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments

