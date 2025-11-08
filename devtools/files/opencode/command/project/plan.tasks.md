# Break Down Story Into Implementation Tasks

You are analyzing a [Story] artifact and designing its decomposition into implementation [Task] artifacts. Follow this systematic approach to create a logical, implementable task breakdown that integrates with the planning artifact hierarchy.

**Task:** Design task breakdown for [Story]: $ARGUMENTS
**Storage Backend**: basicmemory

> [!CRITICAL]
> Before doing anything, run these skills:
> - skills_projectmanagement_storage_basicmemory
> - skills_projectmanagement_info_planning_artifacts
>
> For all [Planning Artifacts], use the above storage backend.
> **NEVER** use GitHub Issues or direct file access for [Planning Artifacts].

## Step 1: Fetch and Validate [Story] Artifact

**Use the storage backend to gather complete information:**

1. Fetch the [Story] artifact from storage backend using the identifier from $ARGUMENTS
2. Read the full story description, user stories, and acceptance criteria
3. Validate that the [Story] has completed its validation checklist (from story_template.md)
4. Extract the parent epic ID and spec context for task linking
5. Verify story points are assigned to the parent [Story]
6. Check that all acceptance criteria are measurable and testable

**If validation fails, stop and request clarification:**
- If [Story] artifact doesn't exist, return error: "Story not found in storage backend"
- If validation checklist incomplete, return: "Story must complete validation before task breakdown"
- If story points not assigned, return: "Parent story must have story points estimated"

## Step 2: Perform Deep Requirements Analysis

**For complex breakdowns, engage in extended thinking:**
Think deeply about breaking down this work from issue $ARGUMENTS. Consider all technical areas, integration challenges, dependency ordering, and the most logical decomposition into implementable tasks. Consider edge cases, testing requirements, and incremental delivery opportunities. What are the natural phases of implementation?

**Apply systematic analysis framework:**

1. **Extract acceptance criteria**: List all testable requirements from the issue
2. **Identify functional requirements**: Determine core capabilities needed
3. **Map technical scope**: Identify affected system areas (Frontend, Backend, CLI, Database, Infrastructure)
4. **Note dependencies**: Document prerequisites and integration points
5. **Assess complexity**: Evaluate implementation difficulty and unknowns

## Step 3: Assess Technical Scope and Sequence

**Analyze which system areas will be affected:**

1. **Frontend**: Identify needed components, user interactions, state management, routing changes
2. **Backend**: Determine required APIs, business logic, data models, validation, authentication
3. **CLI**: Note needed commands, help text, configuration handling, user experience improvements
4. **Database**: Check for schema changes, migrations, queries, performance optimization needs
5. **Infrastructure**: Consider deployment, monitoring, configuration, scaling requirements
6. **Testing**: Plan unit tests, integration tests, end-to-end testing, performance testing
7. **Documentation**: Identify user guides, API docs, development documentation needs

**Map integration points that require attention:**

1. External service integrations and their dependencies
2. Inter-service communication patterns
3. Data flow and transformation requirements
4. Security and authentication boundaries

**Determine logical implementation sequence:**

1. **Foundation first**: Database schema, core models, basic infrastructure
2. **Backend then Frontend**: API endpoints before UI components that consume them
3. **Core before Extensions**: Essential functionality before nice-to-have features
4. **Testing alongside**: Unit tests with implementation, integration tests after core features
5. **Documentation last**: Comprehensive docs after implementation is stable

## Step 4: Design Task Breakdown Strategy

**Choose your breakdown approach based on story complexity:**

**For Simple Stories (3 points, 1-2 tasks):**

1. Core implementation task (3-5 points)
   - Single deliverable covering all acceptance criteria
   - No separate testing task unless complex validation needed

**For Moderate Stories (5-8 points, 3-5 tasks):**

1. Backend/Core implementation task(s) (2-3 points each)
2. Frontend/Integration task(s) (2-3 points each)
3. Testing task if not covered in implementation (2-3 points)

**For Complex Stories (8-13 points, 5-8 tasks):**

1. Research/Architecture task (2-3 points) - only if significant unknowns
2. Backend implementation tasks (2-3 points each)
   - Data models and schema
   - Core logic and APIs
   - Specific business rules
3. Frontend implementation tasks (2-3 points each)
   - Components and UI
   - State management
   - Integration
4. Testing tasks (2-3 points each)
   - Unit/integration tests
5. Documentation if needed (1-2 points)

**Johnny Decimal Naming (Automatic by subskill):**

- Tasks will be named: `{epicId}.5.{incrementId}-task-{title}`
- Example: Epic 1, Story 1 → Tasks 1.5.1, 1.5.2, 1.5.3, etc.
- **Don't manually create names - subskill handles this**

**Task Sequencing Principles:**

