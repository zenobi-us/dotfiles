# Planning Artifacts Reference Library

This directory contains the reference materials for project planning artifacts and execution workflows.

## Contents

### Templates (templates/)
- `epic_template.md` - Template for Epic artifacts
- `spec_template.md` - Template for Specification artifacts
- `story_template.md` - Template for Story artifacts
- `task_template.md` - Template for Task artifacts
- `research_template.md` - Template for Research artifacts
- `decision_template.md` - Template for Decision artifacts
- `retrospective_template.md` - Template for Retrospective artifacts

### Execution Guides
- `execution-guide.md` - Quick reference for dual-source task execution (GitHub + BasicMemory)

### Planned References (To Be Created)
- `status-flow.md` - State machine diagrams for artifact status transitions
- `schema.md` - Frontmatter schema validation and requirements

## How to Use

### Creating a New Artifact
1. Choose the appropriate template from `templates/`
2. Copy the template content
3. Follow the structure in `info-planning-artifacts/SKILL.md`
4. Use the artifact naming convention (Johnny Decimal format)

### Executing Tasks
1. See `execution-guide.md` for quick reference
2. See `do.task.md` in command layer for detailed 15-step workflow
3. Supports both GitHub issues and BasicMemory artifacts

## Status Transition Guidelines

Status transitions are controlled via the command layer (`@command/project/`):

- **Creation**: Default status from template
- **Execution**: `/project:do:task` → status updated
- **Submission**: `/project:do:commit` → status updated
- **Completion**: PR merge → status updated
- **Closure**: `/project:close` → creates retrospective

For detailed state machines, see planned `status-flow.md`.

## Key References

- **Planning Artifacts Skill**: `../SKILL.md`
- **Command Layer**: `../../../../command/project/`
- **Storage Backend**: `../storage-basicmemory/`
- **Full Task Execution Workflow**: `../../../../command/project/do.task.md`

## Architecture

```
References (this directory)
├── Templates (artifact structure)
├── Execution Guide (task execution patterns)
├── Status Flow (planned: transitions)
└── Schema (planned: validation)
```

See `STATUS_WORKFLOW_CONTROL_ANALYSIS.md` in project root for complete architecture overview.
