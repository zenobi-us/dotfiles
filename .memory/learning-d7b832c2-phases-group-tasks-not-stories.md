---
id: d7b832c2
type: learning
title: Phases Group Tasks, Not Stories
created_at: "2026-03-02T17:56:00+10:30"
updated_at: "2026-03-02T17:56:00+10:30"
status: completed
tags:
  - project-management
  - miniproject
  - architecture-insights
  - lessons-learned
---

# Phases Group Tasks, Not Stories

## Summary

Phases should group **tasks** (when work happens), not **stories** (what requirements exist). Stories are phase-agnostic business requirements that exist independently of timeline. Tasks link to both a story (the "what") and a phase (the "when"), creating a dual-link model.

## Details

### The Problem
The original miniproject skill conflated two separate concerns:
1. **Requirements** (stories) - WHAT needs to be built
2. **Timeline** (phases) - WHEN work happens

This led to:
- Separate `phase-*.md` files that duplicated epic-level planning
- Stories having `phase_id` frontmatter, tightly coupling requirements to schedule
- Phases acting as containers for stories rather than grouping actual work

### The Insight

**Stories are phase-agnostic.** A story like "As a user, I want to reset my password" exists as a requirement regardless of when we implement it. It's a business need, not a timeline artifact.

**Phases are execution containers.** A phase represents a time-bounded chunk of work: "Phase 1: Core Authentication" or "Phase 2: Advanced Features". Phases group the *tasks* that implement stories.

**Tasks bridge both worlds.** A task links to:
- `story_id` → The requirement it implements (the "what")
- `phase_id` → The timeline it's scheduled in (the "when")

### The Dual-Link Model

```
Epic
 ├── Stories (phase-agnostic requirements)
 │    └── Story defines WHAT
 │
 └── Phases (inline sections in epic file)
      └── Phase defines WHEN
           └── Tasks link to BOTH:
                ├── story_id (what)
                └── phase_id (when)
```

### Why Phases Should Be Inline in Epics

Separate `phase-*.md` files add overhead without value:
- Phases are tightly coupled to their epic (can't exist independently)
- Phase content is typically just: title, dates, status, task list
- Inline sections keep phase info co-located with epic vision

Instead, epics should contain:
```markdown
## Phases

### Phase 1: Core Implementation
- **Status**: in-progress
- **Start**: 2026-03-01
- **End Criteria**: Core API functional
- **Tasks**: [task-abc123-auth], [task-def456-api]

### Phase 2: Polish & Launch
- **Status**: planned
- **Start Criteria**: Phase 1 complete
- **Tasks**: (to be assigned)
```

## Implications

### For the Miniproject Skill

1. **Remove** `phase` from file types (no more `phase-*.md` files)
2. **Remove** `phase_id` from story frontmatter (stories are phase-agnostic)
3. **Add** `## Stories` section to epic template
4. **Update** epic `## Phases` to be inline sections, not file links
5. **Keep** `phase_id` in task frontmatter (tasks are scheduled into phases)
6. **Clarify** task dual-link model: `story_id` = what, `phase_id` = when

### For Existing Projects

A migration script can:
1. Find existing `phase-*.md` files
2. Inline their content into parent epic files
3. Remove `phase_id` from story frontmatter
4. Leave task `phase_id` intact (still valid)

### Conceptual Model

| Artifact | Concern | Links To | Phase-Agnostic? |
|----------|---------|----------|-----------------|
| Epic     | Vision  | -        | Yes             |
| Story    | WHAT    | Epic     | **Yes**         |
| Phase    | WHEN    | Epic     | No (inline)     |
| Task     | HOW     | Story + Phase | No         |
| Research | Discovery | Epic/Task | Yes          |
| Learning | Knowledge | -      | Yes             |

Stories answer: *"What does the user need?"*
Phases answer: *"When will we build it?"*
Tasks answer: *"How do we implement it, and when?"*
