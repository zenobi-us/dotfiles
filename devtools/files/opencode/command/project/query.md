# Query Planning Artifacts

Answer questions about planning artifacts and provide context about the current project. This command helps align agents on project state and artifact relationships.

**Task:** Answer query about planning artifacts: $ARGUMENTS
**Storage Backend**: basicmemory

> [!CRITICAL]
> Before doing anything, run these skills:
> - skills_projectmanagement_storage_basicmemory
> - skills_projectmanagement_info_planning_artifacts
>
> All queries are answered using the storage backend as the source of truth.
> Always validate against actual project state, not assumptions.

## Planning Artifacts Framework

The project uses **8 artifact types** in a hierarchical structure:

| Artifact | ID Format | Purpose | Create Command |
|----------|-----------|---------|-----------------|
| **[PRD]** | `1.x.x-prd-{title}` | Strategic direction & business goals | `/project:plan:prd` |
| **[Epic]** | `2.x.x-epic-{title}` | Major work package (paired with Spec) | `/project:plan:epic` |
| **[Spec]** | `2.x.x-spec-{title}` | Detailed requirements (auto-created with Epic) | (auto-paired) |
| **[Research]** | `3.x.x-research-{title}` | Investigation & findings (ad-hoc) | `/project:plan:research` |
| **[Decision]** | `6.x.x-decision-{title}` | Architectural/strategic choices (ad-hoc) | `/project:plan:decision` |
| **[Story]** | `4.x.x-story-{title}` | User scenarios from Epic/Spec | `/project:plan:stories` |
| **[Task]** | `5.x.x-task-{title}` | Specific implementation work | `/project:plan:tasks` |
| **[Retrospective]** | `9.x.x-retrospective-{title}` | Post-completion closure & lessons | `/project:close:retro` |

### Artifact Hierarchy

```
[PRD] (Strategic Vision)
  ├→ [Epic] (Major Work Package, 1:many)
      ├→ [Spec] (Detailed Requirements, 1:1 pairing - CRITICAL)
      └→ [Story] (User Scenarios, 1:many)
          └→ [Task] (Implementation Work, 1:many)

[Research] → informs → [Spec], [Story], [Task], [Decision]
[Decision] → influences → [Spec], [Story], [Task]
[Retrospective] → documents → [Epic] (post-completion)
```

### Story Point Ranges

- **Tasks**: 1-8 points (specific implementation work)
- **Stories**: 3-13 points (user scenarios spanning multiple tasks)
- **Epics**: Estimated in **weeks or months** (high-level planning)

## Step 1: Identify and Validate ProjectId

**Establish the current project context:**

1. Use `skills_projectmanagement_storage_basicmemory` to get the current [ProjectId]
2. If no [ProjectId] is set, return error:
   ```
   ❗ Error: No active project
   
   Set the project context first:
   /project:init "project-name"
   
   Then retry your query.
   ```
3. Print the identified [ProjectId]:
   ```
   📋 Current Project ID: {ProjectId}
   ```

## Step 2: Parse Query Type

**Determine what the user is asking:**

**Query Categories:**

### A. Artifact Discovery Queries
- "What PRDs exist in this project?"
- "Show me all epics"
- "What epics exist in this project?"
- "Show me all tasks"
- "List all stories for epic {epic-name}"
- "What research has been done?"
- "Which decisions exist?"
- "Show retrospectives"

### B. Artifact Relationship Queries
- "What stories does epic {epic-name} contain?"
- "What tasks implement story {story-name}?"
- "What epic does task {task-id} belong to?"
- "Show me the spec for epic {epic-name}"
- "What epics does PRD {prd-name} define?"
- "Which research informed decision {decision-name}?"
- "Which research informs epic {epic-name}?"

### C. Status and Progress Queries
- "What's the status of epic {epic-name}?"
- "How many tasks are completed in story {story-name}?"
- "Show me in-progress tasks"
- "Which tasks are blocked?"
- "What's the overall project progress?"
- "Is epic {epic-name} complete?"

