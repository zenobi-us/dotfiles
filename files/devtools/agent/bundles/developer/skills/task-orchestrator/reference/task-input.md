# Task input

Start the orchestrator only after the user supplies:

1. A set of tasks.
2. The dependency relation between those tasks, or permission to infer it.

If the user supplies tasks without dependencies, ask whether independent tasks may run in parallel. Do not treat list order as dependency order.

Do not invent product scope. Ask the user when a task, dependency, or acceptance condition is unclear.

Before delegation, confirm that each task has a stable identifier, a scope, and an observable acceptance condition.
