---
id: dpatr005
title: dpatp101 pilot shortlist + rubric review packet
epic_id: dpat2601
phase_id: dpatp101
related_task_id: dpat1103
created_at: 2026-03-04T21:52:21+10:30
updated_at: 2026-03-04T21:52:21+10:30
status: completed
---

# dpatp101 pilot shortlist + rubric review packet

## Research Questions
1. Which pilot patterns best validate the canonical schema across behavior-creation-communication concerns?
2. What rubric should human review use to approve or reject pilot skill authoring entry into `dpatp102`?
3. What explicit decision options and guardrails are required at closeout?

## Summary
This packet proposes a 3-pattern pilot shortlist and a weighted review rubric for `dpatp101` closeout. The shortlist is:
- **Strategy** (behavioral decision swapping)
- **Factory Method** (creational decoupling)
- **Observer** (event-driven coordination)

Recommended approval threshold: **≥ 80/100**, with all hard gates passing.

## Findings

### 1) Pilot shortlist rationale

#### Strategy
- High signal for policy/algorithm interchange decisions in agent workflows.
- Exercises applicability vs over-engineering checks from `research-dpatr003-design-pattern-skill-schema-contract.md`.
- Good baseline for anti-pattern detection (unnecessary abstraction, too few variants).

#### Factory Method
- Tests constructor indirection and extension seams in a way that is easy to misuse.
- Forces clean separation between creation and use, validating implementation checklist quality.
- Captures common coding-agent scenarios where branching object creation logic appears.

#### Observer
- Validates event/pub-sub guidance, unsubscribe discipline, and update propagation tradeoffs.
- Provides stress test for contraindications (accidental hidden coupling, notification storms).
- Good fit for tooling/event systems relevant to this repository context.

### 2) Human review rubric (100 points)

#### A. Boundary compliance (Hard Gate + 25 pts)
- [ ] No direct quotes copied from Refactoring.Guru.
- [ ] No images copied from Refactoring.Guru.
- [ ] Attribution/reference sections present.
- [ ] Guidance rewritten as derivative synthesis (not transcription).

Scoring:
- 25 = all constraints clearly satisfied
- 10 = minor ambiguity needing edits
- 0 = any hard-gate violation

#### B. Schema conformance (25 pts)
- [ ] Frontmatter matches schema contract (`research-dpatr003`).
- [ ] All mandatory sections from canonical template (`research-dpatr004`) present.
- [ ] Verification checklist and misuse checks are actionable.

Scoring:
- 25 = full compliance
- 15 = minor omissions
- 5 = significant missing sections

#### C. Pattern-fit clarity (20 pts)
- [ ] Applicability signals are specific and testable.
- [ ] Contraindications prevent false-positive use.
- [ ] Tradeoffs are explicit enough for go/no-go design choices.

Scoring:
- 20 / 10 / 0

#### D. Implementability for coding-agent workflows (20 pts)
- [ ] Steps can be executed without hidden assumptions.
- [ ] Outputs/checks are concrete and auditable.
- [ ] Examples are conceptual and independent from copyrighted source text.

Scoring:
- 20 / 10 / 0

#### E. Pilot coverage quality (10 pts)
- [ ] Pilot set spans behavioral + creational + coordination concerns.
- [ ] Pilot set is small enough to iterate quickly.

Scoring:
- 10 / 5 / 0

### 3) Decision protocol for dpatp101 closeout
- **Approve `dpatp102`**: score ≥ 80 and all hard gates pass.
- **Approve with conditions**: score 60–79, explicit required edits listed.
- **Reject / hold**: score < 60 or any hard-gate failure.

### 4) Packet contents index
- Boundary policy basis: `research-dpatr002-refactoring-guru-content-usage-boundaries.md`
- Schema contract: `research-dpatr003-design-pattern-skill-schema-contract.md`
- Canonical template: `research-dpatr004-design-pattern-skill-template-canonical.md`
- This review packet: `research-dpatr005-dpatp101-pilot-shortlist-rubric-review-packet.md`

## References
- Internal artifact: `research-dpatr002-refactoring-guru-content-usage-boundaries.md`
- Internal artifact: `research-dpatr003-design-pattern-skill-schema-contract.md`
- Internal artifact: `research-dpatr004-design-pattern-skill-template-canonical.md`
