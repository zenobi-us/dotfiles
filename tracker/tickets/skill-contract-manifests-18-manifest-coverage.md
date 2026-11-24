---
schemaVersion: tracker-ticket/v2
blocked_by:
  - skill-contract-manifests-11-artifact-sharing
  - skill-contract-manifests-14-homeassistant
  - skill-contract-manifests-15-plain-language
  - skill-contract-manifests-16-web-design-metadata
  - skill-contract-manifests-17-report-generation
  - skill-contract-manifests-20-godot-session-decision
  - skill-contract-manifests-21-campaign-persistence
  - skill-contract-manifests-22-review-body-boundary
  - skill-contract-manifests-23-domain-records
  - skill-contract-manifests-24-learning-records
  - skill-contract-manifests-25-triage-records
  - skill-contract-manifests-26-canon-records
  - skill-contract-manifests-27-character-records
  - skill-contract-manifests-28-continuity-records
  - skill-contract-manifests-29-faction-records
  - skill-contract-manifests-30-narrative-workspace
  - skill-contract-manifests-31-story-records
  - skill-contract-manifests-32-world-records
  - skill-contract-manifests-33-cleanup-records
  - skill-contract-manifests-34-pr-results
  - skill-contract-manifests-35-release-metadata
  - skill-contract-manifests-36-comfy-director
  - skill-contract-manifests-37-cloudflare-interchange
  - skill-contract-manifests-38-research-records
id: skill-contract-manifests-18-manifest-coverage
parent: skill-contract-manifests
sequence: 18
title: Complete manifest coverage for other maintained skills
triage: ready-for-agent
type: enhancement
work_status: "claimed"
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


- Owner follow-up published from the [recovery assessment](../../workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/owner-requests.json). New tickets 19–38 cover the retained owner work; report generation reuses ticket 17. Direct blockers now name unfinished prerequisites. The Godot integration decision depends on the shared preference contract, so this closeout depends on the decision rather than repeating its transitive prerequisite. Keep this ticket claimed and preserve all acceptance criteria and historical receipts. Complete the cross-skill guidance/examples check here after the owner slices deliver; do not create an empty documentation-only task.
