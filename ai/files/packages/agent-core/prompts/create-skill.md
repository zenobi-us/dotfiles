---
description: Create and test skills using writing-skills and testing-skills-with-subagents skill (yo dawg).
---

Write and test a skill according to the UserRequest.

## UserRequest

```md
UserRequest: $ARGUMENTS
```

1. Create a skill list by breaking down UserRequest into concepts, topics, and subtopics.
2. Use `skill_find(comma-separated-list-of-phrases)` to find relevant skills for each word/phrase in the list.
3. `skill_use(writing-skills)` and `skill_use(testing-skills-with-subagents)`.
4. When delegating to subagents, ask them to also use `skill_find` and `skill_use` as needed. If you think a subagent needs to use a skill, instruct it explicitly to do so.
