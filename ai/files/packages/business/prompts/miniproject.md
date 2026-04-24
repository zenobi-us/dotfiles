# Markdown Driven Task Management

This is a simplified and concise project management AI memory framework.

## Input

```md
<U>
$U
</U>
```

## Execution Steps

1. Delegate the following steps to the `general` subagent.
2. Load the `miniproject` skill and follow the instructions it describes to process the user request.
3. Commit changes using any git commit skill you have and follow the [git commit instructions](#git-commit-instructions) below.
4. After completing the task, provide a report that follows the [report format](#report-format) below.

### Git Commit Instructions

When committing changes we must always commit them in two separate groups: 

- `.memory/` changes.
- All other changes related to the task.

#### Memory Changes

Sometimes the `.memory/` directory will be symlinked into the current worktree. It might be from the main worktree or another repo entirely.

This means it is imperative that we first change directory to the `.memory/` directory before staging and committing any changes to it. 

This ensures that we are committing the correct files and not accidentally including unrelated changes from the main worktree or another repo.

It also means that if `.memory/` is just a normal folder in the current worktree, we can still commit it without any issues.


#### Task Changes

After committing the `.memory/` changes, we can then stage and commit all other changes related to the task in the main worktree as usual.

### Report Format

  - **Synopsis of Changes**: A brief summary of the essence of the change, what was changed, why, and how it addresses the user request.
  - **Challenges Faced**: Any difficulties encountered during the implementation and how they were overcome.
  - **Files Changed**: A list of files that were modified, created, or deleted, along with a brief description of the changes made to each file.
  - **Next Steps**: Recommendations for any further actions that should be taken, such as additional testing, documentation updates, or future improvements.
  - [CRITICAL] Avoid creating summarisation files, instead provide the summary directly in your response. 
