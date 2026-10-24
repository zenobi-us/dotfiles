# Playbook: finish

Squash merge reviewed work and close its ticket, or recover an interrupted finish without repeating verified operations.

Finish does not launch an agent for source work. It releases every remaining agent pane before merge and removes the worktree only after the push and ticket update succeed.

## Preconditions

- Read `references/receipts.md`.
- Resolve the canonical ticket `ref` and backend with the ticket skill.
- Use Worktrunk and the applicable `code-review` and `implement` skills.
- Run the shared-context CLI from the target repository or its surviving base worktree. Record its route table and alignment root. Recovery does not require a source worktree that was already validly removed.
- Follow `ALIGNMENT-ROOT.md`. Resolve the workflow root with
  `shared-context resolve workflow --id <ticket-id>`.
- For a new merge, require an immutable `SUCCESS` review receipt for the current clean source commit and tree.
- For post-merge recovery, require the reviewed-source-to-integration mapping defined in `references/receipts.md`; verify it against actual Git and remote state.
- Read prior finish attempts before any mutation. Missing or conflicting evidence requires human input, not a new merge.
- Do not remove the worktree while an agent is running.

## Reconcile before acting

1. Resolve the ticket, workflow root, source identity, base, and remote. Read the immutable review, implementation/fix, and all finish receipts. Use projections only to locate authoritative records.
2. Read actual local Git, remote ref, tracker, worktree, and muxer state. A failed receipt does not prove that its named operation had no effect. Reconcile the last verified boundary using the integration evidence contract in `references/receipts.md`.
3. If a valid `FINISHED` receipt and current evidence cover the ticket, return that result without a new merge, push, or ticket completion.
4. If an agent remains active, resolve and release it through `muxer-subagents` before integration or cleanup. An unknown session state is a blocker.
5. Select the first unverified operation below. Recheck its preconditions immediately before acting. Append a new `FINISHING` attempt linked to the prior receipt and consumed review. Never overwrite an earlier attempt.

## Execute only the remaining operations

1. **Prepare a new merge only when integration has not occurred.** Verify the `SUCCESS` review against the exact current clean source commit/tree and run its recorded validation. Focus the base worktree, resolve its remote, and update the base without discarding unrelated changes or rewriting published history. Verify squash configuration. Compute the expected clean integration tree and append the `prepared` checkpoint with the review, base, source, remote, and proposed merge message.
2. **Merge once.** Recheck that the recorded base/source identities still match, including after receipt publication. If they changed, stop for reconciliation or fresh review. Use Worktrunk squash merge with `--no-rebase --no-remove` to preserve the reviewed source and recovery resources. If Worktrunk cannot preserve the approved inputs, stop instead of weakening the review gate. Follow the `commit` skill for the merge commit, including the ticket ref, review artifact, and relevant ADRs.
3. **Verify integration.** Require the resulting commit's parent and tree to match the prepared evidence. Append a `merged` checkpoint. Run the recorded integrated checks in the surviving base worktree and record their results. If validation fails after merge, preserve the integration and report failure; do not merge again or automatically revert it.
4. **Publish when needed.** Re-read the named remote ref. If the integration commit is already reachable there, record that observation and skip push. Otherwise require a safe non-force push of the verified base. Stop on divergence or uncertain reachability. Verify the remote after push and append `pushed`. A remote failure preserves resources and does not close the ticket.
5. **Complete the ticket when needed.** Verify review, integrated validation, and remote publication evidence. Use the ticket skill to inspect current state and perform only the missing completion/publication operations. If the ticket is already completed, verify its evidence instead of completing it again. Append `ticket_completed` only after the backend's publication rule succeeds.
6. **Clean up when needed.** Recheck publication and ticket completion. Remove the known source worktree with Worktrunk only if it still exists and no agent is active. If already absent, verify its identity from prior records; never recreate it just to remove it. Append `worktree_removed`. Close only the recorded source workspace when still present; do not close a reused workspace belonging to other work.
7. **Finalize.** Append an immutable `FINISHED` receipt with terminal fields and integration evidence, then regenerate projections. On failure at any boundary, append `FINISH_FAILED` with the last verified boundary, failed operation, actual observed state, and resources preserved. Use `null` for unknown outcome fields rather than claiming success or failure without observation.

## Recover interrupted boundaries

| Verified state | Next operation |
| --- | --- |
| No integration; reviewed source still available and unchanged | Prepare and perform the new merge |
| Integration exists locally, not on the named remote | Validate the integrated state, then publish |
| Integration is published; ticket is incomplete or unpublished | Recover ticket completion/publication |
| Ticket and publication verified; cleanup incomplete | Remove remaining resources and finalize receipts |
| Resources already removed; terminal receipt missing | Verify durable integration, publication, completion, and cleanup evidence; append the terminal receipt |
| An operation may have succeeded but evidence cannot identify its result | Request targeted human recovery instructions |

A missing source branch/worktree blocks a new merge, not post-merge recovery with valid mapping evidence. Older receipts without that mapping require independently verifiable evidence or human input. Do not infer a squash merge from source ancestry; squash creates a different commit.

## Safety rules

- Do not perform a new merge without a matching `SUCCESS` review receipt.
- If source changed after review, require a fresh review before a new merge.
- Do not repeat an already verified merge, push, completion, or cleanup operation.
- Do not remove the worktree before publication and ticket completion succeed. Preserve it during merge with `--no-remove`.
- Do not close the ticket when merge or push fails.
- Keep the worktree and receipts when agent shutdown, merge, push, ticket update, or cleanup fails.
- Never replace a `FINISHING` receipt with a terminal receipt. Append the terminal receipt.
- Preserve recorded review-to-integration evidence when the source worktree no longer exists.
- Reconcile after a crash before retrying. A ticket label or matching commit message alone is not proof of integration.

## Output


```md
## Finished
- Ticket: {ticket}
- Source branch: {branch}
- Base branch: {base}
- Reviewed source commit: {sha}
- Merge commit: {sha}
- Finish receipt: {path}

## Validation
- {command}: {result}

## Ticket
- {closed or not closed, with reason}

## Worktree
- {removed or kept, with reason}

## Workspace
- {closed or kept, with reason}
```
