# Create User Stories for Epic

## Execution Instructions

**EXECUTE THIS TASK BY:**

1. Read all content between `<message_to_subagent>` and `</message_to_subagent>` tags
2. Copy that content exactly
3. Call the Task tool with these parameters:
   - `description`: "Analyze project status and active work"
   - `subagent_type`: "general"
   - `prompt`: [paste the content from step 1]
4. Return the formatted output from the subagent exactly as received to the user

**IMPORTANT:** This command does NOT execute directly—it delegates to a subagent. You must call the Task tool.

---

<message_to_subagent>
You are analyzing a [Spec] artifact and designing its decomposition into [Story] artifacts. Follow this systematic approach to create user-focused scenarios that bridge requirements and implementation tasks.

**Task:** Create [Story] artifacts for [Epic]: $ARGUMENTS
**Storage Backend**: basicmemory

> [!CRITICAL]
> Before doing anything, run these skills:
> - skills_projectmanagement_storage_basicmemory
> - skills_projectmanagement_info_planning_artifacts
>
> All [Planning Artifacts] are managed through the skills listed above.
> Follow their guidance for creation, updates, and linking.
> Do not try to use alternative methods.

## Step 1: Fetch and Validate [Spec] Artifact

**Use the storage backend to gather complete information:**

1. Fetch the [Spec] artifact corresponding to the [Epic] from $ARGUMENTS
2. Read the full specification including all requirements sections
3. Validate that the [Spec] has been completed and reviewed
4. Extract the parent [Epic] ID for linking stories
5. Review functional and non-functional requirements
6. Identify key user personas and use cases mentioned

**If validation fails, stop and request clarification:**
- If [Spec] not found: "Epic specification not found in storage backend"
- If [Spec] incomplete: "Epic specification must be completed before story creation"
- If requirements unclear: "Requirements must be clarified before creating user stories"

## Step 2: Analyze User Personas and Scenarios

**Identify the users this epic serves:**

1. **Primary User**: Who is the main user of this epic's features?
2. **Secondary Users**: Who else benefits from these features?
3. **Use Cases**: What scenarios will users encounter?
4. **User Workflows**: What are the key user journeys?

**Extract user-focused requirements:**

1. Read through [Spec] requirements sections
2. Identify scenarios that represent meaningful user work
3. Map requirements to user workflows
4. Note any conditional requirements (if-then scenarios)

## Step 3: Perform Deep Story Decomposition Analysis

**For complex epics, engage in extended thinking:**

Think deeply about breaking down this epic: '$ARGUMENTS'. Consider different user perspectives, edge cases, dependencies between user flows, phasing strategy for incremental value delivery, and integration complexity. What are natural story boundaries that create independent, valuable work units?

**Apply systematic breakdown framework:**

1. **Extract User Scenarios**: List all distinct user workflows
2. **Identify Value Slices**: Which scenarios deliver user value?
3. **Map Dependencies**: What must happen in sequence?
4. **Assess Complexity**: Which scenarios are complex vs straightforward?
5. **Plan Phasing**: What order maximizes learning and risk reduction?

## Step 4: Define Story Decomposition Strategy

**Choose your breakdown approach:**

**For Small Specs (1-3 stories):**
- One story per major user workflow
- Each story covers one primary scenario
- Examples: "User registration flow", "User login flow"

**For Medium Specs (4-8 stories):**
- Main user workflows as primary stories
- Edge cases and alternative paths as secondary stories
- Example breakdown:
  - User registration (happy path)
  - User registration (validation and error handling)
  - User login (standard flow)
  - User login (password reset)
  - Admin user management
  - User profile customization

**For Large Specs (8-15 stories):**
- Organize by user role or feature area
- Main workflows as primary stories
- Variations and enhancements as separate stories
- Example breakdown:
  - Customer: Browse products
  - Customer: Search and filter
  - Customer: Add to cart
  - Customer: Checkout flow
  - Customer: Order tracking
  - Admin: Inventory management
  - Admin: Order management
  - etc.

**Story Point Estimation Guidance:**

- **Simple Story** (3 points): Single workflow, straightforward implementation
- **Medium Story** (5-8 points): Multiple steps, some complexity, clear acceptance criteria
- **Complex Story** (8-13 points): Multiple workflows, significant integration, unknowns
- **Constraint**: If story would be > 13 points, break into smaller stories

## Step 5: Design Story Structure

**For each story, define:**

1. **User Story Format**: "As a {user type}, I want to {capability} so that {benefit}"
2. **Acceptance Criteria**: Specific, testable requirements
3. **User Workflow**: The sequence of steps the user takes
4. **Edge Cases**: Alternative paths and error conditions
5. **Dependencies**: Other stories this depends on
6. **Acceptance Tests**: How we verify the story is complete

