---
description: Project Manamgent cmd. Route user request using the projectmanagment skill.
---

```
Cmd: $1
Args: ${@:2}

AllArguments: $ARGUMENTS
```

- use the `project-planning` skill.
- detect the storage-system for the current directory.
- Follow the behaviour-tree reference of the `project-planning` skill to route the command to the correct workflow and phase.
- If the command is ambiguous, ask the user for clarification.

 