### D. Dependency and Blocking Queries
- "What blocks task {task-id}?"
- "Which tasks depend on {task-id}?"
- "Show me the critical path for epic {epic-name}"
- "What are the task dependencies?"

### E. Planning and Estimation Queries
- "How many story points in epic {epic-name}?"
- "What's the estimated effort for story {story-name}?"
- "How many tasks need to be created for story {story-name}?"
- "How many story points are completed vs remaining?"

### F. Research and Decision Queries
- "What research informs epic {epic-name}?"
- "Show me all decisions in this project"
- "Which decisions influenced story {story-name}?"
- "What research informs decision {decision-name}?"
- "Show me unresolved decisions from epic {epic-name}"
- "Which decisions are pending review?"
- "What decisions were made for story {story-name}?"

### G. Search and Filter Queries
- "Find tasks assigned to {assignee}"
- "Show me high-priority tasks"
- "List tasks due before {date}"
- "What tasks are overdue?"

### H. Metadata Queries
- "When was task {task-id} created?"
- "Who is assigned to story {story-name}?"
- "Show me task tags/labels"
- "What was decided in retrospective {retro-name}?"
- "What lessons were learned from epic {epic-name}?"

## Step 3: Execute Query Against Storage Backend

**Query the storage backend systematically:**

1. **Use basicmemory search/fetch tools** to:
   - Search for artifacts by type, status, name, or ID
   - Retrieve artifact content and frontmatter
   - Extract relationships from frontmatter links
   - Parse story points, status, dates, assignees
   - Validate artifact hierarchy and relationships

2. **For PRD discovery queries:**
   ```
   Query storage for all [PRD] artifacts with status != "Superseded"
   Return: List of PRDs with titles, IDs, linked epics, status
   ```

3. **For epic discovery & relationship queries:**
   ```
   Query storage for [Epic] artifacts
   For each epic: Find paired [Spec] (1:1 relationship - CRITICAL)
   For each epic: Find linked [Story], [Task], [Research], [Decision]
   Return: Epic titles, IDs, status, linked spec, story count, task count
   ```

4. **For story & task queries:**
   ```
   Query storage for [Story] with epicId = {epic-id}
   For each story: Find linked [Task] artifacts
   Count completed tasks / total tasks per story
   Calculate percentage complete and aggregate story points
   ```

5. **For research & decision queries:**
   ```
   Query [Research] artifacts linked to epic/spec/story/task
   Query [Decision] artifacts with status = "Pending", "Unresolved", "Decided"
   Extract links showing which artifacts were influenced by these decisions
   Return: Research/Decision titles, IDs, linked artifacts, status
   ```

6. **For retrospective queries:**
   ```
   Query [Retrospective] artifacts linked to epic
   Extract action items, lessons learned, unresolved decisions from epic
   Return: Retrospective title, date, linked epic, key learnings
   ```

7. **For dependency queries:**
   ```
   Query [Task] frontmatter "links" field for blocking relationships
   Build dependency graph across all tasks
   Identify critical path and blockers
   Return: Dependency tree with status of each task
   ```

8. **VALIDATION CHECKS** (after executing queries):
   ```
   ⚠️  Check for common issues:
   - Does each [Epic] have exactly one paired [Spec]?
   - Do all [Task] artifacts link to both parent [Story] AND parent [Epic]?
   - Are there [Story] artifacts without linked [Task] artifacts?
   - Are any [Decision] artifacts in "Unresolved" status?
   - Are statuses consistent? (e.g., epic "Active" but all stories "Done")
   - Do all [Research] artifacts have links to artifacts they inform?
   Report issues in validation section of response
   ```

## Step 4: Format Query Response

**Structure response clearly with artifact type indicators:**

### Artifact Type Indicators
Use consistent visual indicators for each artifact type:
- **[PRD]** 📋 - Strategic direction
- **[Epic]** 🎯 - Major work package
- **[Spec]** 📐 - Detailed requirements
- **[Research]** 🔬 - Investigation & findings
- **[Decision]** ⚖️ - Architectural choice
- **[Story]** 📖 - User scenario
- **[Task]** ✅ - Implementation work
- **[Retrospective]** 📝 - Post-completion review

### Format for PRD Discovery Queries
```
📊 PRDS IN PROJECT

├── 📋 1.1.1-prd-user-authentication (Status: Approved)
│   └── 3 epics, 12 stories, 24 tasks
├── 📋 1.2.1-prd-payment-system (Status: In Review)
│   └── 2 epics, 8 stories, 16 tasks
└── 📋 1.3.1-prd-admin-dashboard (Status: Draft)
    └── 0 epics (not yet planned)

Total: 3 PRDs, 5 active epics
```

### Format for Epic Discovery Queries
```
📊 EPICS IN PROJECT

Active Epics:
├── 🎯 2.1.1-epic-user-authentication (Status: In Progress)
│   ├── Spec: 📐 2.1.1-spec-user-authentication-requirements ✅
│   ├── Stories: 4 (3 done, 1 in progress)
│   ├── Tasks: 8 (6 done, 2 in progress)
│   └── 65% complete (13/20 story points)
├── 🎯 2.2.1-epic-payment-system (Status: Planning)
│   ├── Spec: 📐 2.2.1-spec-payment-requirements ✅
│   ├── Stories: 3 (0 done)
│   ├── Tasks: 0 (not yet created)
│   └── 0% complete (planning phase)
└── 🎯 2.3.1-epic-admin-dashboard (Status: To Do)
    ├── Spec: ❌ Missing! (CRITICAL - create with epic)
    ├── Stories: 0
    ├── Tasks: 0
    └── Blocked on spec creation

Total: 3 active epics, 7 stories, 8 tasks, 65% complete across project
```

### Format for Relationship Queries
```
📌 STORIES IN EPIC: 2.1.1-epic-user-authentication

📐 Paired Spec: 2.1.1-spec-user-authentication-requirements ✅

├── 📖 4.1.1-story-user-login-flow (8 points, In Progress)
│   ├── Tasks: 5.1.1 ✅, 5.2.1 ✅, 5.3.1 (3 total, 2 done, 1 in progress)
│   └── Progress: 67% complete
├── 📖 4.2.1-story-password-reset (5 points, To Do)
│   ├── Tasks: 5.4.1, 5.5.1 (2 total, 0 done)
│   └── Progress: 0% complete
└── 📖 4.3.1-story-account-recovery (5 points, Blocked)
    ├── Tasks: 5.6.1 (1 total, 0 done)
    ├── Blocked by: 🔬 3.1.1-research-recovery-options (In Progress)
    └── Progress: 0% complete (blocked on research)

Related Research:
├── 🔬 3.1.1-research-recovery-options (Status: In Progress)
└── 🔬 3.2.1-research-2fa-approaches (Status: Complete)

Related Decisions:
├── ⚖️ 6.1.1-decision-jwt-vs-session (Status: Decided → Use JWT)
└── ⚖️ 6.2.1-decision-2fa-provider (Status: Pending)

Summary: 3 stories (4.1.1 done, 4.2.1 ready, 4.3.1 blocked), 18 story points, 6 tasks total
```

