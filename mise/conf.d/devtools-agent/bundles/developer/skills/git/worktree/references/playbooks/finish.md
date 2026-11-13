# Playbook: finish

Integrate reviewed work onto the current base, publish it and close its ticket. Recover an interrupted finish without repeating verified operations.

## Inspect and recover first

Read `references/receipts.md` and `references/concurrency.md`. Resolve the canonical ticket, absolute installed `WORKTREE_SKILL_ROOT`, tracker backend and workflow store. Follow `ALIGNMENT-ROOT.md`. From the repository or surviving base checkout run:

```sh
"$WORKTREE_SKILL_ROOT/scripts/inspect.ts" <canonical-ticket-ref> --json
```

Use the shared recovery decision. Observe active owners and reservations. Obtain scoped takeover approval where required. Inspection does not authorize mutation or terminate processes. If remote verification is unavailable because its observed commit is absent locally, fetch the named remote branch explicitly and inspect again. Do not repeat integration to recover missing objects.

## Preconditions

- Read the immutable review, implementation/fix and finish receipts. Projections locate records but do not establish state.
- For new integration, require an independent `SUCCESS` review covering the exact clean source commit/tree, with a validated parent completion and source-bound artifact.
- Use the ticket, commit, Worktrunk and applicable review skills. Resolve shared-context paths independently for workflow and evidence.
- Apply the concurrency contract across all initiatives. Confirm direct prerequisites and assess base changes against affected contracts. Independent base advancement does not invalidate the source review.
- Confirm phase-owned resource shutdown through muxer-subagents. Preserve unknown and unrelated processes. Do not require other initiatives' agents to stop.
- Preserve unrelated source and tracker changes. A dirty shared base that cannot be safely integrated requires isolation or operator direction, not a discard or stash.

## Reconcile before acting

1. Inspect actual local Git, remote branch, tracker, worktree and muxer state. A failed receipt does not prove that its operation had no effect.
2. Verify prior integration using its recorded method, frozen inputs, expected tree and actual parents. V1 retains its single-parent squash contract. V2 uses the selected integration method.
3. If current evidence verifies a terminal `FINISHED` receipt, return that result without further mutation.
4. If integration already exists, preserve its mapping and resume at validation, publication, tracker completion or cleanup. Never create another merge merely because the source workspace was removed or the remote tip advanced.
5. Append a v2 attempt linked to prior receipts. Use `scripts/write-result.ts --parent-event` for parent records. Preserve every prior event.

## Execute only the remaining operations

1. **Prepare.** Synchronise the accepted base without discarding unrelated changes or rewriting published history. Run the repository-wide coordination check. Follow `references/concurrency.md` to prepare a candidate from the exact reviewed source and current base. Store the plan, checks, assessment and commit message as versioned workflow snapshots. Append `prepared` with the review reference, method, base, source, expected tree and remote.
2. **Validate, integrate and publish.** Run `scripts/integration.ts apply` with the plan, source workspace, checks, message and explicit remote/ref. The helper reserves integration per shared Git directory and target branch, creates an isolated candidate, validates it, rechecks inputs and advances the base through Worktrunk. It leaves the reviewed source unchanged. Use repository-selected merge or squash policy, not a universal single-parent requirement. Keep the candidate and source workspaces until publication and ticket completion are verified.
3. **Record actual boundaries.** Append `merged` with the actual commit, parents, tree, candidate identity and validation results. Verify remote reachability and append `pushed`. If the helper failed after integration or push, inspect actual state and recover the missing checkpoints; do not infer that no mutation occurred. Validation failures preserve the candidate and its evidence.
4. **Handle advancement.** A changed source requires review of the changed source. An advanced base requires a new candidate, compatibility assessment and integration checks, not automatic full source re-review. A rejected non-force push requires publication reconciliation. Preserve prior attempts and independently verify each boundary. Product-code conflict resolution requires a reviewed resolved source candidate as specified in the concurrency contract.
5. **Complete the ticket.** Verify source review, candidate-bound checks and remote publication. Use the ticket skill for only the missing completion/publication operations. If already completed, verify its evidence. Append `ticket_completed` after backend publication succeeds. Remote advancement during a tracker push is a tracker-publication problem, not permission to repeat product integration.
6. **Clean up.** Recheck publication and tracker completion. Use muxer-subagents to verify phase-owned resources have stopped. Close only recorded source/candidate workspaces, not another initiative's workspace or a reused workspace. Use `cleanup-merged` for each recorded branch with `--min-age=0s`; verified integration and completed publication authorize those named branches only. Keep dirty, busy or refused resources. Record cleanup pending separately from accepted implementation. Append `worktree_removed` only after all required source and candidate resources are verified absent.
7. **Finalize.** Append `FINISHED` with all terminal fields and complete integration evidence. Regenerate projections. On failure append `FINISH_FAILED`, last verified checkpoint, failed operation, actual observations and preserved resource identities. Unknown outcomes use null. Failed cleanup does not reopen reviewed and published acceptance.

## Recovery boundaries

| Verified state | Remaining operation |
| --- | --- |
| Reviewed source unchanged; no integration | Prepare against the current accepted base |
| Candidate validation failed; no integration | Preserve evidence and resolve the failed check |
| Integration exists locally | Validate recorded integration and reconcile publication |
| Integration published; tracker incomplete | Complete and publish tracker state |
| Publication and tracker verified | Recover only remaining resource cleanup |
| Resources removed; terminal record absent | Verify durable evidence and append the terminal receipt |
| Remote tip object unavailable locally | Explicitly fetch the named branch and inspect again |
| Mutation outcome cannot be established | Obtain targeted recovery instructions; preserve records |

A source branch or workspace is required for new integration, not for verification of a prior integration. A matching ticket label or commit message alone is not integration evidence. Later commits on the remote base do not invalidate ancestry evidence.

## Output

Report the canonical ticket, source review, integration commit and method, finish receipt, checks, publication state, tracker state, cleanup state and exact remaining action. Separate accepted implementation from cleanup pending. Do not report `FINISHED` before every required terminal observation is true.