**Ensure stories are:**
- ✅ Independent (can be implemented independently if possible)
- ✅ Negotiable (details can be discussed with team)
- ✅ Valuable (delivers user value)
- ✅ Estimable (team can estimate effort)
- ✅ Small (can be completed in a sprint or iteration)
- ✅ Testable (clear acceptance criteria)

## Step 6: Validate Story Breakdown

**Before creating artifacts, verify your breakdown:**

1. **Coverage**: Do stories cover all requirements from the spec?
2. **Independence**: Can stories be implemented in parallel where possible?
3. **Sequencing**: Is the dependency order clear?
4. **Sizing**: Are story points realistic (most 5-8 points)?
5. **Count**: Does story count align with spec complexity?

**Red flags:**

- Any story > 13 points → break it into smaller stories
- Stories that require same resources → consider merging
- Missing coverage of spec requirements → add missing story
- Unclear dependencies → clarify sequencing

## Step 7: Delegate Story Artifact Creation to Subskill

**You have designed the breakdown. Now delegate the actual artifact creation:**

Delegate the creation of [Story] artifacts using the `task` tool with these instructions:

> **Delegate to subskill:**
> You are creating [Story] artifacts for the [Epic]: '$ARGUMENTS'.
> Based on the analysis and breakdown design from Steps 1-6, create [Story] artifacts.
>
> **Do NOT analyze or redesign** - just create artifacts from the provided breakdown.
>
> 1. Use `skills_projectmanagement_info_planning_artifacts` to understand [Story] artifact structure
> 2. Use the storage backend to create [Story] artifacts with proper frontmatter
> 3. For each identified story:
>    - Create artifact with user story format and acceptance criteria
>    - Link to parent [Spec] artifact
>    - Link to parent [Epic] artifact
>    - Link any story dependencies (blocking/dependent_on)
> 4. Use `session` tools to communicate created artifact identifiers
> 5. Return summary of created story identifiers in Johnny Decimal format

**What the subskill will handle:**
- ✅ Johnny Decimal naming (4.1.1, 4.2.1, 4.3.1, etc.)
- ✅ Artifact file creation and naming: `4.{sequence}.1-story-{title}.md`
- ✅ Placement in `4-stories/` folder at project root
- ✅ Frontmatter field population
- ✅ Storage backend interaction
- ✅ Artifact linking and relationships
- ✅ Directory structure and organization

## Step 8: Validate Story Creation Quality

**Verify story artifact completeness:**

1. **Story Count**: Does count match your breakdown plan?
2. **Coverage**: Do all stories have clear user stories and acceptance criteria?
3. **Links**: Is each story linked to [Epic] and [Spec]?
4. **Dependencies**: Are story dependencies documented?
5. **Sequencing**: Does the dependency order make sense?

**Check for common issues:**

- Any story without linked epic/spec
- Circular dependencies between stories
- Stories that duplicate requirements
- Unclear acceptance criteria

## Step 9: Provide Story Breakdown Summary

**Summarize what was created (subskill already created artifacts):**

- **[Epic] Analyzed**: Epic identifier and title
- **[Spec] Analyzed**: Spec identifier and title
- **[Story] Artifacts Created**: List all story identifiers
  - Example: `1.4.1-story-user-registration`, `1.4.2-story-user-login`, etc.
- **Story Count**: Total number of stories created
- **Estimated Total Effort**: Sum of story points across all stories
- **Critical Path**: Key dependency chain if applicable
- **How to Reference**: Use Obsidian wiki-style links like `[[1.4.1-story-user-registration]]`

**Next Steps:**

Each [Story] is now ready for task breakdown. Use `/project:plan:tasks "[Story Name]"` to break individual stories into specific implementation [Task] artifacts.

## Step 10: Implementation Success Criteria

**Verify story creation success:**

- ✅ All [Story] artifacts created following storage backend protocols
- ✅ All [Story] artifacts linked to parent [Epic]
- ✅ All [Story] artifacts linked to parent [Spec]
- ✅ Story dependencies documented as links (blocking/dependent_on)
- ✅ All stories have user story format with acceptance criteria
- ✅ Story points assigned to each story
- ✅ Stories are appropriately sized (most 5-8 points, none > 13)
- ✅ Implementation team can begin task breakdown using `/project:plan:tasks`

## Step 11: Workflow Context

**Understanding the hierarchy:**

```
[Epic] (Major work package)
  ↓
[Spec] (Detailed requirements overview)
  ↓
[Story] (User scenarios and use cases) ← You are here
  ↓
[Task] (Specific implementation work)
```

This systematic approach ensures user-focused story decomposition while the subskill ensures proper artifact creation, storage, and linking in the storage backend.

</message_to_subagent>