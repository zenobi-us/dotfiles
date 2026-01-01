# Project Planning Workflow

This reference describes the full project lifecycle workflow for LLM agents executing the project-planning skill. Templates (in `devtools/files/zk/templates/project/`) contain detailed execution instructions and validation gates.

## Escalation Matrix

Agents make tactical decisions autonomously but must consult Q for **strategic decisions**. Pause and escalate when:

| Trigger | Impact | Action |
|---------|--------|--------|
| **Scope changes** | Feature additions/removals mid-Epic or mid-Planning | Consult Q before updating Epic/Spec artifacts |
| **Timeline shifts** | Projected delivery date moves >1 week | Consult Q before adjusting deadlines |
| **Technical refactoring** | Discovered design changes during work | Consult Q before rewriting Spec/Stories |
| **Resource constraints** | Task/Story complexity exceeds capacity | Consult Q before proceeding or splitting work |

**How to escalate:** Present the situation to Q with current artifacts, affected timeline, and recommended action. Wait for approval before updating.

---

## Lifecycle Overview

Projects flow through five phases:

1. **Planning** — Create artifacts defining the work (PRD → Epic → Spec → Stories → Tasks)
2. **Execution** — Move work to completion (manage task/story status)
3. **Closing** — Archive completed work and mark project closed
4. **Retrospective** — Capture learnings (can follow Epic or Project completion)

*Note: Project initialization (creating ProjectId, storage setup) is handled by the `storage-zk` skill. Workflow assumes project already exists.*

---

## Planning Phase

**Purpose:** Define work through hierarchical artifacts, from strategic vision to implementation tasks.

**Entry conditions:**
- Project exists (ProjectId established by storage-zk skill)

**Exit conditions:**
- All Stories/Tasks created with status = To-Do
- Ready to begin Execution phase

**Artifact sequence:**

### 1. PRD (Product Requirements Document) — Required

**Purpose:** Strategic business vision and objectives

**Status progression:** Draft → In Review → Approved (→ Superseded if needed)

**Must be completed before:** Epic creation

**Key sections:**
- Executive Summary, Market/User Problem, Vision Statement
- Key Objectives (3-5), Success Metrics
- Timeline & Phasing, Assumptions, Constraints, Out of Scope

**Validation gate:** PRD must reach Approved status before Epic can be created. All [NEEDS CLARIFICATION] tags must be resolved (see validation checklist in the planning artifact).

**Escalation notes:** If scope or vision unclear/contested, escalate to Q via Escalation Matrix.

**FAILURE MODES**:

- missing validation checklist

---

### 2. Epic(s) — Required (can be multiple per PRD)

**Purpose:** Break PRD vision into large bodies of work

**Status progression:** Draft → Active (→ On Hold / Completed / Cancelled if needed)

**Spawns:** Spec(s)

**Key sections:**
- Objectives, In/Out of Scope, Success Criteria
- Links (implements PRD, dependent_on other Epics, influenced_by Decisions)
- Timeline & Resources

**Validation:** Done by validation checklist in the planning artifact.

**Escalation notes:** If scope expands beyond initial Epic definition, escalate to Q. Multiple Epics allowed if work is large or spans different timelines.


**FAILURE MODES**:

- missing validation checklist

---

### 3. Spec (Specification) — Required per Epic

**Purpose:** Technical blueprint for implementing Epic

**Status progression:** Draft → In Review → Approved (→ Superseded if needed)

**Spawns:** Story(ies)

**Key sections:**
- Detailed Preamble, Functional/Non-Functional Requirements
- Technical Objectives, Constraints, Assumptions, Success Criteria

**Validation:** Done by validation checklist in the planning artifact.

**Escalation notes:** If technical approach conflicts with PRD vision, or if Research reveals design changes, escalate to Q.

**FAILURE MODES**:

- missing validation checklist

---

### 4. Research (Optional) — Created on demand

**Purpose:** Discovery work for questions that arise during Planning

**Status progression:** In Progress → Complete (or Inconclusive / Superseded)

**When to create:** Anytime during Planning if requirements/approach is unclear

**Must link to:** The artifact(s) it informs (Spec, Epic, or Decision)

**Escalation notes:** If Research reveals scope or timeline changes, escalate findings to Q via Escalation Matrix.

**FAILURE MODES**:

- missing validation checklist

---

### 5. Decision (Optional) — Created on demand OR by user command

**Purpose:** Capture architectural/strategic choices made during Planning

**Status progression:** Pending → Decided (or Unresolved / Superseded)

**When to create:**
- During Planning when architectural choices are uncertain
- When user runs `/project/decision` command

**Must link to:** The artifact(s) it affects (Epic, Spec, Story)

**Validation note:** Decision artifacts created during Planning should reach Decided status before Execution begins (enforced by decision_template.md).

**Escalation notes:** If Decision impacts scope/timeline/resources significantly, escalate to Q.

