# Create Epic and Associated Specification

You are creating a focused [Epic] artifact and its required paired [Spec] artifact. Follow this systematic approach to break down a [Prd] into implementable work units.

**Task:** Create [Epic] and [Spec] for: $ARGUMENTS
**Storage Backend**: basicmemory

> [!CRITICAL]
> Before doing anything, run these skills:
> - skills_projectmanagement_storage_basicmemory
> - skills_projectmanagement_info_planning_artifacts
>
> For all [Planning Artifacts], use the above storage backend.
> **NEVER** use GitHub Issues or direct file access for [Planning Artifacts].

## Step 1: Understand Epic Scope

**Define what constitutes an [Epic]:**

1. **[Epic]** is a large body of work derived from a [Prd]
2. **[Epic]** is always accompanied by exactly one [Spec] (1:1 relationship)
3. **[Epic]** contains multiple [Story] artifacts
4. **[Epic]** is estimated in weeks or months (high-level)
5. **[Epic]** represents a cohesive work package with clear deliverables

**Analyze the context:**

1. Verify you have a [ProjectId] established (use `/project:init` if needed)
2. Fetch the parent [Prd] artifact if this Epic is derived from one
3. Identify which part of the [Prd] this [Epic] addresses
4. Determine if this is one of multiple Epics from the same [Prd]

## Step 2: Assess Epic Complexity and Scope

**Evaluate the work breakdown:**

1. **Scope Definition**: What are the key deliverables this epic will produce?
2. **Feature Areas**: Identify major feature groups or components
3. **Technical Scope**: Which system areas are affected (Frontend, Backend, Database, Infrastructure)?
4. **Dependencies**: What must be completed before this epic starts?
5. **Timeline**: Estimate total effort in weeks or months

**For complex epics, engage in extended thinking:**

Think deeply about this epic: '$ARGUMENTS'. Consider the overall architecture, major integration challenges, phasing strategy, risk factors, and how this relates to the broader product vision. What are the key decisions that will drive this epic's success?

## Step 3: Define Epic Goals and Success Criteria

**Establish clear epic-level objectives:**

1. **Primary Goal**: What major capability or outcome does this epic deliver?
2. **User Impact**: How does this benefit end users or the business?
3. **Success Metrics**: What measurable outcomes indicate success?
4. **Completion Criteria**: What must be true when this epic is done?

**Map acceptance criteria:**

1. List high-level acceptance criteria for the epic
2. Identify key milestones or checkpoints
3. Define what "done" means for this epic

## Step 4: Break Down into Stories and Stories

**Plan the story decomposition (don't create yet - just plan):**

1. **Estimate Story Count**: How many [Story] artifacts will this require?
   - Simple Epic: 2-3 stories
   - Moderate Epic: 4-8 stories
   - Complex Epic: 8-15 stories

2. **Identify Story Themes**: What are the major story groupings?
   - User workflows or scenarios
   - Technical components or layers
   - Feature areas or modules

3. **Plan Story Sequencing**: What's the logical order?
   - Foundation stories first
   - Core functionality before enhancements
   - Dependencies considered

4. **Estimate Epic Points**: Sum estimated story points (rough calculation)
   - Will be refined as stories are created

## Step 5: Create Epic Artifact

**Delegate to subskill:**

Delegate the creation of the [Epic] artifact using the `task` tool with these instructions:

> **Delegate to subskill:**
> You are creating an [Epic] artifact: '$ARGUMENTS'.
> No analysis needed, just create the artifact based on the analysis from Steps 1-4.
> 1. Use `skills_projectmanagement_info_planning_artifacts` to understand [Epic] structure
> 2. Use the storage backend to create a new [Epic] artifact
> 3. Link to parent [Prd] if applicable
> 4. Use `session` tools to communicate the created [Epic] identifier
> 5. Return the artifact identifier in Johnny Decimal format (e.g., `1-epic-title`)

## Step 6: Create Paired Specification Artifact

**The [Epic] requires a paired [Spec] artifact (1:1 relationship):**

Create the paired [Spec] using the same delegation approach:

> **Delegate to subskill:**
> You are creating a [Spec] artifact paired with [Epic]: '$ARGUMENTS'.
> 1. Use `skills_projectmanagement_info_planning_artifacts` to understand [Spec] structure
> 2. Create [Spec] with epic-level detail (overview of all stories)
> 3. Link to parent [Epic] artifact
> 4. Use `session` tools to communicate the created [Spec] identifier
> 5. Return the artifact identifier (e.g., `1.1.1-spec-title`)

## Step 7: Validate Epic and Spec Quality

**Verify the epic-spec pair:**

1. **Epic Definition**: Is the scope clear and appropriately sized?
2. **Spec Alignment**: Does the spec detail support the epic vision?
3. **Story Planning**: Can the stories you outlined fit logically within this spec?
4. **Dependencies**: Are blocking dependencies documented?
5. **Estimation**: Is the estimated effort realistic?

**Check alignment:**

1. Confirm 1:1 relationship between epic and spec
2. Verify epic and spec have consistent messaging
3. Ensure no orphaned requirements

## Step 8: Provide Epic Summary

**Create a comprehensive summary:**

- **[Epic] Artifact Created**: Artifact identifier and title
- **[Spec] Artifact Created**: Artifact identifier and title
- **Epic Scope**: Brief description of work covered
- **Estimated Effort**: Weeks/months and approximate story points
- **Story Count**: Planned number of [Story] artifacts
- **Key Deliverables**: What this epic delivers
- **Next Steps**: Suggest `/project:plan:stories "[Epic Name]"` to create individual user stories

## Step 9: Reference and Linking

**How to reference this epic in other artifacts:**

- **Epic link**: `[[1-epic-user-authentication]]`
- **Spec link**: `[[1.1.1-spec-user-authentication-requirements]]`
- **From Stories**: Each story will link back with: `links: type: epic, target: 1-epic-user-authentication`

## Step 10: Context for Workflow

**Understanding the hierarchy:**

```
[Prd] (High-level strategic direction)
  ↓
[Epic] (Major work package, 1:1 with Spec)
  ↓
[Spec] (Detailed requirements overview)
  ↓
[Story] (User scenarios and use cases)
  ↓
[Task] (Specific implementation work)
```

This epic-spec pair is now ready for story creation. Use `/project:plan:stories` to break this epic into individual user stories for team implementation.

This systematic approach ensures epics are well-scoped, properly paired with specifications, and ready for story decomposition and team execution.
