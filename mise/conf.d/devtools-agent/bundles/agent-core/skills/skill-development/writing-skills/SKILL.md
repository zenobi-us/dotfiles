---
name: writing-skills
description: Creates and validates reusable agent skills with test-driven authoring and progressive disclosure, when creating, editing, restructuring, or reviewing skills, resulting in focused skills with verified agent behaviour
---

# Writing Skills

Create skills as tested process documentation. Treat skill authoring as Test-Driven Development for agent behaviour.

## Use this skill when

- You create a skill.
- You edit or restructure a skill.
- You review a skill for structure or behaviour.
- You split a large skill into a router and references.
- You test whether an agent follows a skill.

Do not use this skill for ordinary project documentation unless the document will guide an agent.

## Core loop

1. **RED:** Run a baseline scenario without the skill. Record the failure.
2. **GREEN:** Write the smallest skill that addresses the observed failure.
3. **REFACTOR:** Test again. Close each observed loophole.
4. **DEPLOY:** Complete the checklist and commit the verified skill.

Read `references/authoring-workflow.md` for the full procedure.

## Progressive disclosure

Keep `SKILL.md` as a thin topic and use-case router.

- Inline the rules that every invocation needs.
- Move branch-specific guidance to `references/`.
- Point to a reference at the decision that requires it.
- Give each reference one clear purpose.
- Keep one authoritative source for each rule.
- Load only the references needed for the current branch.

Read `references/progressive-disclosure.md` when designing or restructuring a skill.

## Choose the skill shape

Classify the skill before writing it. Read `references/skill-types.md` when the skill may be a reference, workflow, style guide, persona, or technique.

Read `references/skill-anatomy.md` when you need frontmatter, directory, section, naming, or file-organisation rules.

## Route by task

| Task | Read |
|---|---|
| Define metadata or searchable triggers | `references/cso-guide.md` |
| Write or change the authoring workflow | `references/authoring-workflow.md` |
| Design baseline or pressure tests | `references/testing-methodology.md` |
| Test with subagents | `references/testing-skills-with-subagents.md` |
| Close behavioural loopholes | `references/rationalization-patterns.md` |
| Map software TDD to skill authoring | `references/tdd-mapping.md` |
| Compare external authoring guidance | `references/anthropic-best-practices.md` |
| Finish the authoring process | `references/skill-checklist.md` |
| Improve instruction compliance | `references/persuasion-principles.md` |

## Completion gate

Do not deploy a skill until:

- A baseline failure exists.
- The skill changes the observed behaviour.
- The same scenario passes with the skill.
- Refactor testing finds no unresolved critical loophole.
- The router points to each required reference.
- Each reference has one clear purpose.
- The final checklist is complete.

Read `references/skill-checklist.md` before deployment.
