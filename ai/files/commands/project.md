---
title: Markdown Driven Project Manangement
agent: ProjectManager
subtask: true
---

## User Request

```md
<UserRequest>
  $ARGUMENTS
</UserRequest>
```

## Steps to Execute

1. Load the project id skill: 

- `skill_use('projectmanagement_project_id')`

2. If the agent has not loaded the project planning skill, load it now:

- `skill_use('projectmanagement_project_planning')`
- `skill_use('projectmanagement_storage_function_structure')`
- `skill_use('projectmanagement_storage_zk')`

3. Follow the project management workflow outlined below to manage project tasks and documentation using markdown files.

- `skill_resource('projectmanagement_project_planning', 'references/workflow/behaviour-tree.md')`

## Guidelines 

The behaviour tree provides:
- Project tree display for no-input mode
- Epic/Story/Task action menus
- Status transition validation
- Escalation detection
- Post-action loops

