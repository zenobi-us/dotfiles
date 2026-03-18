Fix User Request in a Worktree and Branch. Use Zellij to run Subagent in order to allow for observability and interaction during the process.

According to user request: 

```xml
<UserRequest>
  <Ticket>$1</Ticket>
  <Description>
  ${@:2}
  </Description>
</UserRequest>
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

- Here in this session: creating a new worktree and branch for the ticket, then delegating the task to a pi subagent in a new zellij session within that worktree. The pi subagent will be responsible for the rest of the workflow:
- Within the Worktree Subagent: tracing the bug, proposing a fix, implementing, and creating PR.

### Here in this session:

1. **Fetch ticket**
  - Download ticket details using the jira skill. Extract key information such as summary, description, labels, and any linked artifacts.
  - Generate a concise summary of the issue and identify the affected components/modules.

2. **Create worktree**
  - Follow the using-git-worktrees skill to create a new worktree for the ticket. Use a consistent naming convention for the branch and worktree directory based on the ticket number and summary. For example: 
   ```
   Root:   ~/Projects/TheProject
   Worktree: ~/Projects/TheProject.worktrees/{ticket-lower}
   Branch: fix/{TICKET}-{kebab-summary}
   ```

### Within the Worktree Subagent:

Create a new zellij session with a new tab which runs the pi subagent command to handle the rest of the workflow. The pi subagent will be responsible for tracing the bug, proposing a fix, implementing, and creating the PR.
   

1. **Trace the bug**
   - Use codemapper + LSP to follow the code path. Build ASCII state machine diagram showing the flow.
   - Identify the root cause of the bug. Document findings as research notes.

2. **Propose fix** — Present:
  If the fix is simple, show the code diff.
  If it’s complex, then prepare a mini design doc with:
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
 - Follow the proposed plan to implement the fix. If new issues arise, update the plan and get approval for changes.
 - Atomic commits per logical change. Follow conventional commits.

4. **Create PR** 
 - If PR already exists for the branch, update it with new commits and comment with progress. If not, create a new PR with the generated title and description linking to the ticket.
 - If the repo requires other PR preparation steps (e.g. filling out a PR template, adding reviewers, creating changesets, etc.) then follow those steps.
 - Push branch, open PR linking the ticket. Wait for CI checks to run on the PR.


## Exit Criteria

- All commits follow conventional format
- PR links to ticket
- CI passes (or failures explained)
