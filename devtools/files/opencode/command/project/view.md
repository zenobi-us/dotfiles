# View Planning Artifact


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

Display detailed information about a planning artifact (PRD, Epic, Spec, Story, Task, Research, Decision, or Retrospective).

**Task:** Display artifact details for: $ARGUMENTS
**Storage Backend**: basicmemory

> [!CRITICAL]
> Before doing anything, run these skills:
> - skills_projectmanagement_storage_basicmemory
> - skills_projectmanagement_info_planning_artifacts
>
> All [Planning Artifacts] are managed through the skills listed above.
> Use the storage backend to retrieve and display artifacts.

## Step 1: Parse Input Argument

**Determine the artifact identifier format:**

1. **Johnny Decimal Format**: `1.1.1-prd-title`, `2.1.1-epic-title`, `5.1.1-task-title`, etc.
   - Extract: Category, Sequence, Type, Title
   - Use basicmemory to fetch artifact by ID

2. **GitHub Issue Number**: `123` or `#123`
   - Fetch GitHub issue details using gh CLI
   - Display issue information

3. **GitHub Pull Request Number**: `pr-456` or `PR-456`
   - Fetch GitHub PR details using gh CLI
   - Display PR information

4. **Invalid Format**:
   - Return error: "Invalid artifact format. Use Johnny Decimal (5.1.1-task-name), issue number (#123), or PR (pr-456)"

**Examples:**
- `view 5.1.1-task-database-schema` → Fetch Task artifact
- `view 2.1.1-epic-user-auth` → Fetch Epic artifact
- `view #42` → Fetch GitHub issue #42
- `view pr-89` → Fetch GitHub PR #89

## Step 2: Fetch Artifact from Storage Backend

**For Johnny Decimal artifacts:**

1. Use basicmemory_fetch to retrieve the artifact
2. Extract artifact type from format (prd, epic, spec, story, task, research, decision, retrospective)
3. Extract artifact ID for lookups
4. Verify artifact exists in storage

**If artifact not found:**
```
❌ Error: Artifact not found
- ID: 5.1.1-task-example
- Checked in: 5-tasks/ folder
- Suggestion: Use `/project:current` to see available artifacts
```

## Step 3: Format and Display Artifact

**Display complete artifact information:**

### Header Section
```
┌─────────────────────────────────────────────────────────────┐
│ [ARTIFACT TYPE] - [TITLE]                                   │
│ ID: [Johnny Decimal ID]  │  Status: [status]                │
│ Project: [ProjectId]                                        │
└─────────────────────────────────────────────────────────────┘
```

### Content Sections (based on artifact type)

**For [Prd]:**
- Executive Summary
- Problem Statement
- User Stories
- Functional Requirements
- Non-Functional Requirements
- Success Metrics
- Implementation Approach
- Risk Assessment

**For [Epic]:**
- Overview
- Goals
- Success Criteria
- Estimated Effort (weeks/months)
- Related [Spec] (1:1 pairing)
- Linked [Stories]
- Status

**For [Spec]:**
- Overview
- Functional Requirements
- Non-Functional Requirements
- Technical Considerations
- Acceptance Criteria
- Related [Epic]
- Linked [Stories]

**For [Story]:**
- User Story (As a... I want... so that...)
- Acceptance Criteria
- User Workflow
- Edge Cases
- Dependencies
- Story Points
- Status
- Linked [Epic] and [Spec]
- Linked [Tasks]

**For [Task]:**
- Description
- Acceptance Criteria
- Implementation Approach
- Status
- Story Points
- Linked [Story] and [Epic]
- Task Dependencies (blocking, dependent_on, related_to)

**For [Research]:**
- Research Question
- Methodology
- Key Findings
- Recommendations
- Limitations
- Linked Artifacts

**For [Decision]:**
- Decision Statement
- Context
- Options Evaluated
- Selected Option
- Rationale
- Status (Decided/Unresolved)
- Linked [Research]
- Linked [Spec]/[Task]

**For [Retrospective]:**
- Scope (Epic or Project)
- Date
- Successes
- Challenges
- Learnings
- Action Items
- Linked [Epic] or Project

### Links Section
```
RELATED ARTIFACTS:
├── Parent: [[2.1.1-epic-user-authentication]]
├── Stories: [[4.1.1-story-login-flow]], [[4.2.1-story-password-reset]]
├── Tasks: [[5.1.1-task-backend-auth]], [[5.2.1-task-frontend-login]]
└── Research: [[3.1.1-research-jwt-vs-session]]
```

### Metadata Section
```
METADATA:
├── Created: [date]
├── Last Updated: [date]
├── Priority: [if applicable]
├── Assignee: [if applicable]
└── Labels: [if applicable]
```

## Step 4: Display GitHub Items (if applicable)

**For GitHub issues:**
1. Display issue title and number
2. Show current status (open/closed)
3. Display labels and assignees
4. Show description and current comments count
5. List linked PRs or related issues

**For GitHub PRs:**
1. Display PR title and number
2. Show current status (open/draft/merged/closed)
3. Display base and compare branches
4. Show author and reviewers
5. List check status
6. Show comment count

## Step 5: Suggest Related Actions

**Based on artifact type, suggest next steps:**

**For [Prd]:**
- "Next: `/project/plan.epic \"[epic-name]\"` to break down into implementable work"

**For [Epic]:**
- "Next: `/project/plan.stories \"[epic-name]\"` to create user stories"
- "Or: View paired Spec with `/project:view [spec-id]`"

**For [Story]:**
- "Next: `/project/plan.tasks \"[story-name]\"` to break down into tasks"
- "Or: Start implementation with `/project/do.task [story-id]`"

**For [Task]:**
- "Next: `/project/do.task [task-id]` to implement this task"
- "Or: View parent Story with `/project/view [story-id]`"

## Step 6: Handle Errors Gracefully

**Artifact not found:**
```
❌ Not found: 5.1.1-task-database-schema

The artifact doesn't exist in storage. Check:
- Is the Johnny Decimal ID correct?
- Did you mean: [[5.1.1-task-database-schema-design]]?
- View available artifacts: /project:current
```

**Ambiguous input:**
```
❓ Ambiguous: "auth"

Could mean multiple artifacts:
1. 2.1.1-epic-user-authentication
2. 3.2.1-research-oauth-alternatives
3. 5.1.1-task-backend-auth-implementation

Use full artifact ID or GitHub issue number
```

## Implementation Notes

**Use basicmemory tools to:**
1. Fetch artifact content and frontmatter
2. Parse artifact relationships from links
3. Format output for readability

**Display considerations:**
- Use monospace formatting for code and artifact IDs
- Use ASCII boxes for section headers
- Use emoji indicators (✅, ⏳, ❌) for status
- Keep display concise but complete
- Include Obsidian wiki-style links for cross-referencing

**Performance:**
- Cache artifact fetches if viewing multiple times
- Load related artifacts on demand
- Don't fetch entire project hierarchy unless requested

This command provides a simple way to inspect any artifact in the planning hierarchy.

</message_to_subagent>