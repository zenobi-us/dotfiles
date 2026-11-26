---
schemaVersion: tracker-ticket/v2
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-15-plain-language
parent: skill-contract-manifests
sequence: 15
title: Adopt contracts in plain-language assessments
triage: ready-for-agent
type: enhancement
work_status: "claimed"
---

## What to build

Use explicit contracts throughout assessment inputs, stored findings, evidence, scoring, and audit trend reporting.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Declare independently consumed assessment answers, findings, evidence, maturity results, and audit-state contracts. Include related text-audit producers or consumers when they share these formats.
- [ ] Update producers, validators, scoring, report generation, and consumers together. Declare exact historical detection and supported safe upgrades for existing unversioned formats.
- [ ] Exercise actual assessment commands, report generation, and successive audits. Preserve assessment meaning, scores, evidence citations, limitations, and trend calculations.
- [ ] Preserve historical snapshots and append-only audit meaning. Use explicit readers instead of rewriting immutable historical entries.
- [ ] Read-only access and rejected conversion preserve stored inputs and state. Do not present contract validity or mechanical metrics as ISO compliance.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments


- Review: **FAILURE**. Commit: `a33155b7b6f74e8b2437a1c631578fb500d84eb1`. Tree: `2a365abea33be13b00bcd8cfb92737dfc49a38a6`. Recorded: 2026-11-26T02:25:59.805Z. [Review artifact](../../workflows/skill-contract-manifests-15-plain-language/artifacts/reviews/review-review-0023.md).
