# Retrospective Phase

## Purpose
Capture lessons and close unresolved decision debt.

## Entry
- Epic or project completed

## Exit
- Retrospective status `complete`
- Action items are defined and tracked

## Required
- Link retrospective to closed epic/project.
- Review every `Decision` with `status: unresolved`.
- Produce/refresh Learning artifacts.
- Retrospective completion MUST stop for human review before marking `complete`.
- Agent MUST print a retrospective review-request block containing: successes, failures, lessons, action items, unresolved decisions review, and explicit approval question.
- Agent MUST wait for explicit human confirmation before setting retrospective status to `complete`.

## Capture
- Successes
- Failures
- Lessons
- Concrete process improvements

## Human Review Gate
- [ ] Retrospective review-request block printed
- [ ] Human approval captured
- [ ] Approval source recorded (message/reference)