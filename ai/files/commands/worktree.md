Create a git worktree for the current repo according to user request.

# User Request

```xml
<UserRequest>
$ARGUMENTS
</UserRequest>
```

Load the `using_git_worktrees` skill if not already loaded, and follow instructions.

Once the worktree is created, load the `zellij` skill and then: 

1. new zellij tab

  name: worktree ticket number or feature name
  layout: compact-bar
  directory: the created worktree path

2. In the new tab, ensure there are only two panes left and right split:

  - Pane 1 [left]: 
    cmd: `nvim`
    cwd: the created worktree path
    **IMPORTANT:** Must explicitly change directory before launching nvim
  - Pane 2 [right]:
    cmd: `mise x node -- pi`
    cwd: the created worktree path
    
  Implementation approach:
  - Use `zellij action new-pane --direction right --cwd <worktree-path> -- <command>`
  - For nvim pane: `zellij action new-pane --cwd <worktree-path> -- sh -c 'cd <worktree-path> && nvim'`
  - For pi pane: `zellij action new-pane --direction right --cwd <worktree-path> -- mise x node -- pi`

3. Read the projects setup instructions from README.md, AGENTS.md.
4. In pane 1, once nvim has launched, open the toggleterm in float mode and run the setup commands there.
