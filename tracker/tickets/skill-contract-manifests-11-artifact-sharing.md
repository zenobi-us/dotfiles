---
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-11-artifact-sharing
parent: skill-contract-manifests
schema: tracker-ticket/v1
sequence: 11
title: Adopt contracts in artifact sharing
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Define and use contracts for artifact-share configuration and owned publication metadata.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Declare configuration and independently consumed share metadata contracts, accepted historical formats, and supported upgrades. Keep external package and hosting formats unchanged.
- [ ] Update configuration readers and writers and owned publication metadata producers and consumers together. Introduce a new affected contract version when the wire format changes.
- [ ] Exercise actual configuration reading, authorised configuration changes, and share metadata generation or retrieval through the owning commands.
- [ ] Preserve share names, references, repository settings, authored metadata, and source bytes. Read-only access and rejected conversion leave inputs unchanged.
- [ ] Keep the share access boundary and existing publication requirements intact. Do not use contract validity as publication approval or success.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments

