---
name: create-skill
description: Create and test a skill from a user request, when a new reusable agent workflow is needed, resulting in a tested SKILL.md
disable-model-invocation: true
---

# Create and Test a Skill

Create and test a skill according to the user request.

## User Request

```md
UserRequest: $ARGUMENTS
```

1. Create a skill list by breaking down the user request into concepts, topics, and subtopics.
2. Use `skill_find(comma-separated-list-of-phrases)` to find relevant skills for each word or phrase in the list.
3. Use `skill_use(writing-skills)` and `skill_use(testing-skills-with-subagents)`.
4. When delegating to subagents, ask them to also use `skill_find` and `skill_use` as needed. If a subagent needs a skill, instruct it explicitly to use that skill.

Run this workflow only when the user explicitly invokes `create-skill`.
