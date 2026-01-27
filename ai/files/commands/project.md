---
title: Markdown Driven Project Manangement
---

## Goal 

Perform project management tasks and store or read project guidance using markdown files according to user requests.

## User Request

```md
<UserRequest>
  $ARGUMENTS
</UserRequest>
```

## Steps to Execute

1. Load the following skills: 
  - opennotes vaults (our storage backend)
  - project_planning
  - storage_function_structure
2. Understand the available project_planning resources, but don't load them until required.
3. read the project_planning/workflow behaviour tree resource. Follow it according the user request.

## Guidelines 

The behaviour tree provides:
- Project tree display for no-input mode
- Epic/Story/Task action menus
- Status transition validation
- Escalation detection
- Post-action loops

