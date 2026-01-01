# Project Planning Workflow Overview

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
   - *See: [planning-phase.md](./planning-phase.md)*

2. **Execution** — Move work to completion (manage task/story status)
   - *See: [execution-phase.md](./execution-phase.md)*

3. **Closing** — Archive completed work and mark project closed
   - *See: [closing-phase.md](./closing-phase.md)*

4. **Retrospective** — Capture learnings (can follow Epic or Project completion)
   - *See: [retrospective-phase.md](./retrospective-phase.md)*

*Note: Project initialization (creating ProjectId, storage setup) is handled by the `storage-zk` skill. Workflow assumes project already exists.*

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
- **CRITICAL:** Always prioritise the artifact validation guidelines in the planning artifact you are reading.
- `relationships.md` — Relationship types and semantics
- Individual schema files in `schema/` directory

---

## Agent Decision Model

**Agents decide tactically (autonomously):**
- ✅ Which artifact to create next in sequence
- ✅ When to move artifacts through status transitions
- ✅ Validating artifact content
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
2. Check if PRD exists (if not, create one)
3. If PRD approved, create Epic(s)
4. For each Epic, create Spec
5. For each Spec, create Story(ies)
6. For each Story, create Task(s)
7. When all Tasks are To-Do, Planning phase is complete
8. See [execution-phase.md](./execution-phase.md) for next phase
9. When work complete, see [closing-phase.md](./closing-phase.md)
10. Optional: Create Retrospective