- Identify dependencies between tasks (A must finish before B can start)
- Group independent tasks that can run in parallel
- Plan critical path (longest chain of dependent tasks)
- Document which tasks block which others

**Story Point Constraints:**

- ⚠️ No single [Task] should exceed 8 story points
- If a task would be > 8 points, break it into smaller tasks
- Sum of task points should roughly equal parent story points (±20% OK)
- If sum significantly exceeds parent, re-estimate or reduce scope

## Step 5: Delegate [Task] Artifact Creation to Subskill

**You have designed the breakdown. Now delegate the actual artifact creation:**

Delegate the creation of [Task] artifacts using the `task` tool with these instructions:

> **Delegate to subskill:**
> You are creating [Task] artifacts for the [Story]: '$ARGUMENTS'.
> Based on the analysis and breakdown design from Steps 1-4, create [Task] artifacts.
> 
> **Do NOT analyze or redesign** - just create artifacts from the provided breakdown.
> 
> 1. Use `skills_projectmanagement_info_planning_artifacts` to understand [Task] artifact structure and Johnny Decimal naming
> 2. Use the storage backend to create [Task] artifacts with proper frontmatter (storyId, epicId, storyPoints, links)
> 3. For each identified task:
>    - Create artifact with frontmatter populated
>    - Link to parent [Story] artifact
>    - Link to parent [Epic] artifact
>    - Link any task dependencies (blocking/dependent_on/related_to)
> 4. Use `session` tools to communicate the created artifact identifiers back
> 5. Return summary of created artifacts: list of artifact IDs in Johnny Decimal format

**What the subskill will handle (don't repeat here):**
- ✅ Johnny Decimal naming (1.5.1, 1.5.2, etc.)
- ✅ Frontmatter field population
- ✅ Storage backend interaction
- ✅ Artifact linking and relationships
- ✅ Directory structure and organization

## Step 6: Validate Task Breakdown Quality

**Verify breakdown completeness and feasibility:**

1. **Task Count**: Are there 2-8 tasks total? (If < 2, might be too simple; if > 8, might need re-analysis)
2. **Story Points**: Does sum of task points roughly equal parent story points (±20% acceptable)?
3. **No Circular Dependencies**: Verify no task A blocks B, B blocks C, C blocks A
4. **Coverage**: Do all acceptance criteria get addressed by at least one task?
5. **Atomic Tasks**: Can each task be completed independently with clear acceptance criteria?

**Identify potential issues before creating artifacts:**

- If any task > 8 points, flag for re-estimation or splitting
- If dependencies form loops, flag for redesign
- If acceptance criteria not covered, flag for scope adjustment
- If task count seems wrong, reconsider breakdown strategy

## Step 7: Provide Breakdown Summary

**Summarize what was created (don't create again - subskill already did):**

The subskill has created [Task] artifacts based on your breakdown design. Here's what to document:

- **[Story] Analyzed**: Artifact identifier and title
- **Parent Epic**: Epic ID for context
- **[Task] Artifacts Created**: List all artifact identifiers in Johnny Decimal format
  - `1.5.1-task-backend-jwt-implementation`
  - `1.5.2-task-frontend-login-component`
  - `1.5.3-task-integration-testing`
  - etc.
- **Task Count**: Total number of [Task] artifacts created
- **Estimated Effort**: Sum of story points across all tasks
- **Critical Path**: Key dependency chain (e.g., 1.5.1 → 1.5.2 → 1.5.3)
- **How to Reference**: Use Obsidian wiki-style links like `[[1.5.1-task-backend-jwt-implementation]]`

**What happens next:**
- Each [Task] artifact is now ready for execution with `/project:do:task`
- Developers can view task details, implementation steps, and dependencies.
- Task status can be updated as work progresses

## Step 8: Request Human Review If Needed

**Stop and request human review when:**

- Task breakdown reveals significantly higher complexity than expected
- New architectural decisions are needed that weren't in the original story
- External dependencies or approvals are required
- Security or performance implications are discovered
- Estimated effort dramatically exceeds or undershoots story points

## Step 9: Implementation Success Criteria

**Verify task breakdown success:**

- ✅ All [Task] artifacts created following storage backend protocols
- ✅ All [Task] artifacts linked to parent [Story] artifact
- ✅ All [Task] artifacts linked to parent [Epic] artifact
- ✅ Task dependencies documented as storage backend links (blocking/dependent_on/related_to)
- ✅ All story points allocated (sum ≈ parent story points ±20%)
- ✅ No [Task] exceeds 8 story points
- ✅ Critical path identified and understood
- ✅ Implementation team can begin execution using `/project:do:task`

This systematic approach ensures logical task decomposition while the subskill ensures proper artifact creation, storage, and linking in the storage backend.
