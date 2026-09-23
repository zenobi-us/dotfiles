# Graph model

Treat the task set as a directed acyclic graph. An edge `A -> B` means task `B` is blocked by task `A`.

Create one record per task:

```text
id: stable task identifier
title: short task title
type: code | document | research | operations
depends_on: list of task identifiers
scope: files, issue, or system area
acceptance: observable completion conditions
review: required | skipped with reason
```

Validate the graph before scheduling or delegation:

1. Make task identifiers unique.
2. Remove duplicate dependency edges.
3. Reject unknown dependencies.
4. Reject self-dependencies.
5. Detect cycles.
6. Give every task an acceptance condition.
7. Give every task an initial state.
8. Confirm that `graph.md` and `state.json` contain the same task IDs and dependencies.
9. Mark tasks with no incomplete dependencies as ready.
10. Recalculate readiness after each result.

The graph model is a hard gate. Do not schedule or delegate work until it passes validation.

Use `state.json` as the source of current task state. Use `graph.md` as the source of task and dependency structure. A task is ready only when every dependency is `complete`.
