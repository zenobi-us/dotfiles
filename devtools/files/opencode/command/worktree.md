Based on user request either create or open branches in worktrees with the following rules in mind:

1. List current branches in open worktrees
  - if any match the user request list them in a numbered list and ask if the user wants to switch/open it (use below SelectBranchTemplate)
2. If no branches match, or the user doesn't want to
  - Create a new branch in a new worktree.
  - Spawn a new zellij tab with that worktree in neovim.

```md
<UserRequest>
$ARGUMENTS
</UserRequest>
```

## Creating new branches

- follow conventional commits style for branch names
- prefix with type/ (e.g. feature/, fix/, chore/, docs/, etc.)
- use hyphens to separate words
- limit branch name to 50 characters
- if a JIRA ticket is associated, include the ticket number at the start (e.g. feat/PROJ-1234-feature-description)


## SelectBranchTemplate 

```md

1. [worktree-name] branch name (active|dirty)
2. [worktree-name] branch name (active|dirty)

Select a branch [1-2] or [N]one.
```

