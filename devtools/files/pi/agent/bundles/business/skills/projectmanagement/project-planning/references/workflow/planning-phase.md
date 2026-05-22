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

## Checklist
- [ ] Epic exists and active
- [ ] Stories linked to Epic
- [ ] Epic has inline phase sections
- [ ] Tasks linked to phase and (when applicable) story
- [ ] No unresolved clarification blockers
