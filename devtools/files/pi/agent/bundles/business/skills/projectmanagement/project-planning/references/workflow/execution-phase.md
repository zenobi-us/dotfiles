# Execution Phase

## Entry
- Tasks in `todo`

## Exit
- Tasks completed/cancelled/blocked with justification
- Story acceptance criteria verified

## Rules
- Task status flow: `todo -> in-progress -> in-review -> completed`
- Story status flow follows delivered AC + test coverage gates.
- Story MUST NOT be marked `completed` unless `test_coverage: full`.
- Blockers or major drift MUST be escalated to Q.

## Agent Responsibilities
- Validate transitions
- Enforce traceability between task outcomes and story ACs
- Keep unresolved decisions visible
