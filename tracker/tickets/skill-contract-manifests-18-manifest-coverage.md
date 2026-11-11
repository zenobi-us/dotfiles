---
blocked_by: 
  - skill-contract-manifests-01-local-definitions
id: skill-contract-manifests-18-manifest-coverage
parent: skill-contract-manifests
schema: tracker-ticket/v1
sequence: 18
title: Complete manifest coverage for other maintained skills
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Add validated manifests for remaining maintained skills after checking each skills inputs and outputs.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Inventory all maintained skill bundles through their installed skill entry points. Give every maintained skill exactly one contracts.json manifest; do not stop after a pilot.
- [ ] For skills with no applicable contracts, use explicit empty collections. For supported externally owned structured formats, declare acceptance and authoritative definitions without injecting fields into those formats.
- [ ] Reference existing authoritative owners for shared contracts. Do not duplicate domain definitions or absorb the owner-specific migrations covered by the other tickets.
- [ ] If the coverage check finds an additional persistent-artifact owner, stop that portion and request a separate owner-specific ticket. Report the uncovered owner rather than hiding it behind an empty manifest or claiming full coverage.
- [ ] Run the public manifest-validation operation over every maintained skill. Report actual coverage, unresolved definitions, missing owners, and invalid declarations; full coverage requires no unaccounted skill.
- [ ] Keep this slice free of unrelated artifact mutation. Leave existing domain artifacts and installed-skill update behaviour unchanged.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments

