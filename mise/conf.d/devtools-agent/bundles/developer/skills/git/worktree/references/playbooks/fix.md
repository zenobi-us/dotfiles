# Playbook: fix

Fix blocking review findings in an existing Worktrunk worktree with a fresh agent session.

The fixer MUST use a new pane or tab. It MUST NOT reuse the implementation or reviewer session.

## Inspect and recover first

Resolve the canonical ticket and absolute installed `WORKTREE_SKILL_ROOT`. From the repository or surviving base worktree run:

```sh
"$WORKTREE_SKILL_ROOT/scripts/inspect.ts" <canonical-ticket-ref> --json
```

Follow the shared decision and execution gates in `references/receipts.md` before the normal process below. This command recovers its own interrupted attempt. Inspection is read-only; the playbook performs any authorized reconciliation or retry. If a different action is recommended, dispatch that playbook rather than bypassing its gates. Observe active owners, check reservations and ownership, obtain required scoped takeover approval, and never auto-kill a session. Append recovery provenance; preserve prior receipts and partial source.

## Preconditions

- Read `references/receipts.md`.
- Resolve the canonical ticket `ref` and backend with the ticket skill.
- Use Worktrunk, the applicable engineering skill, and the `muxerContract` and
  `agentContract` resolved by the `muxer-subagents` skill.
- Run the shared-context CLI from the source repository. Record its route table
  and alignment root.
- Follow `ALIGNMENT-ROOT.md`. Resolve the workflow root with
  `shared-context resolve workflow --id <ticket-id>`.
- For a new fix, require current persisted `verdict: FAILURE` findings. If source changed since that verdict, use fresh review instead. For authorized partial-fix takeover, require traceable consumed findings and partial source from the interrupted attempt; do not reject merely because that partial work changed the source.
- Verify that the source worktree and branch still exist.
- Confirm that the current source branch matches the `source_branch` recorded in the consumed review receipt. Reject the fix on mismatch.

## Process

1. Reconcile an existing valid fix result missing parent completion without rerunning. For authorized takeover with missing/unusable result, preserve partial source (including dirty changes), pass its provenance and remaining findings to a fresh fixer in the existing worktree, and append a new attempt. If findings/source cannot be traced, follow the shared decision back to review rather than apply stale findings. Read the latest immutable review artifact under `artifacts/reviews/` and its
   receipt. Read the implementation receipt, latest draft under
   `artifacts/snapshots/`, ticket, context, ADRs, and agent instructions.
2. Confirm that the current source branch matches the branch recorded in the consumed review receipt. Stop on mismatch.
3. Select only the blocking findings for the fixer. Preserve their IDs, ADR references, exact files, line references, and validation commands.
4. Record the current source commit and create a new fix phase-start receipt with the review receipt as its parent.
5. Write a temporary fix handoff containing the source worktree, source and
   base branches, current source commit, workflow store and reference, selected
   engineering skill, review receipt, blocking findings, and expected validation.
6. Open a fresh agent session in the existing worktree workspace. Follow the `muxer-subagents` skill's fresh-session mechanic and the resolved `muxerContract`. Do not send text to the prior session.
7. Launch the fresh fixer session with the agent contract and the fix handoff.
8. Wait for completion through the muxer contract. Require `WORKTREE_FIX_DONE` only after the fixer has applied the changes and passed validation.
9. If the fixer is blocked, fails validation, or has no usable durable result, append an accurate failed/blocked fix phase-complete receipt and preserve the worktree and partial source. The marker is transport, not proof. Do not start review until a valid clean implementation/fix target is established.
10. If the fixer succeeds, verify the immutable fix phase-result receipt, the
    new source commit, the new draft snapshot under `artifacts/snapshots/`, and
    the regenerated manifest and projections.
11. Close the fixer pane. Keep the worktree workspace available.
12. Create a phase-complete receipt that links to the fix phase-result receipt.
13. Regenerate the manifest and workflow projections. Inspect the recorded outcome afresh and report its next action and reason. A valid clean fix result requires fresh review because source changed; a failed, blocked, or missing result requires the inspected recovery/observation action instead.

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

Report the source branch, worktree path, fixer agent, workspace path, pane or session identifier, fix receipt, draft snapshot, projection paths, handoff path, validation result, completion marker, pane close result, and the next action and reason from fresh shared inspection. Report `review <ticket-id>` only for a valid clean fix result, not for failed, blocked, or missing results.
