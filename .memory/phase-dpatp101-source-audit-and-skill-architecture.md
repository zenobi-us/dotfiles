---
id: dpatp101
title: Source audit and skill architecture
epic_id: dpat2601
created_at: 2026-03-04T16:46:07+10:30
updated_at: 2026-03-04T21:52:21+10:30
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
- [task-dpat1103-produce-dpatp101-pilot-shortlist-rubric-review-packet.md](task-dpat1103-produce-dpatp101-pilot-shortlist-rubric-review-packet.md)
- [task-dpath002-human-review-dpatp101-closeout-and-dpatp102-go-no-go.md](task-dpath002-human-review-dpatp101-closeout-and-dpatp102-go-no-go.md) `[NEEDS-HUMAN]`

## Dependencies
- Access to Refactoring.Guru catalog pages.
- Existing skill conventions under `/home/zenobius/.pi/agent/skills`.
- Human review decision on priority relative to active epics.

## Completion Snapshot
- Task completion: 3/4 (`dpat1101`, `dpat1102`, `dpat1103` complete; `dpath002` pending human review).
- Produced artifacts linked to this phase:
  - `research-dpatr002-refactoring-guru-content-usage-boundaries.md`
  - `research-dpatr003-design-pattern-skill-schema-contract.md`
  - `research-dpatr004-design-pattern-skill-template-canonical.md`
  - `research-dpatr005-dpatp101-pilot-shortlist-rubric-review-packet.md`
- Remaining gate: human go/no-go decision to enter `dpatp102`.

## Next Steps
1. Run human review for `dpatp101` closeout using `task-dpath002-human-review-dpatp101-closeout-and-dpatp102-go-no-go.md`.
2. On approval, start `dpatp102` pilot skill authoring.