### Format for Status Queries
```
✅ STATUS: 🎯 2.1.1-epic-user-authentication

📋 Project: 2.1.1-epic-user-authentication
📐 Spec: 2.1.1-spec-user-authentication-requirements ✅ Complete
🎯 Epic Status: In Progress
📊 Overall Progress: 65% complete (13/20 story points done)

By Story:
├── 📖 4.1.1-story-user-login-flow (8 points): 100% ✅ Done
│   └── All 3 tasks completed
├── 📖 4.2.1-story-password-reset (5 points): 50% ⏳ In Progress
│   └── 1 of 2 tasks done
└── 📖 4.3.1-story-account-recovery (5 points): 0% ❌ Not Started
    └── Blocked on 🔬 research-recovery-options

Task Status Breakdown:
Done ✅: 6 tasks (12 story points)
├── 5.1.1-task-backend-jwt-implementation ✅
├── 5.2.1-task-frontend-login-component ✅
└── ... (4 more)

In Progress ⏳: 2 tasks (3 story points)
├── 5.4.1-task-password-reset-endpoint
└── 5.7.1-task-recovery-email-logic

Blocked 🔴: 1 task (5 story points)
├── 5.8.1-task-recovery-flow (depends on research 3.1.1)

Not Started ⭕: 0 tasks

Decisions Impact:
├── ⚖️ 6.1.1-decision-jwt-vs-session: ✅ DECIDED (implemented, no changes needed)
└── ⚖️ 6.2.1-decision-2fa-provider: ⏳ PENDING (blocks story 4.3.1)

⚠️  Validation Issues:
- Decision 6.2.1 is pending and impacts story 4.3.1 (blocked)
- Recommend reviewing 6.2.1 to unblock recovery story
```

### Format for Dependency Queries
```
🔗 DEPENDENCIES: ✅ 5.2.1-task-frontend-login-component

Story: 📖 4.1.1-story-user-login-flow
Epic: 🎯 2.1.1-epic-user-authentication

This task BLOCKS:
├── 5.3.1-task-integration-testing (waiting on login UI)
│   └── Status: ⏳ In Progress (blocked)
└── 5.9.1-task-e2e-login-tests (waiting on UI)
    └── Status: ⭕ Not Started (waiting)

This task DEPENDS ON:
├── 5.1.1-task-backend-jwt-implementation ✅ DONE (UNBLOCKED)

Same-Story Tasks (parallel possible):
├── 5.1.1-task-backend-jwt-implementation ✅ Done
└── 5.3.1-task-integration-testing ⏳ Blocked on this task

Critical Path Analysis:
Path: 5.1.1 ✅ → 5.2.1 ✅ → 5.3.1 ⏳ → 5.9.1 ⭕
Points: 8 + 5 + 5 + 3 = 21 story points
Duration: ~13 days (critical path for epic)
Status: On track (5.1.1 and 5.2.1 complete, 5.3.1 in progress)

Recommendation:
- 5.2.1 is complete ✅
- Unblock 5.3.1 by moving it to In Progress
- This will unblock 5.9.1 downstream
- Critical path on schedule
```

### Format for Estimation Queries
```
📈 STORY POINTS: 🎯 2.1.1-epic-user-authentication

Epic Estimate: 18 story points (3-4 weeks effort)
├── 📖 4.1.1-story-user-login-flow: 8 points
├── 📖 4.2.1-story-password-reset: 5 points
└── 📖 4.3.1-story-account-recovery: 5 points

Breakdown by Story Status:
Done ✅: 8 points (44%)
├── 📖 4.1.1-story-user-login-flow: 8 points ✅
│   └── All tasks complete (3 tasks, 8 points total)

In Progress ⏳: 5 points (28%)
├── 📖 4.2.1-story-password-reset: 5 points
│   └── 1 of 2 tasks done (1 task in progress, 1 task waiting)

Blocked/Not Started ❌: 5 points (28%)
├── 📖 4.3.1-story-account-recovery: 5 points
│   └── 0 of 1 task done (blocked on decision 6.2.1)

Summary:
- Total Estimated: 18 story points
- Completed: 8 points (44%)
- In Progress: 5 points (28%)
- Remaining: 5 points (28%)
- Blocked: 0 points (0%) [One story blocked on decision]
- On Track: 65% completion based on story points
- Est. Time to Complete: ~2 weeks (5 points remaining + current in-progress)

Task-Level Point Distribution:
- Tasks 1-8 points: 3 tasks (max 8 points each)
- Story range: 5-13 points per user scenario (this epic: 5-8 points)
- Epic range: weeks to months for planning
```

