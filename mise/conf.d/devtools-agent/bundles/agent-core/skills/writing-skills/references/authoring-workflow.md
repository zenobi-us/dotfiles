# Skill Authoring Workflow

Use this procedure when creating or substantially changing a skill.

## RED: establish the failure

1. Define the behaviour the skill must change. Inventory independently consumed artifacts with `contract-authoring.md`; retain the current guidance as the baseline, without the proposed rules.
2. Write a realistic scenario that requires that behaviour.
3. Add pressure when the skill enforces discipline. Use time, authority, sunk cost, or exhaustion.
4. For a new skill, run without it. For an edit, run with the retained current guidance but without the proposed changes. Record all other loaded policy; do not call a policy-contaminated run policy-free.
5. Record the agent's choices and rationalizations verbatim.

The baseline is complete when the scenario shows the behaviour that the skill must change.

## GREEN: write the smallest skill

1. Classify the skill.
2. Write frontmatter with only `name` and `description`.
3. Write the smallest router and workflow that addresses the baseline failure.
4. Move branch-specific guidance into focused `references/` files.
5. Add one clear pointer for each branch. Complete the contract inventory and applicable `contracts.json` declarations using `contract-authoring.md`. Do not publish invented identifiers or unresolved placeholder definitions as supported contracts.
6. Run the same scenario with the skill.

The green phase is complete when the agent follows the required behaviour in the original scenario.

## REFACTOR: close loopholes

1. Repeat the scenario with a different input.
2. Add a new pressure or counter-example. For artifact handling, run `contract-scenarios.md` through real owning commands and inspect persisted and rejected bytes.
3. Record each new failure or rationalization.
4. Strengthen the smallest rule that closes the gap.
5. Keep one source of truth for each rule.
6. Repeat until no critical loophole remains.

Read `references/rationalization-patterns.md` when the skill enforces behaviour under pressure.

## Deployment

Before deployment:

1. Run the final checklist.
2. Confirm that the router points to each required reference.
3. Confirm that each reference has one clear purpose.
4. Confirm that the tests cover the skill's primary type.
5. Review the final diff.
6. Commit the verified skill.

Read `references/skill-checklist.md` for the complete gate.

## Completion criteria

The work is complete only when the baseline failure, improved behaviour, refactor tests, reference routes, and deployment checklist are all recorded.
