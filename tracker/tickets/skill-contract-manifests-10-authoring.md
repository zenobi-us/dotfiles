---
schemaVersion: tracker-ticket/v2
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-10-authoring
parent: skill-contract-manifests
sequence: 10
title: Update skill-authoring rules
triage: ready-for-agent
type: enhancement
work_status: "claimed"
---

## What to build

Teach and check the shared contract policy through canonical skill-authoring guidance and behavioural scenarios.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Update canonical guidance, anatomy rules, checklists, and behavioural scenarios together. Keep the compatibility alias as an alias, not a second policy owner.
- [ ] Require authors to identify independently consumed structured inputs and outputs, ownership, authoritative definitions, validators, compatibility, manifests, and upgrade policies.
- [ ] Cover independent produces and accepts declarations, explicit empty collections, schemaVersion record-family identifiers, historical definitions, and safe upgrade boundaries.
- [ ] Exclude ordinary prose and opaque assets unless consumers depend on their structure or meaning. Preserve external format ownership.
- [ ] Run baseline and pressure scenarios that show correct contract scope and refusal of ambiguous, lossy, or decision-dependent automatic conversion. Update the authoring skills own applicable manifests.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments


2026-11-22T06:16:10.429Z — Review SUCCESS. Commit: `e3f54b7b2a8e71b12b70399c95261128a95468f2`. Tree: `1b993463da850f5d389927a481609980ff972001`. [Review artifact](../../workflows/skill-contract-manifests-10-authoring/artifacts/reviews/review-review-0006.md).
