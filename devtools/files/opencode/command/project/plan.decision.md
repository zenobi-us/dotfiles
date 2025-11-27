# Document Project Decision

You are creating a [Decision] artifact to document a conclusion reached after evaluating options. Follow this systematic approach to create a decision record that guides implementation and ensures traceability.

**Task:** Document decision: $ARGUMENTS
**Storage Backend**: basicmemory

> [!CRITICAL]
> Before doing anything, run these skills:
> - skills_projectmanagement_storage_basicmemory
> - skills_projectmanagement_info_planning_artifacts
>
> All [Planning Artifacts] are managed through the skills listed above.
> Follow their guidance for creation, updates, and linking.
> Do not try to use alternative methods.

## Step 1: Clarify the Decision Context

**Define what decision needs documenting:**

1. **Decision Statement**: What choice is being made?
2. **Context**: Why is this decision needed now?
3. **Stakeholders**: Who is affected by this decision?
4. **Decision Type**: Is this strategic or implementation-focused?

**Categorize the decision:**

- **Strategic Decision**: Long-term direction, architecture patterns, technology choices (made during planning)
- **Implementation Decision**: Code patterns, library choices, feature scope (made during execution)
- **Process Decision**: Workflow changes, tool selections, team practices

**Note the status:**
- **Unresolved**: Decision hasn't been finalized (needs resolution)
- **Decided**: Decision has been made and will be documented

## Step 2: Identify Decision Drivers

**Document what led to this decision:**

1. **Problem or Opportunity**: What situation prompted the need for a decision?
2. **Constraints**: What limitations must the decision respect?
3. **Requirements**: What must the decision satisfy?
4. **Research**: Has any [Research] been conducted? (link to it)

**Reference related artifacts:**

- **Parent [Epic] or [Spec]**: What planning context led to this?
- **Related [Research]**: What investigation informed this decision?
- **Affected [Story] or [Task]**: What implementation does this guide?

## Step 3: Perform Extended Thinking (for Complex Decisions)

**For significant decisions, engage in deep thinking:**

Think deeply about this decision: '$ARGUMENTS'. Consider multiple perspectives, long-term implications, trade-offs, risks, dependencies with other decisions, and how this aligns with project vision. What are the key factors that make this decision critical?

## Step 4: Evaluate Options

**Document the options considered:**

**For each option, document:**
1. **Option Description**: What does this option entail?
2. **Pros**: Benefits and advantages
3. **Cons**: Drawbacks and costs
4. **Risks**: What could go wrong?
5. **Effort**: How much work is required?
6. **Long-term Impact**: What are the long-term implications?

**Create a decision matrix (if helpful):**

| Option | Pros | Cons | Effort | Risk | Score |
|--------|------|------|--------|------|-------|
| Option A | ... | ... | ... | ... | ... |
| Option B | ... | ... | ... | ... | ... |
| Option C | ... | ... | ... | ... | ... |

## Step 5: Make the Decision

**Choose the recommended option:**

1. **Selected Option**: Which option is chosen?
2. **Rationale**: Why is this option selected?
3. **Trade-offs Accepted**: What are we trading off?
4. **Assumptions**: What must be true for this decision to succeed?
5. **Caveats**: What limitations or conditions apply?

**Document the decision reasoning:**

- Align with project vision and constraints
- Balance trade-offs with stakeholder needs
- Consider risk and effort
- Ensure alignment with related decisions

## Step 6: Create Decision Artifact

**Delegate to subskill:**

Delegate the creation of the [Decision] artifact using the `task` tool:

