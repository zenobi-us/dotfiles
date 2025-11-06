---
name: info-phases
description: Use to know about project management phases.
---

## What is the lifecycle of a project initiative?

A project progresses through 7 phases. Each phase has validation gates that must be completed before proceeding.

**For detailed phase guidance, see the references/phases/phase-\*.md files:**

### Phase 1: Initiation

**Goal:** Define the project at a high level. Create [Epic] and [Spec] artifacts.

→ **See: `references/phases/phase-01-initiation.md`**

**Quick Steps:**

- Identify [ProjectId] using `./scripts/get_project_id.sh`
- Create [Epic] and [Spec] artifacts
- Get Spec formally approved (Approval Gate - REQUIRED)
- Complete validation checklist in epic_template.md and spec_template.md

---

### Phase 2: Planning - Stories

**Goal:** Break down [Epic] into [Story] artifacts representing user-facing features.

→ **See: `references/phases/phase-02-planning-stories.md`**

**Quick Steps:**

- Create [Story] artifacts for each major feature in [Spec]
- Write user stories in BDD format
- Link [Story] to [Epic] and [Spec]
- Complete validation checklist in story_template.md

---

### Phase 3: Planning - Tasks

**Goal:** Break down each [Story] into [Task] artifacts (specific, atomic work items).

→ **See: `references/phases/phase-03-planning-tasks.md`**

**Quick Steps:**

- Create [Task] artifacts for each [Story]
- Assign story points using Fibonacci sequence (1, 2, 3, 5, 8, 13)
- Identify blocking/dependent relationships
- Perform critical path analysis
- Complete validation checklist in task_template.md

---

### Phase 4: Delegation

**Goal:** Assign [Task] artifacts to team members with clear context.

→ **See: `references/phases/phase-04-delegation.md`**

**Quick Steps:**

- Review all [Task] and team member skills/availability
- Assign [Task] to appropriate team members
- Get acknowledgment and commitment from assignees
- Verify no one is overloaded

**Uses:** `skills_superpowers_dispatching_parallel_agents` and `skills_superpowers_subagent_driven_development`

---

### Phase 5: Execution

**Goal:** Implement assigned [Task] artifacts. (Usually executed by subagents assigned to tasks.)

→ **See: `references/phases/phase-05-execution.md`**

**Quick Steps:**

- For new [Task]: Read artifact, review context, create git worktree, begin work
- For continuing [Task]: Review [Work Log], switch to worktree, continue work
- Update [Task] status as work progresses (To Do → In Progress → In Review → Done)
- Create [Decision] artifacts for decisions made
- Complete task Definition of Done checklist in task_template.md

**Escalation Points:**

- "[WARNING] BLOCKED" - Stop and discuss if blocked
- "[WARNING] EDGE CASE DISCOVERED" - Stop and discuss if new requirements emerge
- Create [Decision] artifacts with status "Unresolved" for uncertain decisions

**Uses:** `skills_superpowers_using-git-worktrees`

---

### Phase 6: Monitoring and Controlling

**Goal:** Oversee progress and make adjustments. (Runs parallel to Phase 5, not sequential.)

→ **See: `references/phases/phase-06-monitoring.md`**

**Quick Steps:**

- Review [Task] status regularly (weekly or more)
- Identify blockers and deviations from plan
- Take corrective actions (adjust resources, timeline, unblock dependencies)
- Update [Project Artifacts] to reflect current state
- Communicate changes to stakeholders

**Continuous Activity:** Monitoring happens throughout execution, not after.

---

### Phase 7: Closing and Retrospective

**Goal:** Complete the project and document lessons learned.

→ **See: `references/phases/phase-07-closing.md`**

**Quick Steps:**

- Conduct retrospective meeting with team
- Create [Retrospective] artifact documenting lessons learned
- Link all unresolved [Decision] artifacts to [Retrospective]
- Document process improvements with specific action items
- Archive [Project Artifacts]
- Complete validation checklist in retrospective_template.md

---

## Validation Checkpoints

**Critical validation checkpoints enforce quality at each phase transition:**

| Phase                | Validation Location                   | Must Complete Before  |
| -------------------- | ------------------------------------- | --------------------- |
| Phase 1 (Initiation) | epic_template.md + spec_template.md   | Proceeding to Phase 2 |
| Phase 2 (Stories)    | story_template.md                     | Proceeding to Phase 3 |
| Phase 3 (Tasks)      | task_template.md                      | Proceeding to Phase 4 |
| Phase 5 (Execution)  | task_template.md "Definition of Done" | Marking task as Done  |
| Phase 7 (Closing)    | retrospective_template.md             | Project closure       |

**Each template includes a VALIDATION section that must be completed. Do not skip validation - it prevents problems downstream.**
