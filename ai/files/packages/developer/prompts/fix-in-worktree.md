Fix UserRequest in a worktree and branch. Use Zellij to run a subagent for observability and interaction during the process.

## UserRequest

```md
UserRequest: $ARGUMENTS
TicketId: $1
TaskDescription: ${@:2}
```

## Skills

- miniproject
- jira
- using-git-worktrees
- zellij
- codemapper
- systematic-debugging
- pr-resolver (if PR exists)

## Workflow

This workflow happens in two parts:

- Here in this session: create a new worktree and branch for TicketId, then delegate the task to a pi subagent in a new zellij session within that worktree.
- Within the worktree subagent: trace the bug, propose a fix, implement, and create PR.

### Here in this session:

1. **Fetch ticket**
  - Download ticket details using the jira skill. Extract key information such as summary, description, labels, and linked artifacts.
  - Generate a concise summary of the issue and identify affected components/modules.

2. **Create worktree**
  - Follow the using-git-worktrees skill to create a new worktree for TicketId. Use a consistent naming convention for branch and worktree directory based on ticket number and summary. For example:
   ```
   Root:   ~/Projects/TheProject
   Worktree: ~/Projects/TheProject.worktrees/{ticket-lower}
   Branch: fix/{TICKET}-{kebab-summary}
   ```

### Within the Worktree Subagent:

Create a new zellij session with a new tab running the pi subagent command for the remaining workflow.

1. **Trace the bug**
   - Use codemapper + LSP to follow the code path. Build an ASCII state machine diagram showing the flow.
   - Identify root cause and document findings as research notes.

2. **Propose fix** — Present:
  If the fix is simple, show the code diff.
  If it is complex, prepare a mini design doc with:
   - Summary of the issue
   - Proposed solution
   - State machine diagram
   - Table of files to change
   - Brief explanation of root cause
   - A list of tasks to complete the fix

   > If there is a task planning storage system available then follow the process for storing the plan and creating tasks.
   > Then report the files created for planning and the tasks created.

   **⏸ CHECKPOINT: Wait for user approval before proceeding.**

3. **Implement**
 - Follow the proposed plan. If new issues arise, update the plan and get approval for changes.
 - Atomic commits per logical change. Follow conventional commits.

4. **Create PR**
 - If PR already exists for the branch, update it with new commits and comment progress. Otherwise create a new PR with generated title and description linking TicketId.
 - If the repo requires other PR preparation steps (template, reviewers, changesets, etc.), follow them.
 - Push branch, open PR linking TicketId, and wait for CI checks.

## Exit Criteria

- All commits follow conventional format
- PR links to TicketId
- CI passes (or failures explained)
