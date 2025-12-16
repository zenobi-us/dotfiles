Create a git worktree for the current repo according to user request.

# User Request

$ARGUMENTS

## Process 

### Step 1 List Current Branches in Open Worktrees

If any worktrees match the user request list them in a numbered list and ask if the user wants to switch/open it (use below [Template: Select Branch](#template-select-branch)).

### Step 2 Create the Branch and/or Worktree 

Pick one of the scenarios that match while following the guidelines: 

- [Guideline: Branch Name Conventions](#guideline-branch-name-conventions)
- [Guideline: Worktree Folder Location and Naming](#guideline-worktree-folder-location-and-naming)
- [Guideline: Preparing the worktree](#guideline-preparing-the-worktree)

#### Scenario: No Matching Branches

If no branches match, create a new branch in a new worktree.

#### Scenario: User Selects "None"

If the user selects "None", create a new branch in a new worktree.

#### Scenario: User Selects Existing Branch

If the branch is already in a worktree, switch to that worktree.

#### Scenario: Branch Exists but Not in Worktree

If the branch exists but is not in a worktree, create a new worktree for that branch.

### Step 3 Final Output

Output the path to the created or selected worktree.


## Guidelines

### Guideline: Branch Name Conventions

- Follow conventional commits style for branch names
- prefix with type/ (e.g. feature/, fix/, chore/, docs/, etc.)
- use hyphens to separate words
- limit branch name to 50 characters
- If a JIRA ticket is associated, include the ticket number at the start (e.g. `feat/PROJ-1234-feature-description`)

### Guideline: Worktree Folder Location and Naming

- Create a new folder alongside the main repo folder
  - example: if main repo is at `/path/to/repo`, create worktree at `/path/to/repo.worktrees/branch-name`
- Name the folder after the branch name, replacing slashes with hyphens
- Ensure the folder name is unique to avoid conflicts with existing worktrees

### Guideline: Preparing the Worktree

- After creating the worktree, navigate into the worktree folder
- Ensure the new branch is checked out
- Read the `README.md` or the `AGENTS.md` file and perform any initial setup steps outlined there

## Templates

### Template: Select Branch

```md

1. [worktree-name] branch name (active|dirty)
2. [worktree-name] branch name (active|dirty)

Select a branch [1-2] or [N]one.
```

