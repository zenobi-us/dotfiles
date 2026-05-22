# Closing Phase

## Entry
- Epic work complete or intentionally stopped

## Exit
- Epic closed
- Artifacts reconciled
- Ready for retrospective

## Required
- Ensure all tasks/stories finalized with valid status.
- Ensure unresolved decisions are linked for retrospective review.
- Distill key learning artifacts from completed work.
- Artifact filenames and artifact links MUST conform to filename conventions before closure.
- More details: see [Filename Conventions](../filename-conventions.md).
- Closing MUST stop for human review before retrospective begins.
- Agent MUST print a closeout review-request block containing: final statuses, unresolved decisions, learning summary, and explicit approval question.
- Agent MUST wait for explicit human confirmation before continuing.

## Validation
- [ ] Epic status finalized
- [ ] Story/task states consistent
- [ ] Unresolved decisions linked
- [ ] Learning artifacts captured
- [ ] Filenames and links conform to filename conventions

## Human Review Gate
- [ ] Closeout review-request block printed
- [ ] Human approval captured
- [ ] Approval source recorded (message/reference)