# Playbook: review

Review a worktree in a fresh agent session.

The reviewer MUST use a new pane or tab. It MUST NOT reuse the implementation or fixer session.

## Preconditions

- Read `references/receipts.md`.
- Resolve the canonical ticket and tracker path with the ticket skill. Cross-check the workflow record.
- Use Worktrunk, the `code-review` skill, and the `muxerContract` and `agentContract` resolved by the `muxer-subagents` skill.
- Run the shared-context CLI from the repository. Use its reported root and storage mode.
- Follow `ALIGNMENT-ROOT.md`. Resolve the workflow root with
  `shared-context path workflow --id <ticket-id>`.
- Store one review artifact at
  `artifacts/reviews/review-<review-receipt-id>.md`. Never copy its body into the
  tracker, chat, or another directory.

## Preconditions that block the review

Reject the request when any of these conditions is true:

- The ticket, source branch, or worktree is unknown.
- No implementation receipt exists.
- An agent session for the worktree is still active.
- The source branch changed after the review handoff was created and no new handoff was made.

## Process

1. Resolve the ticket and workflow root.
2. Read the latest implementation or fix receipt, the latest draft under
   `artifacts/snapshots/`, the ticket, context, ADRs, and agent instructions.
3. Resolve the source branch, base branch, worktree path, and current source commit.
4. Freeze the review target to the current source commit and tree. Record both in the review handoff.
5. Create a new review phase-start receipt with a new attempt ID. Never overwrite an earlier receipt.
6. Write a temporary review handoff containing:
   - ticket and tracker path;
   - source and base branches;
   - absolute worktree path;
   - frozen source commit and tree;
   - implementation or fix receipt path;
   - draft PR snapshot path;
   - context root and storage mode;
   - relevant ADRs and validation commands;
   - exact review artifact path;
   - review receipt path.
7. Open a fresh agent session in the existing worktree workspace. Follow the `muxer-subagents` skill's fresh-session mechanic and the resolved `muxerContract`. Do not send input to the previous session.
8. Launch the agent with the agent contract and the review handoff.
9. Wait for the fresh reviewer session to finish. Read its output through the muxer contract.
10. Verify that the reviewer created one immutable phase-result receipt and one
    review artifact. The artifact MUST identify the frozen source commit.
11. Make sure that the reviewer did not change the source tree. If the tree changed, create a failed phase-complete receipt and stop.
12. Run the smallest validation command that proves the reviewed work passes. Record the command and result in the review receipt.
13. Use `SUCCESS` when no blocking findings remain. Use `FAILURE` when any blocking finding remains.
14. Ask the ticket skill to append the verdict, reviewed commit, timestamp, and
    review artifact link to the ticket. Do not copy the review body.
15. Close the review pane or session. Do not close the worktree workspace.
16. Create a phase-complete receipt that links to the phase-result receipt.
    Regenerate the manifest and projections without dropping earlier reviews.

## Review requirements

Review the ticket requirements, repository standards, recorded validation, actual diff against the base branch, and every relevant ADR.

The reviewer MUST NOT modify source files, tests, configuration, generated files, or workflow state outside the review receipt and review artifact.

For every blocking finding, record:

```md
{ADR id} {ADR name} : {violation description}

  - [filename:lineno] {specific finding}
```

Use `NO ADR` when no ADR applies. State why the finding blocks completion.

## Output

```md
## Verdict
SUCCESS or FAILURE

## Scope
{ticket, branch, base branch, and frozen source commit}

## Findings
- {blocking finding, or "None"}

## Validation
- {command}: {result}

## Review artifact
{new immutable path}

## Review receipt
{new immutable receipt path}

## Next step
{Run fix <ticket-id> after FAILURE, or finish/submit after SUCCESS.}
```
