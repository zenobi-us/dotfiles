---
blocked_by: 
  - idea-capture-and-conversion-05-to-spec
id: idea-capture-and-conversion-07-corrections
parent: idea-capture-and-conversion
schema: tracker-ticket/v1
sequence: 7
title: Correct converted ideas without losing valid coverage
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Support approved corrections to ideas that already have grilling and destination coverage. The agent analyzes a proposed adjustment before it recommends a new idea or a correction. The user retains authority over concept checklist changes.

Prefer a new idea when the adjustment introduces new intent. If an approved correction improves accuracy without changing meaning or confirmed coverage, preserve the idea's done status. If meaning or coverage changes, reopen only the affected concepts for new grilling and coverage confirmation.

## Acceptance criteria

- **Agent analysis:** Compare the adjustment with existing stated intent and confirmed concepts. Distinguish a new desired outcome from a correction that improves accuracy.
- **New-idea default:** Recommend a new idea for new intent. Do not create it without an explicit capture request or silently add its scope to a completed idea.
- **Approval required:** Present corrections before writing concept checklist changes. Research can still attach supporting links under its existing authority, but it cannot approve scope changes.
- **Stable identity:** Preserve concept identifiers, original user text, exploration records, and destination references when they remain valid. Reordering alone does not create new concepts.
- **Harmless correction:** An approved accuracy correction can retain completed grilling, confirmed coverage, and done status when meaning and coverage stay unchanged.
- **Changed meaning:** An approved correction that changes meaning or questions confirmed coverage reopens the idea and invalidates only the affected concept confirmations.
- **Selective grilling:** Affected concepts require new grilling and coverage confirmation. Unaffected concepts retain valid confirmations and do not repeat completed interviews.
- **Evidence preservation:** Keep prior research and grilling records and destination links available as history. An old destination reference does not automatically restore current coverage.
- **User-visible state:** Fresh reads and Herdr show revised concept coverage and open or done status accurately. Existing destination implementation progress does not determine idea status.
- **Safe reconversion:** Subsequent /to-spec or shared coverage operations enforce the current concept state. Stale approval cannot finish the changed idea.
- **Independent delivery:** This behavior works with initiative destinations and the shared coverage contract before tickets-only conversion is implemented.

## Verification

Start with a real done idea whose initiative covers several confirmed concepts. Apply an approved accuracy correction and observe unchanged coverage and status. Then approve a meaning-changing correction for one concept and observe selective reopening.

Grill that concept again, confirm current destination coverage, and observe done status return. Confirm that the other concepts retain their valid records. For a new desired outcome, observe a new-idea recommendation without implicit capture.

Add deterministic behavior cases for approved versus unapproved corrections, meaning changes, harmless wording changes, evidence retention, stable identifiers, and stale confirmation rejection. Use public tracker operations and observe the refreshed Herdr surface for coverage and status.

## Scope boundaries

Do not change destination specifications silently, delete exploration history, or reopen ideas because implementation remains incomplete. Do not depend on /to-tickets conversion or change worktree behavior.

## Comments

The user approved this slice after shared coverage exists. It can proceed independently of tickets-only conversion.