### Format for Research & Decision Queries
```
🔬 & ⚖️ RESEARCH & DECISIONS: 🎯 2.1.1-epic-user-authentication

Research Done:
├── 🔬 3.1.1-research-jwt-best-practices (Status: Complete)
│   ├── Used by: 📖 4.1.1, ⚖️ 6.1.1 (influenced decision)
│   └── Key Finding: JWT better than sessions for stateless auth
├── 🔬 3.2.1-research-2fa-approaches (Status: Complete)
│   ├── Used by: 📖 4.3.1
│   └── Key Finding: TOTP recommended over SMS
└── 🔬 3.3.1-research-password-reset-security (Status: In Progress)
    ├── Used by: 📖 4.2.1
    └── Key Finding: Pending (blocks story)

Decisions Made:
├── ⚖️ 6.1.1-decision-jwt-vs-session (Status: Decided ✅)
│   ├── Informed by: 🔬 3.1.1-research-jwt-best-practices
│   ├── Influences: 📖 4.1.1, ✅ 5.1.1, ✅ 5.2.1 (implemented)
│   ├── Decision: Use JWT for authentication tokens
│   └── Trade-offs: Stateless (good) but token revocation harder (mitigated)
└── ⚖️ 6.2.1-decision-2fa-provider (Status: Pending ⏳)
    ├── Informed by: 🔬 3.2.1 (complete), waiting on 3.3.1
    ├── Blocks: 📖 4.3.1-story-account-recovery
    ├── Decision: Pending review
    └── Impact: Story 4.3.1 cannot progress until decided

Summary:
- Research: 2 complete, 1 in progress
- Decisions: 1 decided, 1 pending (blocking story 4.3.1)
- Action: Complete 🔬 3.3.1 and decide ⚖️ 6.2.1 to unblock story
```

### Format for Search/Filter Queries
```
🔍 SEARCH: high-priority in-progress tasks

Found: 4 high-priority tasks

├── ✅ 5.1.1-task-backend-jwt-implementation (Status: Done, 8 points)
├── ⏳ 5.2.1-task-frontend-login-component (Status: In Progress, 5 points)
├── ⭕ 5.4.1-task-password-reset-endpoint (Status: To Do, 5 points)
└── 🔴 5.7.1-task-recovery-email-logic (Status: Blocked, 3 points)

Points Summary: 21 total (8 done, 5 in progress, 5 to do, 3 blocked)
Stories: 3 affected (4.1.1 done, 4.2.1 in progress, 4.3.1 blocked)
Epics: 2.1.1-epic-user-authentication

Next Actions:
- Move 5.2.1 to done to unblock downstream tasks
- Resolve ⚖️ 6.2.1 decision to unblock story 4.3.1
- Start 5.4.1 (to-do tasks) if team capacity available
```

## Step 5: Provide Context-Aware Suggestions

**Based on query results, suggest next actions tailored to project phase:**

### Planning Phase (Creating Artifacts)

**If no PRDs exist:**
```
💡 Start Planning:
- No PRDs found in project
- Use `/project:plan:prd "strategic direction"` to define business goals
- Once PRD is approved, create epics with `/project:plan:epic`
```

**If epic has no paired spec:**
```
⚠️  Planning Gap Detected:
- Epic 2.1.1 exists but has no paired [Spec] (1:1 relationship required)
- [Spec] should auto-create with Epic, but can use `/project:plan:epic` to recreate
- Cannot proceed to stories without spec
```

**If epic has no stories:**
```
💡 Next Planning Step:
- Epic 2.2.1 has no user stories yet
- Use `/project:plan:stories "2.2.1"` to decompose into stories
- Each story represents a user scenario or workflow
```

**If stories have no tasks:**
```
💡 Next Planning Step:
- Story 4.3.1 has no implementation tasks yet
- Use `/project:plan:tasks "4.3.1"` to break story into specific work items
- Each task is one unit of implementation work (max 8 story points)
```

