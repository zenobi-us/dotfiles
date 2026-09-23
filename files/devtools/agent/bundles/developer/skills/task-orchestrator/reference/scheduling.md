# Scheduling

Run the graph in waves.

1. Read `state.json`.
2. Find tasks with all dependencies marked `complete`.
3. Exclude tasks marked `implementing`, `reviewing`, `complete`, `blocked`, or `failed`.
4. Delegate remaining ready tasks.
5. Run independent tasks in parallel.
6. Use serial execution when tasks share writes or when one consumes the files, types, artifacts, or decisions of another.
7. Wait for implementation and review results.
8. Record each result before scheduling the next wave.
9. Mark downstream tasks `blocked` when a dependency fails.
10. Continue until every task is `complete`, `failed`, or `blocked`.

Do not delegate a task twice. Do not start a dependent task while a dependency is implementing or reviewing.
