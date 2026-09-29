# Use a fresh agent session for each worktree phase

Accepted. Run implementation, review, and fix phases in separate agent sessions. Review and fix sessions MUST use a new pane or tab in the existing worktree workspace and MUST NOT resume or instruct an earlier session.

## Considered Options

- Resume the previous agent session.
- Send instructions to the existing implementation pane.
- Create a separate worktree for every phase.

We chose fresh sessions in the same worktree because this limits context contamination without duplicating source state.
