# Planning Phase

**Purpose:** Define work through hierarchical artifacts, from strategic vision to implementation tasks.

**Entry conditions:**
- Project exists (ProjectId established by storage-zk skill)

**Exit conditions:**
- All Stories/Tasks created with status = To-Do
- Ready to begin [Execution phase](./execution-phase.md)

---

## Artifact Sequence

### 1. PRD (Product Requirements Document) — Required

**Purpose:** Strategic business vision and objectives

**Status progression:** Draft → In Review → Approved (→ Superseded if needed)

**Must be completed before:** Epic creation

**Key sections:**
- Executive Summary, Market/User Problem, Vision Statement
- Key Objectives (3-5), Success Metrics
- Timeline & Phasing, Assumptions, Constraints, Out of Scope

**Validation gate:** PRD must reach Approved status before Epic can be created. All [NEEDS CLARIFICATION] tags must be resolved. **Enforce the validation block in the PRD artifact** — this is the gate that prevents moving forward.

**Escalation notes:** If scope or vision unclear/contested, escalate to Q via Escalation Matrix.

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

---

### 3. Spec (Specification) — Required per Epic

**Purpose:** Technical blueprint for implementing Epic

**Status progression:** Draft → In Review → Approved (→ Superseded if needed)

**Spawns:** Story(ies)

**Key sections:**
- Detailed Preamble, Functional/Non-Functional Requirements
- Technical Objectives, Constraints, Assumptions, Success Criteria

**Validation:** Enforce the validation block in the Spec artifact before moving to Story creation. Technical approach must align with PRD vision.

**Escalation notes:** If technical approach conflicts with PRD vision, or if Research reveals design changes, escalate to Q.

---

### 4. Research (Optional) — Created on demand

**Purpose:** Discovery work for questions that arise during Planning

**Status progression:** In Progress → Complete (or Inconclusive / Superseded)

**When to create:** Anytime during Planning if requirements/approach is unclear

**Must link to:** The artifact(s) it informs (Spec, Epic, or Decision)

**Validation:** Enforce the validation block in the Research artifact. All findings must be documented before artifact can be marked Complete.

**Escalation notes:** If Research reveals scope or timeline changes, escalate findings to Q via Escalation Matrix.

---

### 5. Decision (Optional) — Created on demand OR by user command

**Purpose:** Capture architectural/strategic choices made during Planning

**Status progression:** Pending → Decided (or Unresolved / Superseded)

**When to create:**
- During Planning when architectural choices are uncertain
- When user runs `/project/decision` command

**Must link to:** The artifact(s) it affects (Epic, Spec, Story)

**Validation:** Enforce the validation block in the Decision artifact. All decisions must reach Decided status before Execution phase begins — this is a hard gate.

**Escalation notes:** If Decision impacts scope/timeline/resources significantly, escalate to Q.

---

### 6. Story — Required per Spec

**Purpose:** User-facing work units implementing Spec

**Status progression:** Draft → Approved (→ Cancelled if needed)

**Spawns:** Task(s)

**Validation:** Enforce the validation block in the Story artifact before creating Tasks. Story must be Approved status before Task creation.

---

### 7. Task — Required per Story

**Purpose:** Implementation units (smallest executable work)

**Status progression:** Draft → To-Do (marks end of Planning phase)

**Validation:** Enforce the validation block in the Task artifact. All Tasks must reach To-Do status before Planning phase exits.

**Note:** When all Tasks reach To-Do status, Planning phase is complete and [Execution phase](./execution-phase.md) begins.

---

## Planning Phase Checklist

- [ ] PRD created and approved (status = Approved)
- [ ] Epic(s) created and linked to PRD
- [ ] Spec(s) created for each Epic
- [ ] Research artifact(s) created if needed, linked to respective artifacts
- [ ] Decision artifact(s) created if needed, with status = Decided
- [ ] Story(ies) created for each Spec
- [ ] Task(s) created for each Story with status = To-Do
- [ ] All artifacts have required links (see relationships.md)
- [ ] No [NEEDS CLARIFICATION] tags remain unresolved
- [ ] Ready to begin Execution phase

---

## Next: Execution Phase

See [execution-phase.md](./execution-phase.md) for status transition management and work execution.