> **Delegate to subskill:**
> You are creating a [Decision] artifact: '$ARGUMENTS'.
> Document your decision with options evaluated and rationale.
>
> 1. Use `skills_projectmanagement_info_planning_artifacts` to understand [Decision] structure
> 2. Use the storage backend to create a [Decision] artifact
> 3. Status must be either "Decided" or "Unresolved"
> 4. If status is "Unresolved", this will be linked to [Retrospective] during closing
> 5. Populate with:
>    - Decision statement and context
>    - Options evaluated
>    - Selected option and rationale
>    - Assumptions and constraints
>    - Links to related [Research], [Spec], [Epic]
> 6. Use `session` tools to communicate the created [Decision] identifier
> 7. Return artifact identifier in Johnny Decimal format (e.g., `6.1.1-decision-title`)
>
> The storage backend will handle:
> - Artifact file creation and naming: `6.{sequence}.1-decision-{title}.md` (e.g., `6.1.1-decision-jwt-vs-session.md`)
> - Placement in `6-decisions/` folder at project root
> - ProjectId association
> - Obsidian wiki-style links to related artifacts

## Step 7: Link Decision to Implementation

**If decision guides implementation:**

1. **Update [Spec] Artifacts**: Reference this decision in relevant specifications
2. **Update [Task] Artifacts**: Link tasks that implement this decision
3. **Document Influence**: Note how decision shapes implementation approach

**Decision Linking Rules:**

- [Decision] can influence [Spec], [Story], or [Task]
- Each artifact implementing this decision should reference it: `influenced_by_decision: {decision-id}`
- [Decision] documents the "why" behind implementation choices

## Step 8: Validate Decision Quality

**Verify the decision artifact:**

1. **Clarity**: Is the decision clearly stated?
2. **Justification**: Is the rationale well-explained?
3. **Options**: Are alternatives documented?
4. **Trade-offs**: Are trade-offs explicit?
5. **Impact**: Are implementation implications clear?
6. **Status**: Is status set to "Decided" or "Unresolved"?

**Check for common issues:**

- Decision based on incomplete analysis
- Unstated assumptions or constraints
- Options not fully evaluated
- Rationale not clearly justified
- Missing links to related decisions

## Step 9: Handle Unresolved Decisions

**If decision is "Unresolved":**

1. **Document the dilemma**: What makes this decision difficult?
2. **Blocking factors**: What prevents resolution?
3. **Next steps**: What information would help resolve?
4. **Defer point**: When will this be revisited?

**Important:** All [Decision] artifacts with status "Unresolved" MUST be linked to the [Retrospective] during project closing phase.

## Step 10: Provide Decision Summary

**Create a comprehensive summary:**

- **[Decision] Artifact Created**: Artifact identifier and title
- **Decision Statement**: What was decided
- **Selected Option**: Which option was chosen
- **Rationale**: Why this option was selected
- **Key Trade-offs**: What was traded off
- **Status**: "Decided" or "Unresolved"
- **Linked From**: Any [Spec], [Task], or [Story] artifacts that implement this decision
- **Linked To**: Any [Research] or [Epic] that informed this decision

## Step 11: Reference and Linking

**How to reference this decision in other artifacts:**

- **Decision link**: `[[6.1.1-decision-jwt-vs-session]]`
- **From [Spec]**: `links: - type: decision, target: 6.1.1-decision-jwt-vs-session`
- **From [Task]**: `influenced_by_decision: 6.1.1-decision-jwt-vs-session`

## Step 12: Workflow Context

**Understanding when [Decision] is created:**

```
Planning Phase:
- [Research] investigates options
- [Decision] chooses direction
- [Spec] documents requirements based on decision
- [Epic] implements the chosen direction

Execution Phase:
- [Task] implements based on decision
- [Decision] can be revisited if implementation reveals issues
- [Retrospective] reviews unresolved decisions during closing
```

**Decision Status Transitions:**

- **Unresolved** → **Decided**: When decision is finalized
- **Decided** → **Unresolved** (rarely): When new information changes the decision
- **Unresolved** → **Addressed in Retrospective**: When closing project

## Step 13: Implementation Success Criteria

**Verify decision artifact success:**

- ✅ [Decision] artifact created with clear statement
- ✅ Options evaluated and documented
- ✅ Selected option has clear rationale
- ✅ Status is set to "Decided" or "Unresolved"
- ✅ Linked to related [Research] if applicable
- ✅ Linked to related [Spec] or [Task] if applicable
- ✅ If "Unresolved", plan for [Retrospective] review is documented

This systematic approach ensures decisions are well-documented, properly justified, and traceable through implementation.
