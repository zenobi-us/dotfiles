# Review and cleanup

Every coding implementation requires a separate review.

## Review

When an implementation returns:

1. Record its commit, changed files, validation, and blockers.
2. Write the review handoff.
3. Delegate the review to a separate agent.
4. Instruct the reviewer to use `matt-pocock:code-review`.
5. Use `vanilla-green:reviewer` when the project needs a structured review artifact.
6. Mark the task `reviewing` in `state.json`.
7. Wait for the review result.

The reviewer must not modify implementation files. It may write a review artifact.

## Review blockers

If the review finds blockers:

1. Record every finding.
2. Create a fix handoff.
3. Delegate the fix to the original implementation agent when available.
4. Instruct the agent to use the relevant implementation skill and TDD skill.
5. Delegate a new review to a separate review agent.
6. Repeat until the review passes or the user stops the cycle.

Do not release dependent tasks while the review remains open.

## Review pass

When the review passes:

1. Confirm that all blocker findings are resolved.
2. Record the review verdict and artifact.
3. Record the final implementation commit and validation.
4. Capture non-blocking suggestions as open items or follow-up tasks.
5. Confirm the implementation worktree and result files are recorded.
6. Mark the task `complete` in `state.json`.
7. Recalculate dependency readiness.

The orchestrator does not claim completion from a review comment alone. It records the evidence needed by the completion report.
