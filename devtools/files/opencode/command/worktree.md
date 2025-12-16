Create a git worktree for the current repo.

1. List current branches in open worktrees
  - If any match the user request list them in a numbered list and ask if the user wants to switch/open it (use below [Template: Select Branch](#template-select-branch))
2. If no branches match, or the user doesn't want to switch/open existing worktree:
  - Create a new branch (See [Branch Name Guidelines](#branch-name-guidelines)) 
  - in a new worktree
  - in a folder alongside the main repo folder (see [Worktree Folder Structure](#worktree-folder-structure))

```md
<UserRequest>
$ARGUMENTS
</UserRequest>
```

## Branch Name Guidelines

- Follow conventional commits style for branch names
- prefix with type/ (e.g. feature/, fix/, chore/, docs/, etc.)
- use hyphens to separate words
- limit branch name to 50 characters
- If a JIRA ticket is associated, include the ticket number at the start (e.g. `feat/PROJ-1234-feature-description`)

## Worktree Folder Structure

- Create a new folder alongside the main repo folder
  - example: if main repo is at `/path/to/repo`, create worktree at `/path/to/repo.worktrees/branch-name`
- Name the folder after the branch name, replacing slashes with hyphens
- Ensure the folder name is unique to avoid conflicts with existing worktrees


## Template: Select Branch

```md

1. [worktree-name] branch name (active|dirty)
2. [worktree-name] branch name (active|dirty)

Select a branch [1-2] or [N]one.
```