**If missing research or decisions:**
```
💡 Reduce Planning Risk:
- Research questions identified but not documented
- Use `/project:plan:research "question"` to investigate
- Use `/project:plan:decision "topic"` to document architectural choices
- Link decisions to specs/stories to show impact
```

### Execution Phase (Implementing Tasks)

**If asking about in-progress work:**
```
💡 Next Steps:
- 2 tasks in progress: Use `/project:view [task-id]` to check implementation details
- Blockers found: Review `/project:view [blocking-task-id]` to understand dependency
- Use `/project:do:task [task-id]` to start work on high-priority items
```

**If asking about blocked tasks:**
```
⚠️  Blockers Detected:
- Task 5.2.1 blocked by 5.1.1 (not yet started)
- Task 5.3.1 blocked by 5.2.1 (in review)
- Critical Path: 5.1.1 → 5.2.1 → 5.3.1 (12 story points, ~8 days estimated)
- Action: Complete 5.1.1 first with `/project:do:task 5.1.1` to unblock downstream
```

**If asking about critical path:**
```
💡 Work Prioritization:
- Critical path for epic 2.1.1: 5.1.1 → 5.2.1 → 5.3.1 (12 story points, ~8 days)
- Parallel work available: 5.4.1, 5.5.1 (can work simultaneously)
- Next: Start 5.1.1 with `/project:do:task 5.1.1`
```

### Closure Phase (Completing Epic)

**If epic is complete:**
```
✅ Epic Complete: 2.1.1-epic-user-authentication
- All stories done: 4 stories, 18 story points
- All tasks completed: 8 tasks
- Unresolved decisions: 2 decisions need review
- Action: Use `/project:close:retro "2.1.1"` to document lessons and resolve decisions
```

**If asking about unresolved decisions:**
```
⚠️  Unresolved Decisions Found:
- 6.1.1-decision-jwt-vs-session (status: Pending)
- 6.2.1-decision-database-choice (status: Unresolved)
- These must be resolved before epic closure
- Action: Use `/project:view [decision-id]` to review
- When epic is done: Use `/project:close:retro "epic-name"` to formalize in retrospective
```

**If asking about retrospective:**
```
💡 Post-Epic Review:
- Retrospective 9.1.1 for epic 2.1.1 completed
- Key learnings: [summary of lessons]
- Action items: [list of improvements]
- Next phase: Apply learnings to next epic with `/project:plan:epic`
```

## Step 6: Handle Ambiguous or Complex Queries

**When query is unclear:**
```
❓ Query unclear: "Show me the auth stuff"

Did you mean one of these?
1. Show all artifacts related to epic 2.1.1-epic-user-authentication?
2. List tasks for story 4.1.1-story-user-login-flow?
3. Display decision 6.1.1-decision-auth-approach?

Clarify by providing:
- Artifact type (epic, story, task, decision, etc.)
- Specific epic/story name or ID
- What aspect interests you (status, dependencies, estimation, etc.)

Examples:
- `/project:query "status of epic user-authentication"`
- `/project:query "tasks in story login-flow"`
- `/project:query "decisions in epic payment-system"`
```

**When query requires multiple artifacts:**
```
📌 Your query spans multiple artifacts

First, let me show the epic-level view:
[Display epic summary]

Then specific story details:
[Display story 1]
[Display story 2]

Finally, task breakdown:
[Display all tasks]

For more detail on any artifact: `/project:view [artifact-id]`
```

## Step 7: Validate and Close

**Verify answer addresses the question:**

1. Did the query get fully answered?
2. Are results accurate (from storage backend)?
3. Are relationships correctly represented?
4. Did I provide actionable next steps?

**If still unclear:**
```
Not sure if this answers your question. Try:
- `/project:view [artifact-id]` for detailed artifact information
- `/project:current` for overall project status
- `/project:query "what epics exist?"` for simpler queries
```

## Query Examples

