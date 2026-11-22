# Skill Creation Checklist (TDD Adapted)

**IMPORTANT: Use TodoWrite to create todos for EACH checklist item below.**

## RED Phase - Write Failing Test

- [ ] Create pressure scenarios (3+ combined pressures for discipline skills)
- [ ] Run scenarios WITHOUT skill - document baseline behavior verbatim
- [ ] Identify patterns in rationalizations/failures

## GREEN Phase - Write Minimal Skill

- [ ] Name uses only letters, numbers, hyphens (no parentheses/special chars)
- [ ] YAML frontmatter requires name and description; boolean user-invocable is permitted (max 1024 chars)
- [ ] Description states what the skill does, when to use it, and the result it produces
- [ ] Description written in third person
- [ ] Keywords throughout for search (errors, symptoms, tools)
- [ ] Clear overview with core principle
- [ ] Address specific baseline failures identified in RED
- [ ] Code inline OR link to separate file
- [ ] One excellent example (not multi-language)
- [ ] Run scenarios WITH skill - verify agents now comply

## REFACTOR Phase - Close Loopholes

- [ ] Identify NEW rationalizations from testing
- [ ] Add explicit counters (if discipline skill)
- [ ] Build rationalization table from all test iterations
- [ ] Create red flags list
- [ ] Re-test until bulletproof

## Quality Checks

- [ ] Small flowchart only if decision non-obvious
- [ ] Quick reference table
- [ ] Common mistakes section
- [ ] No narrative storytelling
- [ ] Supporting files use `references/`, `scripts/`, `examples/`, or `assets/` for content that does not belong in `SKILL.md`
- [ ] A skill that a person starts by hand has a `how-to-*.md` guide next to `SKILL.md` (see `skill-anatomy.md`)

## Contract gate

- [ ] Complete the artifact inventory and ownership table in `contract-authoring.md`, including exclusions and external formats.
- [ ] Validate the skill manifest through the shared public command; resolve every declared contract. Keep empty collections explicit.
- [ ] Verify content through owner validators, historical readers and authorized mutation or explicit bulk commands when applicable. Manifest validation alone is not artifact validation.
- [ ] Run `contract-scenarios.md`: retain baseline failures, pressure outcomes, persisted content and byte-equal rejections.
- [ ] Record compatibility and upgrade decisions; no invented support, unresolved definitions or unresolved critical loopholes remain.

## Deployment

- [ ] Commit skill to git and push to your fork (if configured)
- [ ] Consider contributing back via PR (if broadly useful)

## Key Reminders

**No exceptions to the Iron Law:**
- Write skill before testing? Delete it. Start over.
- Edit skill without testing? Same violation.

**Avoid these rationalizations:**
- "Skill is obviously clear" → Clear to you ≠ clear to other agents. Test it.
- "It's just a reference" → References can have gaps, unclear sections. Test retrieval.
- "Testing is overkill" → Untested skills have issues. Always.
- "I'll test if problems emerge" → Problems = agents can't use skill. Test BEFORE deploying.
- "I'm confident it's good" → Overconfidence guarantees issues. Test anyway.

All of these mean: Test before deploying. No exceptions.
