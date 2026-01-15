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

2. In the new tab, start two panes:

  - Pane 1: `nvim` for code editing 
  - Pane 2: `mise x node -- pi` for agentic assistant

Ensure the worktree is set up correctly and ready for development.