**Example 1: Top-Level Planning**
```
/project:query "What PRDs exist and their status?"
→ Returns all PRDs with linked epics, story count, completion %
→ Suggests: Create more epics with /project:plan:epic if gaps found
```

**Example 2: Epic Breakdown**
```
/project:query "Show me all stories in epic 2.1.1"
→ Returns: Stories with status, tasks per story, paired spec check
→ Shows: Research & decisions influencing this epic
→ Suggests: Create missing stories with /project:plan:stories if needed
```

**Example 3: Spec Validation**
```
/project:query "Does epic 2.2.1 have a paired spec?"
→ Returns: Spec status (present/missing) - CRITICAL relationship check
→ If missing: Suggests recreating epic with /project:plan:epic
```

**Example 4: Research Impact**
```
/project:query "What research informs epic 2.1.1?"
→ Returns: All research artifacts linked to epic/specs/stories
→ Shows: Which artifacts were influenced by this research
→ Suggests: Resolve decisions based on research with /project:plan:decision
```

**Example 5: Decision Impact**
```
/project:query "Which decisions are still pending?"
→ Returns: All unresolved decisions and what they block
→ Shows: Stories/tasks waiting on each decision
→ Suggests: Review and decide with /project:view [decision-id]
```

**Example 6: Task Dependencies & Critical Path**
```
/project:query "What's the critical path for epic 2.1.1?"
→ Returns: Dependency chain with blocking relationships
→ Shows: Which tasks are on critical path (longest chain)
→ Suggests: Prioritize critical path tasks with /project:do:task
```

**Example 7: Completion Status**
```
/project:query "Is epic 2.1.1 complete?"
→ Returns: Overall status, story-by-story breakdown, blockers
→ Shows: Unresolved decisions preventing closure
→ Suggests: Use /project:close:retro "2.1.1" when all work done
```

**Example 8: Story Points Estimation**
```
/project:query "How many story points in epic 2.1.1?"
→ Returns: Total estimate, completed, in-progress, remaining
→ Shows: Points by story, task-level breakdown
→ Includes: Effort estimates (weeks/months) and pace metrics
```

**Example 9: Planning Gaps**
```
/project:query "Which epics have no specs?"
→ Returns: Epics missing paired specs (CRITICAL issue)
→ Suggests: Recreate with /project:plan:epic to auto-create spec
```

**Example 10: Retrospective Planning**
```
/project:query "What lessons were learned from epic 2.1.1?"
→ Returns: Retrospective document, action items, decision reviews
→ Shows: Unresolved decisions from epic and their current status
→ Suggests: Apply learnings to next epic planning phase
```

## Command Reference Guide

When `/project:query` results suggest next actions, use these commands:

### Planning Phase Commands

| What You Need | Command | Result |
|---------------|---------|--------|
| Create strategic direction | `/project:plan:prd "vision"` | 📋 1.x.x-prd-{title} |
| Create major work package | `/project:plan:epic "epic name"` | 🎯 2.x.x-epic-{title} + 📐 Spec |
| Create user stories | `/project:plan:stories "epic name"` | 📖 4.x.x-story-{title} (multiple) |
| Create implementation tasks | `/project:plan:tasks "story name"` | ✅ 5.x.x-task-{title} (multiple) |
| Document research findings | `/project:plan:research "question"` | 🔬 3.x.x-research-{title} |
| Record architectural decision | `/project:plan:decision "topic"` | ⚖️ 6.x.x-decision-{title} |

### Execution Phase Commands

| What You Need | Command | Result |
|---------------|---------|--------|
| View task details | `/project:view 5.1.1` | Full task information + links |
| Start implementing task | `/project:do:task "5.1.1"` | Task execution workflow |
| Check epic progress | `/project:query "epic 2.1.1 status"` | Progress report + blockers |
| Find critical path | `/project:query "critical path epic 2.1.1"` | Dependency analysis |

### Closure Phase Commands

| What You Need | Command | Result |
|---------------|---------|--------|
| Close epic & document lessons | `/project:close:retro "epic name"` | 📝 9.x.x-retrospective-{title} |
| View retrospective | `/project:view 9.1.1` | Lessons, decisions review, action items |

