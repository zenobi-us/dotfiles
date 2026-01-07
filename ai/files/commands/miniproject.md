---
title: Markdown Driven Task Management
agent: MiniProject
subtask: true
---

# Markdown Driven Task Management

This is a simplified and concise project management AI memory framework.

## User Request

```md
<UserRequest>
$ARGUMENTS
</UserRequest>
```

## Execution Steps

1. Load the `miniproject` skill if not already loaded:

   - `skill_use('miniproject')`

2. Follow the project management workflow. Avoid Glob, List, and ripgrep tools; instead, use shell commands to interact with the `.memory/` directory.

3. Always read `.memory/summary.md` first to understand the current status before taking any action.
