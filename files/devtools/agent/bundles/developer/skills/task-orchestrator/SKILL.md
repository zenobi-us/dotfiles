---
name: task-orchestrator
description: Use when the user has established tasks and dependencies and needs parallel or serial delegation with separate implementation reviews. Schedules the graph and produces isolated worktrees, handoff files, implementation results, review results, and a final graph status.
user-invocable: true
---

# Task Orchestrator

Use this workflow after the user has established a task set. Do not invent product scope.

This skill coordinates other skills. It does not replace them.

## Required behavior

- Treat the task list as a directed acyclic graph.
- Treat an edge `A -> B` as `B` blocked by `A`.
- Run every ready task whose dependencies are complete.
- Run independent ready tasks in parallel.
- Run blocked tasks after all direct dependencies complete.
- Give every delegated task its own handoff prompt file.
- Give every coding task its own Worktrunk worktree.
- Give every implementation a separate review delegation.
- Use a different subagent for review when the harness supports it.
- Keep implementation and review work separate.
- Record task state outside the conversation.
- Stop downstream work when an upstream task fails.
- Ask the user when the graph contains a cycle, missing task, or unclear dependency.

## Reuse existing skills

Instruct delegated agents to use existing skills. Do not copy their procedures into this skill.

Use these routes:

| Need | Instruct the agent to use |
|---|---|
| Start an issue in an isolated worktree | `developer:worktree start <issue>` |
| Operate a Worktrunk worktree | `developer:worktrunk` |
| Open a pane or workspace | `developer:hrdx-subagents` |
| Implement a coding task | `matt-pocock:implement` |
| Implement test-first | `matt-pocock:tdd` |
| Review a completed change | `matt-pocock:code-review` |
| Save durable shared context | `agent-core:shared-context` |
| Follow tracker-based orchestration | `vanilla-green:orch` |
| Follow the implementation workflow | `vanilla-green:dev` |
| Produce a structured review artifact | `vanilla-green:reviewer` |

Use the narrowest route that fits the task. For example, instruct an issue agent:

```text
Use developer:worktree start ISSUE-123.
Then use matt-pocock:implement.
Use matt-pocock:tdd when the task has a testable code seam.
```

Do not invoke a skill only to restate its documentation. Invoke it when the delegated task needs its behavior.

## Start conditions

Start this workflow only when the user has supplied both:

1. A set of tasks.
2. The dependency relation between those tasks, or permission to infer it.

If the user has supplied tasks but no dependencies, ask whether independent tasks can run in parallel. Do not guess dependencies from task order.

## Normalize the graph

Create one record per task with these fields:

```text
id: stable task identifier
title: short task title
type: code | document | research | operations
depends_on: list of task identifiers
scope: files, issue, or system area
acceptance: observable completion conditions
review: required | skipped with reason
```

Apply these rules:

1. Make task identifiers unique.
2. Remove duplicate dependency edges.
3. Reject an unknown dependency.
4. Reject a dependency from a task to itself.
5. Detect cycles before delegation.
6. Mark tasks with no incomplete dependencies as ready.
7. Recalculate readiness after each task result.

Use a graph such as:

```text
T1 ─┬─> T3 ─> T5
    └─> T4 ─┘
T2 ─────────>
```

`T1` and `T2` can run in parallel. `T3` and `T4` wait for `T1`. `T5` waits for `T3`, `T4`, and `T2`.

## Handoff files

Create a run directory outside the source tree when possible:

```text
/tmp/task-orchestrator/<run-id>/
  graph.md
  state.json
  handoffs/<task-id>.md
  reviews/<task-id>.md
  results/<task-id>.md
```

Use the harness file-write tool to create prompt files. Do not create them with shell redirection.

Each implementation handoff file MUST contain:

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

Each review handoff file MUST contain:

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

## Delegate one wave

For each ready task:

1. Write its implementation handoff file.
2. If it is a coding task, instruct the agent to use `developer:worktree start <issue>` when it has an issue identifier.
3. If it has no issue identifier, instruct the agent to use `developer:worktrunk` and create an isolated worktree.
4. Instruct the agent to use `developer:hrdx-subagents` for its pane or workspace.
5. Instruct the agent to use `matt-pocock:implement`.
6. Instruct the agent to use `matt-pocock:tdd` when the task has a testable seam.
7. Delegate the handoff file to the implementation subagent.
8. Mark the task `implementing` in `state.json`.
9. Do not start a dependent task.

Delegate independent tasks in one parallel wave. Do not delegate a task twice.

## Review after implementation

When an implementation subagent returns:

1. Record its commit, changed files, validation, and blockers.
2. Write the review handoff file.
3. Delegate the review handoff to a separate review subagent.
4. Instruct the reviewer to use `matt-pocock:code-review`.
5. Instruct the reviewer to use `vanilla-green:reviewer` when the project needs a structured review artifact.
6. Mark the task `reviewing` in `state.json`.
7. Wait for the review result before marking the task complete.

A review subagent MUST NOT modify implementation files. A review subagent MAY write its review artifact.

If the review passes, mark the task `complete`.

If the review finds blockers:

1. Record the findings.
2. Write a fix handoff file.
3. Delegate the fix to the original implementation subagent when it is available.
4. Instruct it to use the relevant implementation skill and TDD skill.
5. Delegate a new review to a separate review subagent.
6. Repeat until the review passes or the user stops the cycle.

Do not release dependent tasks while the review remains open.

## Scheduling loop

Repeat this loop:

1. Read `state.json`.
2. Find tasks with all dependencies marked `complete`.
3. Exclude tasks marked `implementing`, `reviewing`, `complete`, `blocked`, or `failed`.
4. Delegate the remaining ready tasks in parallel.
5. Wait for implementation and review results.
6. Record each result before scheduling the next wave.
7. Mark downstream tasks `blocked` when a dependency fails.
8. Continue until every task is `complete`, `failed`, or `blocked`.

Use serial execution when a task consumes files, types, artifacts, or decisions from another task. Use parallel execution only when the tasks have no shared writes and no data dependency.

## Shared context

When a task produces a decision that a later task needs:

1. Instruct the producing agent to use `agent-core:shared-context`.
2. Instruct it to publish the context before returning.
3. Put the published context path in the next task handoff.
4. Do not use chat text as the only handoff.

If a worktree has separate alignment storage, instruct the agent to resolve it with `agent-core:shared-context` before reading or writing alignment files.

## Completion report

Return:

```text
## Task graph
<graph summary>

## Results
- <task-id>: complete | failed | blocked
  - worktree: <path or none>
  - implementation: <result or commit>
  - review: <result or artifact>

## Validation
- <command>: <result>

## Open items
- <item or none>
```

The workflow is complete only when every task has a terminal state and every completed coding task has a passing review.
