# Show Current Project Context

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

You are analyzing and displaying the current project context, active work, and providing intelligent next-action suggestions. Follow this systematic approach to give comprehensive situational awareness.

**Task:** Analyze and display current project status and suggest next actions
**Storage Backend**: basicmemory

> [!CRITICAL]
> Before doing anything, run these skills:
> - skills_projectmanagement_storage_basicmemory
> - skills_projectmanagement_info_planning_artifacts

For all [Project Artifacts], use the above storage backend.
**NEVER** use fs or direct file access for [Project Artifacts].

For all repo files, use the Read and Glob tools to analyze the current directory structure.


## Step 1: Identify Project

The above instructions should contain steps on creating a [ProjectId]. If not, respond with:

```md
❗ Error: No [ProjectId] found. Please create a [ProjectId] using /project:init before proceeding.
``` 

Print the identified [ProjectId]:

```md
📋 Current Project ID: [ProjectId]
```

Then continue to Step 2.


## Step 2: Detect Project Type and Technology

**Use file analysis tools to understand the project:**

1. Use the Read tool to check for package.json (indicates web-app), requirements.txt (api-service), go.mod (cli-tool)
2. Identify the technology stack: React, Next.js, FastAPI, Express, Django, etc.
3. Use the Glob tool to determine project patterns and architecture
4. Analyze the codebase structure to understand complexity and scale

**Prepare project context summary:**

1. Document the project type and detected technologies
2. Note current architecture patterns and frameworks
3. Identify recommended workflow adaptations for this project type

## Step 2: Analyze Active Work

**Query the storage backend to gather comprehensive work status:**

1. Query the storage backend for [Epic] and [Spec]
2. Check item status for each (open, in-progress, closed)
3. Identify linked [Story] and [Task] items derived from each [Spec].
4. Calculate completion percentages based on closed vs total task items

**Analyze [Prd], [Epic] and [Spec]:**

1. Retrieve all [Prd] items with `active` label from the storage backend to see high-level goals.
2. Retrieve all [Epic] items with `active` label to see major work areas.
3. Retrieve all [Spec] items with `active` label to see detailed features and requirements.
4. For each [Epic] and [Spec], retrieve linked [Story] and [Task] items to understand breakdown of work.
5. Determine current status and progress for each major work item.

**Calculate task progress:**

1. Count total task items vs completed (closed) task items for each parent item in the storage backend
2. Identify tasks currently labeled as "in-progress"
3. Highlight blocked or overdue tasks based on labels and comments
4. Note any tasks with missing dependencies or prerequisites

**Example analysis format:**

- Issue #4: User Authentication [Epic] (60% complete, 3/5 tasks done)
- Issue #7: Dark Mode [Spec] (planning phase, 0/3 tasks)

## Step 3: Generate Intelligent Suggestions

**Create context-aware next action recommendations:**

1. Base suggestions on current work state and project type
2. Prioritize by dependencies and strategic importance
3. Consider realistic capacity and skill requirements
4. Account for any blocking factors or prerequisites

**Generate smart, actionable suggestions:**

1. If [Prd] is incomplete: suggest `/project:plan:prd [idea]`
2. If [Prd] needs [Epic]: suggest `/project:plan:feature [capability]`
3. If [Epic] needs [Story] scenarios described: suggest `/project:plan:stories #4`
4. If [Story] needs task breakdown or tasks: suggest `/project:plan:tasks #7`
5. If tasks are ready for implementation: suggest `/project:do:task #12`
6. If no active work exists: suggest `/project:plan:prd [idea]` or `/project:plan:feature [capability]`
7. If work is blocked: suggest specific unblocking actions

## Step 4: Analyze Workflow Status

**Assess recent activity patterns:**

1. Query the storage backend for recent item activity to identify workflow patterns
2. Identify any workflow bottlenecks or stalled work
3. Note process improvements that could be made

**Evaluate progress momentum:**

1. Count tasks completed recently to gauge velocity
2. Identify current trends in work completion
3. Project completion timelines based on current pace

## Step 5: Present Available Actions

**Include planning command options:**

- `/project:plan:prd "idea"` - Create comprehensive [Epic] requirements
- `/project:plan:feature "capability"` - Create focused [Spec] features
- `/project:plan:stories "#4"` - Define user stories for [Epic]
- `/project:plan:tasks "#14"` - Break down story into tasks

**Include implementation command options:**

- `/project:do:task "#12"` - Execute specific tasks
- `/project:do:commit "message"` - Create semantic commits

**Include context command options:**

- `/project:current` - Refresh current context view

## Step 6: Provide Reference Guide

**Explain storage backend item reference patterns:**

- **[Epic]**: "#4", "#8", "user authentication", "item #4"
- **[Spec]**: "#7", "#11", "dark mode", "item #7"
- **[Story]**: "#9", "#10", "login flow", "item #9"
- **[Task]**: "#12", "#15", "#18" (individual task item identifiers)

**Show common workflow patterns:**

- View [Epic]: refer by issue number or title
- Break down: `/project:plan:tasks #4`
- Implement: `/project:do:task #12`
- Check status: `/project:current`

## Step 7: Perform Project Health Check

**Assess quality indicators:**

1. Evaluate task breakdown completeness across all [Epic], [Spec] and [Story]
2. Check implementation progress consistency
3. Review testing and documentation coverage
4. Identify technical debt and risk factors

5. Suggest specific process improvements based on identified bottlenecks
6. Recommend quality assurance improvements needed
7. Identify workflow optimization opportunities

## Step 8: Format and Present Output

**Present the analysis in this structured format:**

```
🆔 Project Id: [ProjectId]
📋 Project Context: [Project Type] ([Technology Stack])

📂 Active Work:
├── Issue #4: User Authentication [Epic] (60% complete, 3/5 tasks)
│   ├── ✅ Issue #12: Research OAuth providers (closed)
│   ├── ✅ Issue #13: Backend API design (closed)
│   ├── 🔄 Issue #14: Frontend integration (in-progress)
│   ├── ⏳ Issue #15: Testing suite (open)
│   └── ⏳ Issue #16: Documentation (open)
├── Issue #7: Dark Mode [Spec] (planning, 0/3 tasks)
│   └── 📋 Ready for task breakdown

🎯 Suggested Next Actions:
├── Continue: /project:do:task #14
├── Plan: /project:plan:tasks #7
└── Create: /project:plan:feature "payment processing"

📈 Progress Summary:
├── Total Issues: 8 (3 closed, 1 in-progress, 4 open)
├── Completion Rate: 37.5%
└── Estimated Remaining: ~2-3 days

📍 Quick Reference:
├── [Epic]: #4 (user auth), #8 (...)
├── [Spec]: #7 (dark mode), #11 (...)
├── [Story]: #9 (login flow), #10 (password reset)
└── Commands: /project:plan:prd, /project:plan:tasks, /project:do:task
```

This systematic analysis provides comprehensive situational awareness using the storage backend as the source of truth for all project tracking and intelligent workflow navigation.
</message_to_subagent>