**FAILURE MODES**:

- missing validation checklist

---

### 6. Story — Required per Spec

**Purpose:** User-facing work units implementing Spec

**Status progression:** Draft → Approved (→ Cancelled if needed)

**Spawns:** Task(s)

**Validation:** Described by the story artifacts validation checklist.

**FAILURE MODES**:

- missing validation checklist

---

### 7. Task — Required per Story

**Purpose:** Implementation units (smallest executable work)

**Template:** `task_template.md`

**Status progression:** Draft → To-Do (marks end of Planning phase)

**Validation:** Done by task_template.md

**Note:** When all Tasks reach To-Do status, Planning phase is complete and Execution phase begins.

**FAILURE MODES**:

- missing validation checklist

---

## Execution Phase

**Purpose:** Move work to completion through task/story status transitions.

**Entry conditions:**
- Stories/Tasks exist with status = To-Do

**Exit conditions:**
- Stories/Tasks status = Done (or Blocked/Cancelled with justification)

**What happens:** Teams execute work, update task/story status as work progresses.

**Status transitions:** See `status-flow.md` for complete state machine and valid transitions.

**Escalation notes:** If tasks become blocked, resource constraints appear, or scope changes during execution, escalate to Q via Escalation Matrix.

**Agent role:** Minimal — monitor status transitions, escalate when needed. Most execution work is done by team members, not the planning agent.

---

## Closing Phase

**Purpose:** Archive completed work and formally close Epic/Project.

**Entry conditions:**
- Epic status = Completed, OR
- Project ready to close (all planned work done or cancelled)

**Exit conditions:**
- All artifacts archived
- Project marked as closed

**What happens:** Status updates only (no new artifacts created in this phase).

**Validation:** See `retrospective_template.md` Closing Validation Checklist for full requirements.

**Agent role:** Mark artifacts with appropriate final statuses, update project closure metadata.

---

## Retrospective Phase

**Purpose:** Capture learnings, improvements, and process insights.

**Entry conditions:**
- Epic completed, OR
- Project completed

**Exit conditions:**
- Retrospective artifact created with status = Complete

**Template:** `retrospective_template.md`

**Timing** (Q decides which applies):
- After every Epic completion (optional, agent suggests if appropriate)
- After Project completion (recommended for all projects)
- When user explicitly requests via `/project/retro` command

**Auto-linking:** Retrospective automatically links back to Epic/Project it documents (handled by storage-zk skill via `documents_closure` relationship type).

**Validation:** Done by retrospective_template.md (includes comprehensive Closing Validation Checklist).

---

## Artifact Relationships Diagram

```
PRD (business vision, strategic direction)
 │
 └─→ Epic(s) (large bodies of work implementing PRD)
      │
      ├─→ Spec (technical blueprint for Epic)
      │    │
      │    └─→ Story(ies) (user-facing work units)
      │         │
      │         └─→ Task(s) (implementation units)
      │
      ├─→ Research (optional discovery, anytime if questions arise)
      │    │
      │    └─→ Informs: Spec, Epic, or Decision
      │
      └─→ Decision (optional choice capture, anytime or user-triggered)
           │
           └─→ Affects: Epic, Spec, or Story

Retrospective (optional learning capture)
 │
 └─→ documents_closure: Epic or Project
 └─→ informed_by: Decisions that shaped work
 └─→ related_to: Stories, Tasks that were delivered
```

**For detailed artifact structure and relationships, see:**
- **CRTICAL** Always prioritise the artifact validation guidelines in the [Planning Artifact] you are reading.
- `relationships.md` — Relationship types and semantics
- Individual schema files (`03-artifact-prd.md`, `04-artifact-epic.md`, etc.)

---

## Summary: Agent Decision Model

**Agents decide tactically (autonomously):**
- ✅ Which artifact to create next in sequence
- ✅ When to move artifacts through status transitions
- ✅ Validating artifact content against templates
- ✅ Creating Research/Decision artifacts when questions/choices arise

**Agents escalate strategically (consult Q):**
- ⚠️ Scope changes (features added/removed)
- ⚠️ Timeline shifts (>1 week movement)
- ⚠️ Technical refactoring (design changes)
- ⚠️ Resource constraints (capacity issues)

**See Escalation Matrix above for details.**

---

## Next Steps for Agents

When beginning a project:

1. Verify ProjectId exists (storage-zk handled initialization)
2. Check if PRD exists (if not, create one using `prd_template.md`)
3. If PRD approved, create Epic(s) using `epic_template.md`
4. For each Epic, create Spec using `spec_template.md`
5. For each Spec, create Story(ies) using `story_template.md`
6. For each Story, create Task(s) using `task_template.md`
7. When all Tasks are To-Do, Planning phase is complete
8. Execution phase: Monitor status transitions, escalate blockers
9. When work complete, Closing phase: Archive artifacts
10. Optional: Create Retrospective using `retrospective_template.md`

