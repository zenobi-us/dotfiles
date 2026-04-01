# Retrospective Phase

**Purpose:** Capture learnings, improvements, and process insights.

**Entry conditions:**
- Epic completed, OR
- Project completed

**Exit conditions:**
- Retrospective artifact created with status = Complete

---

## Timing Options

Q decides which retrospective cadence applies (you suggest, Q approves):

1. **After every Epic completion** — Capture learnings specific to that Epic's execution
2. **After Project completion** — Comprehensive retrospective for the entire project
3. **User-triggered** — Only when user explicitly requests via `/project/retro` command

---

## Agent Responsibilities

1. **Suggest retrospective creation:**
   - After Epic completion, suggest: "Create retrospective for [Epic name]?"
   - After Project completion, suggest: "Create project retrospective?"
   - Wait for Q approval before creating

2. **Create retrospective artifact:**
    - Link to the Epic or Project being documented (via `documents_closure` relationship)
    - Link to Decisions that shaped the work (via `informed_by`)
    - Link to Stories/Tasks delivered (via `related_to`)

3. **Facilitate retrospective session:**
   - Guide collection of learnings, challenges, improvements
   - Ensure all team members/stakeholders contribute feedback
   - Document process improvements with specific owners and timelines

4. **Validate completion:**
    - All sections completed
    - All [NEEDS CLARIFICATION] resolved
    - Validation checklist fully checked

---

## What Gets Captured

Key sections captured in retrospective:

- **What Went Well** — Successes and positive outcomes
- **What Could Be Improved** — Challenges and inefficiencies
- **Lessons Learned** — Key insights for future projects
- **Process Improvements** — Specific, actionable changes
- **Follow-up Actions** — New tasks/decisions resulting from retrospective

---

## Auto-linking

Retrospective automatically links back to Epic/Project it documents via the `documents_closure` relationship type (handled by storage-zk skill).

---

## Next Steps

Once retrospective is Complete:
- Project is officially closed
- All learnings captured and documented
- Team thanked and celebrated
- Ready for next project
