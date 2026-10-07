# List tickets

1. Apply the user's filters and scope through the configured store.
2. Return each ticket's identifier, title, state, direct blockers, and canonical `ref` when available.
3. State limits or incomplete coverage.
4. For a dependency graph request, use the graph procedure in the selected store reference. Print an ASCII dot-list tree with one ticket per line and its direct blockers indented below it. Use this form:

```text
- [task] 42 - Example ticket
  - [task] 41 - Prerequisite
```

Show direct blocker edges only. Do not imply that a partial result is exhaustive.