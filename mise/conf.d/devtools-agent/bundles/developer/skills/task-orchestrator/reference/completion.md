# Completion report

The workflow is complete only when every task has a terminal state:

- `complete`
- `failed`
- `blocked`

Every completed coding task must have a passing review.

Return:

```text
## Task graph
<graph summary>

## Results
- <task-id>: complete | failed | blocked
  - worktree: <path or none>
  - implementation: <result or commit>
  - review: <result or artifact>

## Validation
- <command>: <result>

## Open items
- <item or none>
```

Include the final task state, worktree, implementation result, review result, validation, and open items. Record failures and blocked tasks instead of hiding them.
