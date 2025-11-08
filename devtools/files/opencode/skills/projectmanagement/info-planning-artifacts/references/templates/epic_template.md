---
title: { Epic Title }
projectId: { ProjectId }
epicId: { 1 }
status: { Active | Completed | On Hold | Cancelled }
createdDate: { YYYY-MM-DD }
updatedDate: { YYYY-MM-DD }
links:
  - type: spec
    target: { 1.1.1-spec-title }
  - type: contains_story
    target: { 1.4.1-story-title }
  - type: contains_story
    target: { 1.4.2-story-title }
---

## Folder Structure

This epic creates a folder in the project: `{ProjectId}/{epicid}-{epic-name}/`

**Filename format:** `{epicid}.{typecode}.{incrementid}-{typename}-{title}.md`

The folder contains all related artifacts:
- Spec: `{epicid}.1.1-spec-{title}.md` (always 1, one per epic)
- Research: `{epicid}.2.1-research-{title}.md`, `{epicid}.2.2-research-{title}.md` (multiple)
- Decision: `{epicid}.3.1-decision-{title}.md`, `{epicid}.3.2-decision-{title}.md` (multiple)
- Story: `{epicid}.4.1-story-{title}.md`, `{epicid}.4.2-story-{title}.md` (multiple)

Tasks are stored at project level: `{epicid}.5.1-task-{title}.md`, `{epicid}.5.2-task-{title}.md`

## Example

```
1-user-authentication/
├── 1.1.1-spec-user-auth-requirements.md
├── 1.2.1-research-oauth-options.md
├── 1.2.2-research-jwt-best-practices.md
├── 1.3.1-decision-jwt-vs-session.md
├── 1.3.2-decision-password-hashing.md
├── 1.4.1-story-login-flow.md
├── 1.4.2-story-password-reset.md
└── 1.4.3-story-account-recovery.md

1.5.1-task-database-schema.md
1.5.2-task-jwt-middleware.md
1.5.3-task-login-endpoint.md
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

- **Estimated Duration**: { High-level estimate, e.g., 4-6 weeks }
  - *Note: This is a rough timeline estimate. Actual duration will be determined by the sum of story point estimates for all [Story] artifacts, team velocity, and parallelization opportunities.*
- **Team Size**: { e.g., 3-4 engineers }
- **Key Stakeholders**: { List by role or name }

## Notes

- Any additional context or important notes

---

## VALIDATION (CRITICAL - Complete before proceeding to Planning phase)

**This section must be completed before moving to Phase 2.**

See: `references/phase-01-initiation.md` for detailed Initiation phase guidance.

**Validation Checklist:**

- [ ] [Epic] clearly defines the large body of work
- [ ] [Epic] objectives are measurable and achievable
- [ ] Scope clearly defines In Scope and Out of Scope
- [ ] Success criteria are specific and verifiable
- [ ] Related [Spec] artifact exists and is linked in frontmatter (itemId)
- [ ] [Spec] has been formally approved (approver name + date)
- [ ] All stakeholders understand and agree with epic scope
- [ ] No outstanding [NEEDS CLARIFICATION] tags
- [ ] Timeline and resource estimates are documented
- [ ] [Epic] is ready for breakdown into [Story] artifacts

**If any item is not checked, DO NOT proceed to Phase 2 Planning. Return to Initiation phase.**
