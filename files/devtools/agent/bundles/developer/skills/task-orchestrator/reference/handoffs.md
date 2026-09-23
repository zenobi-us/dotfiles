# Handoffs

Create a run directory outside the source tree when possible:

```text
/tmp/task-orchestrator/<run-id>/
  graph.md
  state.json
  handoffs/<task-id>.md
  reviews/<task-id>.md
  results/<task-id>.md
```

Use the harness file-write tool to create handoff files.

Each implementation handoff must contain:

```text
# Implementation handoff: <task-id>

Task: <title>
Type: <type>
Dependencies completed: <ids>
Scope: <scope>
Acceptance: <conditions>
Worktree: <path or "create one">

Required skills:
- <skill route>

Instructions:
- Work only on this task.
- Read the relevant project instructions and shared context.
- Follow the required skills.
- Report changed files, validation, commit, and blockers.
```

Each review handoff must contain:

```text
# Review handoff: <task-id>

Task: <title>
Implementation worktree: <path>
Implementation commit: <commit>
Diff base: <base>
Acceptance: <conditions>
Implementation result: <result file>

Required skill:
- matt-pocock:code-review

Instructions:
- Review the implementation, not the task plan.
- Inspect committed and uncommitted changes when applicable.
- Report blockers, suggestions, validation, and verdict.
- Do not modify implementation files.
```
