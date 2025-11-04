---
title: { Epic Title }
projectId: { ProjectId }
epicId: { 0001 }
status: { Active | Completed | On Hold | Cancelled }
createdDate: { YYYY-MM-DD }
updatedDate: { YYYY-MM-DD }
links:
  - type: spec
    itemId: { 0001.1.0001 }
  - type: contains_story
    itemId: { 0001.4.0001 }
  - type: contains_story
    itemId: { 0001.4.0002 }
---

## Folder Structure

This epic creates a folder in the project: `{ProjectId}/{epicid}-{epic-name}/`

**Filename format:** `{epicid}.{typecode}.{incrementid}-{typename}-{title}.md`

The folder contains all related artifacts:
- Spec: `{epicid}.1.0001-spec-{title}.md` (always 0001, one per epic)
- Research: `{epicid}.2.0001-research-{title}.md`, `{epicid}.2.0002-research-{title}.md` (multiple)
- Decision: `{epicid}.3.0001-decision-{title}.md`, `{epicid}.3.0002-decision-{title}.md` (multiple)
- Story: `{epicid}.4.0001-story-{title}.md`, `{epicid}.4.0002-story-{title}.md` (multiple)

Tasks are stored at project level: `{epicid}.5.0001-task-{title}.md`, `{epicid}.5.0002-task-{title}.md`

## Example

```
0001-user-authentication/
├── 0001.1.0001-spec-user-auth-requirements.md
├── 0001.2.0001-research-oauth-options.md
├── 0001.2.0002-research-jwt-best-practices.md
├── 0001.3.0001-decision-jwt-vs-session.md
├── 0001.3.0002-decision-password-hashing.md
├── 0001.4.0001-story-login-flow.md
├── 0001.4.0002-story-password-reset.md
└── 0001.4.0003-story-account-recovery.md

0001.5.0001-task-database-schema.md
0001.5.0002-task-jwt-middleware.md
0001.5.0003-task-login-endpoint.md
```

## Preamble

Provide a high-level overview of the epic. This should give readers a quick understanding of what this epic is about, why it matters, and how it fits into the larger project context.

## Objectives

- Clear, measurable objective 1
- Clear, measurable objective 2
- Clear, measurable objective 3

## Scope

### In Scope

- Feature/capability 1
- Feature/capability 2
- Feature/capability 3

### Out of Scope

- What is explicitly NOT included in this epic
- Why certain related work is deferred

## Success Criteria

- [ ] Criterion 1: Specific and measurable success indicator
- [ ] Criterion 2: Related to the objectives defined above
- [ ] Criterion 3: Can be validated and verified

## Dependencies

- List any external dependencies or prerequisites
- Note any other epics or projects this epic depends on

## Timeline and Resources

- **Estimated Duration**: { e.g., 4-6 weeks }
- **Team Size**: { e.g., 3-4 engineers }
- **Key Stakeholders**: { List by role or name }

## Notes

- Any additional context or important notes
