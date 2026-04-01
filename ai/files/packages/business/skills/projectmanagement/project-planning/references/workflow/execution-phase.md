# Execution Phase

**Purpose:** Move work to completion through task/story status transitions.

**Entry conditions:**
- Stories/Tasks exist with status = To-Do

**Exit conditions:**
- Stories/Tasks status = Done (or Blocked/Cancelled with justification)

---

## What Happens

Teams execute work, updating task/story status as work progresses. The agent's role is minimal during this phase — mostly monitoring and escalating when blockers arise.

**Status transitions:** See `status-flow.md` for complete state machine and valid transitions.

---

## Agent Responsibilities

- ✅ Monitor status transitions as team members update work
- ✅ Escalate blockers, resource constraints, or scope changes immediately
- ✅ Validate status updates against `status-flow.md` rules
- ✅ Link blocked tasks to Decision artifacts if unresolved choices emerge

---

## Escalation Triggers

Pause and escalate to Q if any of these occur:

- **Tasks become blocked** — Dependency not met, unable to proceed
- **Resource constraints appear** — Complexity exceeds capacity mid-execution
- **Scope changes requested** — New features or removals during execution
- **Timeline shifts** — Projected completion date moves >1 week
- **Technical blockers** — Spec proves incorrect or infeasible

See [overview.md](./overview.md) Escalation Matrix for details.

---

## Next: Closing Phase

When all Stories/Tasks reach Done status (or are intentionally Blocked/Cancelled), proceed to [closing-phase.md](./closing-phase.md).
