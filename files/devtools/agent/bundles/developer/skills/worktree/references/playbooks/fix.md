# Playbook: fix

Fix blocking review findings in an existing Worktrunk worktree with a fresh agent session.

The fixer MUST use a new pane or tab. It MUST NOT reuse the implementation or reviewer session.

## Preconditions

- Read `references/receipts.md`.
- Resolve the canonical ticket and tracker path with the ticket skill. Cross-check the workflow record.
- Use Worktrunk, the applicable engineering skill, and the active muxer and agent contracts.
- Run the shared-context CLI from the source repository. Use its reported root and storage mode.
- Follow `ALIGNMENT-ROOT.md`. Resolve the workflow root with
  `shared-context path workflow --id <ticket-id>`.
- Require the latest persisted review receipt to have `verdict: FAILURE`.
- Verify that the source worktree and branch still exist.
- Confirm that the current source branch matches the `source_branch` recorded in the consumed review receipt. Reject the fix on mismatch.

## Process

1. Read the latest immutable review artifact under `artifacts/reviews/` and its
   receipt. Read the implementation receipt, latest draft under
   `artifacts/snapshots/`, ticket, context, ADRs, and agent instructions.
2. Confirm that the current source branch matches the branch recorded in the consumed review receipt. Stop on mismatch.
3. Select only the blocking findings for the fixer. Preserve their IDs, ADR references, exact files, line references, and validation commands.
4. Record the current source commit and create a new fix phase-start receipt with the review receipt as its parent.
5. Write a temporary fix handoff containing the source worktree, source and base branches, current source commit, context root and storage mode, selected engineering skill, review receipt, blocking findings, and expected validation.
6. Open a new pane or tab in the existing worktree workspace. For hrdx, use `pane.create` with the absolute workspace path, `split: "tab"`, and the configured agent kind. Do not send text to the prior session.
7. Launch the fresh fixer session with the agent contract and the fix handoff.
8. Wait for completion through the muxer contract. Require `WORKTREE_FIX_DONE` only after the fixer has applied the changes and passed validation.
9. If the fixer is blocked, fails validation, or omits the marker, append a failed fix phase-complete receipt and keep the worktree. Do not start a review.
10. If the fixer succeeds, verify the immutable fix phase-result receipt, the
    new source commit, the new draft snapshot under `artifacts/snapshots/`, and
    the regenerated manifest and projections.
11. Close the fixer pane. Keep the worktree workspace available.
12. Create a phase-complete receipt that links to the fix phase-result receipt.
13. Regenerate the manifest and workflow projections. Report
    `review <ticket-id>` as the next command. A new review is required because
    the source commit changed.

## Fix receipt requirements

The fix receipt MUST record:

- consumed review receipt IDs;
- resolved and unresolved finding IDs;
- changed files;
- validation results;
- the new source commit and tree;
- the draft snapshot and projection paths;
- agent and pane or session identifier;
- completion marker result.

## Output

Report the source branch, worktree path, fixer agent, workspace path, pane or session identifier, fix receipt, draft snapshot, projection paths, handoff path, validation result, completion marker, pane close result, and the next command: `review <ticket-id>`.
