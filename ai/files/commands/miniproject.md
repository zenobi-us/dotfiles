---
title: Markdown Driven Task Management
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

1. Delegate the following steps to the `general` subagent.
2. Load the `miniproject` skill and follow the instructions it describes to process the user request.
3. Is the `.miniproject` directory is itself a git repo? 
  - **YES** then after each change, commit the changes with a meaningful commit message from within that directory.
  - **NO** then skip this step.
4. After completing the task, summarize the changes made in a concise manner. Avoid creating summarisation files, instead provide the summary directly in your response. 
