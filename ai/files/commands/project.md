---
title: Markdown Driven Project Manangement
agent: project-manager
description: Use markdown files to manage project tasks and documentation.
---

# Project Management Command

If the agent has not loaded the project planning skill, load it now:


- `skill_use('projectmanagement_project_planning')`
- `skill_use('projectmanagement_storage_zk')`

## Navigation Guide

Follow the behaviour tree for systematic navigation:

**See:** `skill_resource('references/workflow/behaviour-tree.md')`

The behaviour tree provides:
- Project tree display for no-input mode
- Epic/Story/Task action menus
- Status transition validation
- Escalation detection
- Post-action loops

## User Request

```md
<UserRequest>
$ARGUMENTS
</UserRequest>
```
