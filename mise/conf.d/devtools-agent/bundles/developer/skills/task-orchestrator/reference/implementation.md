# Implementation delegation

For each ready task:

1. Write its implementation handoff.
2. For a coding task with an issue identifier, instruct the agent to use `developer:worktree start <issue>`.
3. For a coding task without an issue identifier, instruct the agent to use `developer:worktrunk` and create an isolated worktree.
4. Instruct the agent to use `developer:hrdx-subagents` for its pane or workspace.
5. Instruct the agent to use `matt-pocock:implement`.
6. Instruct the agent to use `matt-pocock:tdd` when the task has a testable seam.
7. Delegate the handoff to the implementation agent.
8. Mark the task `implementing` in `state.json`.
9. Do not start a dependent task.

Instruct agents to use existing skills. Use the narrowest skill route that fits the task. Record the changed files, validation, commit, and blockers when the agent returns.
