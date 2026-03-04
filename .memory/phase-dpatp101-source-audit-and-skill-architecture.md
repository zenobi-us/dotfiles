---
id: dpatp101
title: Source audit and skill architecture
epic_id: dpat2601
created_at: 2026-03-04T16:46:07+10:30
updated_at: 2026-03-04T20:57:30+10:30
status: in-progress
start_criteria: Epic dpat2601 approved and scope constraints confirmed by human.
end_criteria: Human-approved phase brief with source boundaries, pattern shortlist, and skill template contract.
---

# Source audit and skill architecture

## Overview
Audit Refactoring.Guru design-pattern material, define what can be transformed into internal skill artifacts, and produce a curriculum architecture that maps pattern intent to coding-agent actions.

## Deliverables
- Source audit notes with explicit attribution and derivative-content boundary decisions.
- Proposed pattern rollout plan (pilot subset + full-pack path).
- Canonical skill template for pattern-derived skills.
- Evaluation checklist for pattern fit and misuse detection.

## Tasks
- [task-dpat1101-audit-refactoring-guru-sources-and-boundaries.md](task-dpat1101-audit-refactoring-guru-sources-and-boundaries.md)
- [task-dpat1102-design-pattern-skill-schema-and-template-contract.md](task-dpat1102-design-pattern-skill-schema-and-template-contract.md)

## Dependencies
- Access to Refactoring.Guru catalog pages.
- Existing skill conventions under `/home/zenobius/.pi/agent/skills`.
- Human review decision on priority relative to active epics.

## Completion Snapshot
- Task completion: 2/2 (`dpat1101`, `dpat1102`).
- Produced artifacts linked to this phase:
  - `research-dpatr002-refactoring-guru-content-usage-boundaries.md`
  - `research-dpatr003-design-pattern-skill-schema-contract.md`
  - `research-dpatr004-design-pattern-skill-template-canonical.md`
- Remaining gate: human review packet + go/no-go to enter `dpatp102`.

## Next Steps
1. Package pilot shortlist (Strategy, Factory Method, Observer) + rubric into review packet.
2. Run human review for `dpatp101` closeout.
3. On approval, start `dpatp102` pilot skill authoring.
