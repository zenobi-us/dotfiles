# Planning Phase

**Purpose:** define WHAT (stories) and WHEN (phases), then produce executable tasks.

## Entry
- Project exists

## Exit
- Stories approved
- Planned tasks are in `status: todo`
- Every task has `phase_id`

## Sequence
1. Idea (optional but recommended under uncertainty)
2. Epic (required)
3. Story Definition (required, phase-agnostic)
4. Phase Planning (phase sections in Epic, required)
5. Task Breakdown (required)
6. Research/Decision as needed

## Hard Gates
- Story MUST include acceptance criteria + test specification.
- Task MUST include `phase_id`; `story_id` SHOULD exist unless infra/exploratory.
- Unresolved strategic decisions MUST be escalated to Q.
- Artifact filenames and artifact links MUST pass filename convention checks before planning exits.
- More details: see [Filename Conventions](../filename-conventions.md).
- Planning MUST stop for human review before execution begins.
- Agent MUST print a clear review-request block containing: scope, planned phases, task list, unresolved decisions, and explicit approval question.
- Agent MUST wait for explicit human confirmation before continuing to execution.

## Checklist
- [ ] Epic exists and active
- [ ] Stories linked to Epic
- [ ] Epic has inline phase sections
- [ ] Tasks linked to phase and (when applicable) story
- [ ] No unresolved clarification blockers
- [ ] Filenames and links conform to filename conventions

## Human Review Gate
- [ ] Review-request block printed
- [ ] Human approval captured
- [ ] Approval source recorded (message/reference)