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
- "What epics exist in this project?"
- "Show me all tasks"
- "List all stories for epic {epic-name}"
- "What research has been done?"
- "Which decisions are unresolved?"
- "Show retrospectives"

### B. Artifact Relationship Queries
- "What stories does epic {epic-name} contain?"
- "What tasks implement story {story-name}?"
- "What epic does task {task-id} belong to?"
- "Show me the spec for epic {epic-name}"
- "Which research informed decision {decision-name}?"

### C. Status and Progress Queries
- "What's the status of epic {epic-name}?"
- "How many tasks are completed in story {story-name}?"
- "Show me in-progress tasks"
- "Which tasks are blocked?"
- "What's the overall project progress?"

### D. Dependency and Blocking Queries
- "What blocks task {task-id}?"
- "Which tasks depend on {task-id}?"
- "Show me the critical path for epic {epic-name}"
- "What are the task dependencies?"

### E. Planning and Estimation Queries
- "How many story points in epic {epic-name}?"
- "What's the estimated effort for story {story-name}?"
- "How many tasks need to be created for story {story-name}?"

### F. Search and Filter Queries
- "Find tasks assigned to {assignee}"
- "Show me high-priority tasks"
- "List tasks due before {date}"
- "What tasks are overdue?"

### G. Metadata Queries
- "When was task {task-id} created?"
- "Who is assigned to story {story-name}?"
- "Show me task tags/labels"

## Step 3: Execute Query Against Storage Backend

**Query the storage backend systematically:**

1. **Use basicmemory search/fetch tools** to:
   - Search for artifacts by type, status, name, or ID
   - Retrieve artifact content and frontmatter
   - Extract relationships from frontmatter links
   - Parse story points, status, dates, assignees

2. **For discovery queries:**
   ```
   Query storage for all [Epic] artifacts with status != "Cancelled"
   Return: List of epics with titles, IDs, status
   ```

3. **For relationship queries:**
   ```
   Query storage for [Story] with epicId = {epic-id}
   Return: Story titles, IDs, linked tasks
   ```

4. **For status queries:**
   ```
   Query storage for [Task] with status = "Done" in story {story-id}
   Count completed tasks / total tasks
   Calculate percentage complete
   ```

5. **For dependency queries:**
   ```
   Query [Task] frontmatter "links" field for blocking relationships
   Build dependency graph
   Identify critical path
   ```

## Step 4: Format Query Response

**Structure response clearly:**

### Format for Discovery Queries
```
📊 EPICS IN PROJECT

Active Epics:
├── 2.1.1-epic-user-authentication (Status: In Progress)
│   └── 4 stories, 8 tasks, 65% complete
├── 2.2.1-epic-payment-system (Status: Planning)
│   └── 3 stories, 0 tasks, 0% complete
└── 2.3.1-epic-admin-dashboard (Status: To Do)
    └── 2 stories, 0 tasks, 0% complete

Total: 3 active epics, 9 stories, 8 tasks
```

### Format for Relationship Queries
```
📌 STORIES IN EPIC: 2.1.1-epic-user-authentication

├── 4.1.1-story-user-login-flow (8 points, In Progress)
│   └── Tasks: 5.1.1, 5.2.1, 5.3.1 (3 total, 2 done)
├── 4.2.1-story-password-reset (5 points, To Do)
│   └── Tasks: 5.4.1, 5.5.1 (2 total, 0 done)
└── 4.3.1-story-account-recovery (5 points, Planned)
    └── Tasks: 5.6.1 (1 total, 0 done)

Summary: 3 stories, 18 story points, 6 tasks total
```

### Format for Status Queries
```
✅ STATUS: epic 2.1.1-epic-user-authentication

Overall Progress: 65% complete (5/8 tasks done)

By Story:
├── 4.1.1-story-user-login-flow: 100% (3/3 tasks done)
├── 4.2.1-story-password-reset: 50% (1/2 tasks done)
└── 4.3.1-story-account-recovery: 0% (0/1 tasks done)

In Progress: 2 tasks
├── 5.4.1-task-password-reset-endpoint
└── 5.7.1-task-recovery-email-logic

Done: 5 tasks
├── 5.1.1-task-backend-jwt-implementation ✅
├── 5.2.1-task-frontend-login-component ✅
└── ... (2 more)

Blocked: 0 tasks
```