### Query Phase Commands (This Command)

| What You Want to Know | Command | Returns |
|----------------------|---------|---------|
| Overall project status | `/project:query "project status"` | All artifacts + progress + blockers |
| PRD breakdown | `/project:query "PRDs and their epics"` | PRD list + linked epics |
| Epic details | `/project:query "epic 2.1.1 details"` | Epic + Spec + Stories + Tasks |
| Story breakdown | `/project:query "stories in epic 2.1.1"` | Stories + Tasks + Research/Decisions |
| Research impact | `/project:query "research for epic 2.1.1"` | Research artifacts + influenced items |
| Decisions impact | `/project:query "decisions in epic 2.1.1"` | Decision list + status + blockers |
| Task dependencies | `/project:query "task 5.1.1 dependencies"` | Blocking graph + critical path |
| Completion status | `/project:query "is epic 2.1.1 complete"` | Status + unresolved decisions |
| Unresolved decisions | `/project:query "pending decisions"` | Decision list + what they block |
| Learning outcomes | `/project:query "retrospective for 2.1.1"` | Lessons + action items + improvements |

### What NOT to Do

❌ Use `/project:do:task` for planning gaps (only for EXECUTION)
❌ Suggest artifact creation without correct command/format
❌ Create tasks before stories exist
❌ Create epics without specs
❌ Link tasks to only story (must link to both story AND epic)
❌ Leave decisions unresolved at epic closure

### What You MUST Do

✅ Always recommend CORRECT creation command based on context
✅ Show Johnny Decimal format in suggestions (e.g., `2.1.1-epic-title`)
✅ Check for and report missing specs on epics (1:1 relationship)
✅ Validate task links to parent story AND parent epic
✅ Highlight blocked stories/decisions preventing progress
✅ Suggest `/project:close:retro` when epic is complete
✅ Link research/decisions to artifacts they influence
✅ Show phase-aware suggestions (planning vs execution vs closure)

---

## Implementation Notes

**Use storage backend:**
- Query all artifact types consistently
- Respect artifact status values (To Do, In Progress, Done, Pending, Unresolved, etc.)
- Extract frontmatter links for relationships
- Calculate aggregations (sum story points, count tasks, count decisions, etc.)
- Validate artifact hierarchy and 1:1 epic-spec pairing

**Response patterns:**
- Always show [ProjectId] at start
- Use artifact type indicators (📋 📐 🎯 🔬 ⚖️ 📖 ✅ 📝)
- Use ASCII art for readability (boxes, trees, charts)
- Include status indicators (✅ done, ⏳ in progress, ❌ blocked, ⭕ not started, 🔴 blocked)
- Provide actionable next steps with SPECIFIC commands
- Link to `/project:view` for details and `/project:plan:*` for creation

**Validation checks:**
- Does each Epic have exactly one paired Spec?
- Do all Tasks link to parent Story AND parent Epic?
- Are Decisions blocking any Stories/Tasks?
- Are Research artifacts properly influencing linked artifacts?
- Is Epic status consistent with Story/Task status?
- Are there orphaned artifacts (no parent links)?

**Error handling:**
- Return clear errors when artifacts not found
- Suggest corrections for misspelled artifact names
- Handle ambiguous queries gracefully
- Provide usage examples from planning artifacts framework
- Warn about common issues (missing specs, orphaned tasks, etc.)

---

## Why This Matters

This command transforms artifact data into meaningful answers that help agents and humans understand project state. By understanding the full artifact hierarchy and relationships, you can:

- **Plan Better**: Know what research informs which decisions
- **Execute Faster**: See dependencies and critical path
- **Close Cleanly**: Resolve decisions before epic closure
- **Learn Continuously**: Review retrospectives and apply learnings

The planning artifacts framework creates a complete, auditable record of how work evolved from strategic vision through closure and lessons learned.
