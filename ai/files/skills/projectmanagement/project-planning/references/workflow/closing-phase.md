# Closing Phase

**Purpose:** Archive completed work and formally close Epic/Project.

**Entry conditions:**
- Epic status = Completed, OR
- Project ready to close (all planned work done or cancelled)

**Exit conditions:**
- All artifacts archived
- Project marked as closed

---

## What Happens

Status updates only — no new artifacts created in this phase. The focus is on finalizing metadata, archiving work, and preparing for retrospective.

---

## Agent Responsibilities

1. **Mark artifact statuses:**
   - Update Epic status to Completed (or On Hold/Cancelled if appropriate)
   - Ensure all Stories are marked Done (or intentionally Blocked/Cancelled)
   - Ensure all Tasks are marked Done (or intentionally Blocked/Cancelled)

2. **Validate closure completeness:**
   - See `retrospective_template.md` Closing Validation Checklist for full requirements
   - Verify all [Task] artifacts are accounted for
   - Verify all [Story] artifacts are accounted for

3. **Update project metadata:**
   - Mark project as "closed" in storage system
   - Archive all related artifacts

---

## Validation Checklist

Before closing, verify:

- [ ] All assigned [Task] artifacts are marked as "Done"
- [ ] All [Story] artifacts are marked as "Done"
- [ ] Related [Epic] status has been updated to "Completed"
- [ ] All unresolved [Decision] artifacts are documented
- [ ] Project artifacts are organized and linked
- [ ] Project team has been thanked and celebrated

**If any item is not checked, project closure is NOT complete. Return to Execution phase.**

---

## Next: Retrospective Phase (Optional)

After closing, optionally proceed to [retrospective-phase.md](./retrospective-phase.md) to capture learnings.