### Format for Dependency Queries
```
🔗 DEPENDENCIES: task 5.2.1-task-frontend-login-component

This task BLOCKS:
├── 5.3.1-task-integration-testing (waiting on login UI)

This task DEPENDS ON:
├── 5.1.1-task-backend-jwt-implementation ✅ (DONE - unblocked)

Related Tasks:
├── 5.4.1-task-password-reset-endpoint (same story)

Critical Path Impact:
└── Completes: story 4.1.1 → epic 2.1.1 → next: 4.2.1
```

### Format for Estimation Queries
```
📈 STORY POINTS: epic 2.1.1-epic-user-authentication

Estimated: 13 points
├── 4.1.1-story-user-login-flow: 8 points
├── 4.2.1-story-password-reset: 5 points
└── 4.3.1-story-account-recovery: 5 points (WAIT: 8+5+5=18, not 13)

Completed: 8 points (62%)
├── 4.1.1-story-user-login-flow: 8 points ✅ DONE
└── (None in progress)

Remaining: 10 points (38%)
├── 4.2.1-story-password-reset: 5 points
└── 4.3.1-story-account-recovery: 5 points
```

### Format for Search/Filter Queries
```
🔍 SEARCH: high-priority tasks

Found: 4 high-priority tasks

├── 5.1.1-task-backend-jwt-implementation (Status: Done, 8 points)
├── 5.2.1-task-frontend-login-component (Status: In Progress, 5 points)
├── 5.4.1-task-password-reset-endpoint (Status: To Do, 5 points)
└── 5.7.1-task-recovery-email-logic (Status: Blocked, 3 points)

Total Story Points: 21 (8 done, 5 in progress, 8 to do)
```

## Step 5: Provide Context-Aware Suggestions

**Based on query results, suggest next actions:**

**If asking about unfinished work:**
```
💡 Next Steps:
- 2 tasks in progress: Use `/project:view [task-id]` to check details
- 8 tasks to do: Use `/project:do:task [task-id]` to start implementing
- No blocked tasks detected
```

**If asking about planning gaps:**
```
💡 Next Steps:
- Epic 2.2.1 has no tasks created yet
- Use `/project:plan:stories "payment system"` to break into stories
- Then use `/project:plan:tasks [story-id]` for each story
```

**If asking about dependencies:**
```
💡 Next Steps:
- Critical path: 5.1.1 → 5.2.1 → 5.3.1 (12 story points, 8 days estimated)
- Work on 5.1.1 first to unblock downstream tasks
- Use `/project:do:task 5.1.1` to start work
```

**If asking about unresolved decisions:**
```
💡 Next Steps:
- 2 unresolved decisions will be reviewed in retrospective
- During closing phase, use `/project:closing:retrospective [epic-name]`
- Reference these decisions: 6.1.1-decision-auth-approach, 6.2.1-decision-database-choice
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

**Example 1: Project Status**
```
/project:query "What's the status of this project?"
→ Returns overall progress, active artifacts, blockers
```

**Example 2: Epic Breakdown**
```
/project:query "Show me all stories in epic 2.1.1"
→ Returns linked stories with status and task counts
```

**Example 3: Task Dependencies**
```
/project:query "What blocks task 5.2.1?"
→ Returns blocking tasks and unblocked prerequisites
```

**Example 4: Estimation**
```
/project:query "How many story points in epic 2.1.1?"
→ Returns total, completed, remaining, by story
```

**Example 5: Search**
```
/project:query "Show me all high-priority in-progress tasks"
→ Returns filtered task list with details
```

**Example 6: Planning Gaps**
```
/project:query "Which epics have no tasks created?"
→ Returns epics without tasks, suggests next action
```

**Example 7: Relationships**
```
/project:query "What research informed decision 6.1.1?"
→ Returns linked research artifacts with summaries
```

## Implementation Notes

**Use storage backend:**
- Query all artifact types consistently
- Respect artifact status values (To Do, In Progress, Done, etc.)
- Extract frontmatter links for relationships
- Calculate aggregations (sum story points, count tasks, etc.)

**Response patterns:**
- Always show [ProjectId] at start
- Use ASCII art for readability (boxes, trees, charts)
- Include status indicators (✅ done, ⏳ in progress, ❌ blocked)
- Provide actionable next steps
- Link to `/project:view` and other commands for details

**Error handling:**
- Return clear errors when artifacts not found
- Suggest corrections for misspelled artifact names
- Handle ambiguous queries gracefully
- Provide usage examples

This command transforms artifact data into meaningful answers that help agents and humans understand project state.
