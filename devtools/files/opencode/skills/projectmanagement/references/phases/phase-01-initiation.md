# Phase 1: Initiation

**Goal:** Define the project at a high level, including objectives and scope. Create an [Epic] and associated [Spec].

## Steps

1. Identify the [ProjectId] using `./scripts/get_project_id.sh`
2. Create a basicmemory project if it does not exist:
   ```
   basicmemory_create_memory_project(name="{ProjectId}", project_path="~/Notes/Projects/{ProjectId}")
   ```
3. Create an [Epic] artifact to represent the initiative using `references/templates/epic_template.md`
4. Create a [Spec] artifact to detail the requirements and objectives using `references/templates/spec_template.md`
   - Mark any unknowns as `[NEEDS CLARIFICATION]`
   - Create [Research] artifacts to gather information on unclear points
5. Link the [Spec] to the [Epic] using frontmatter links
6. Discuss and refine the [Spec] using a Conversational TodoList until all major points are resolved

## Spec Approval Gate (CRITICAL - REQUIRED before moving to Phase 2)

Before proceeding to Planning phase, the Spec MUST be approved:

**Who approves:** Product Owner, Tech Lead, or designated Spec Reviewer

**Approval method:** Documented in [Spec] frontmatter with:
- Approver name
- Approval date (YYYY-MM-DD)

**Approval criteria - All of the following MUST be true:**
- [ ] All `[NEEDS CLARIFICATION]` tags have been resolved
- [ ] All requirements are stated clearly
- [ ] No open questions remain
- [ ] Requirements are achievable given constraints
- [ ] Scope is clearly defined (In Scope + Out of Scope)
- [ ] Success criteria are measurable

**If not approved:** Return to refinement step. Create additional [Research] artifacts as needed to resolve concerns.

## Validation Checklist (CRITICAL - Complete before Phase 2)

**The following MUST be true before moving to Planning:**

- [ ] [ProjectId] has been identified and basicmemory project created
- [ ] [Epic] artifact has been created with clear objectives and scope
- [ ] [Spec] artifact exists and is comprehensive
- [ ] [Epic] has a link to [Spec] in frontmatter
- [ ] [Spec] has a link to [Epic] in frontmatter
- [ ] No remaining `[NEEDS CLARIFICATION]` tags in [Spec]
- [ ] [Spec] has been formally approved with approver name and date
- [ ] All stakeholders have reviewed and agreed on scope
- [ ] Conversational TodoList contains no unresolved topics

**If any item is not checked, DO NOT proceed to Phase 2. Return to refinement.**

## Common Pitfalls to Avoid

- ❌ **Starting without a clear Spec** → Leads to rework later
- ❌ **Approving Spec with outstanding clarifications** → Hidden assumptions emerge during execution
- ❌ **Not documenting approvals** → Creates disputes later
- ❌ **Skipping Epic** → Loses high-level context
- ❌ **Unclear scope** → Scope creep during execution

## Tips for Success

- ✅ Involve stakeholders early and get their input on the Spec
- ✅ Be specific about what is OUT of scope (prevents misunderstandings)
- ✅ Create Research artifacts for any technical unknowns
- ✅ Use `[NEEDS CLARIFICATION]` liberally - better to ask now than discover issues later
- ✅ Document all decisions and rationale in Decision artifacts
- ✅ Get formal approval before proceeding (saves time downstream)

## Next Step

Once validation checklist is complete → **Phase 2: Planning (Stories)**

See: `references/phase-02-planning-stories.md`
