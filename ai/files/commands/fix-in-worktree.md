Fix User Request in a Worktree and Branch.

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
- jira
- using-git-worktrees
- codemapper
- systematic-debugging
- pr-resolver (if PR exists)

## Workflow

1. **Fetch ticket** — Download bug details with `atlassian jira issue view {TICKET}`

2. **Create worktree**
   ```
   Root:   ~/Projects/TheProject
   Worktree: ~/Projects/TheProject.worktrees/{ticket-lower}
   Branch: fix/{TICKET}-{kebab-summary}
   ```

3. **Trace the bug** — Use codemapper + LSP to follow the code path. Build ASCII state machine diagram showing the flow.

4. **Propose fix** — Present:
   - State machine diagram
   - Table of files to change
   - Brief explanation of root cause
   
   **⏸ CHECKPOINT: Wait for user approval before proceeding.**

5. **Implement** — Atomic commits per logical change. Follow conventional commits.

6. **Create PR** — Push branch, open PR linking the ticket. Run CI checks.

## Exit Criteria
- All commits follow conventional format
- PR links to ticket
- CI passes (or failures explained)
