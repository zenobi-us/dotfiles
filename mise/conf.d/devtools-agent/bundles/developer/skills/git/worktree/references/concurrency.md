# Concurrent work streams

This contract owns cross-initiative coordination and moving-base integration. Start, review, goal and finish use it. Initiative membership groups intent; it does not reserve the repository.

## Source review and integration

For repository-backed workflow records, select one surviving context checkout with the same verified Git common directory, normally the base checkout. Resolve workflow routes there and pass that repository path and exact store fields in every handoff. Children use that path for `write-result.ts --repository`; their source worktree remains a separate field. Keep receipts, review artifacts, tracker publication and regenerated projections out of the frozen source checkout. Publishing metadata on the base can advance integration inputs, but must not rewrite reviewed source. This selects an existing checkout; it does not authorize storage initialization or migration.

- A source review MUST name the exact clean source commit and tree, review base, changed scope, affected contracts and integration checks.
- Base advancement alone MUST NOT invalidate that source review. A source commit or tree change requires review of the changed source.
- Integration MUST combine that frozen source with the current base. A clean textual merge is necessary, not proof of behavioural compatibility.
- Compare base changes since the review context with affected interfaces, schemas, dependencies, generated outputs and exclusive resources. Record the assessment and validation commands. Separate files can change incompatible contracts.
- When compatibility is uncertain, obtain a targeted integration review. When product-code conflict resolution is required, preserve the original source, create a resolved source candidate and obtain an independent review of the resolution and affected behaviour before integration. The source review MUST NOT silently approve new code.
- When generated projections conflict, regenerate them from the combined authoritative event graph in a separate resolved source candidate. Preserve authored artifacts and every event. Validate the graph and review the changed source; do not choose an arbitrary projection copy.

## Before dispatch

Inspect active tickets, workspaces and reservations across all initiatives through `scripts/coordination.ts`. Its path is relative to the installed worktree skill directory. Invoke the absolute script from the target repository. Missing planned scope or an unavailable adapter is unknown, not proof of compatibility.

File overlap is a risk, not a blocker by itself. Explicit canonical ticket prerequisites, incompatible contract changes and contested exclusive resources can block the affected operation. Record the reason, owner, evidence and required coordination. Keep resource contention in workflow reservations, not in `blocked_by` unless there is a real implementation prerequisite. Recheck the assessment before review and integration.

## Prepare a candidate

Resolve the installed worktree skill as `WORKTREE_SKILL_ROOT`. Run the following commands by absolute path from the target repository. The helper does not claim tickets, approve reviews or authorize execution; the calling playbook validates those gates first.

```sh
"$WORKTREE_SKILL_ROOT/scripts/integration.ts" prepare --source <reviewed-sha> --base <branch> --method merge
```

Capture the returned `worktree-integration/v2` JSON as a versioned snapshot under the resolved workflow's `artifacts/snapshots/`. Record its reference in a v2 prepared receipt. The result contains the frozen source, current base and expected clean integration tree. A conflicting merge stops preparation before base mutation.

The default method is `merge`: the candidate has the base and reviewed source as its two parents. If repository policy requires `squash`, select it explicitly; the candidate has only the base parent. Both methods preserve the original reviewed source. Parent count is a selected policy, not the source-review verdict.

For squash, the helper retains the exact reviewed source under shared `refs/worktree-reviews/<source-sha>` so local Git garbage collection cannot remove review provenance after source cleanup. Record the returned `reviewed_source_ref`. This local retention is not remote publication evidence; preserve these objects when transferring workflow history to another repository.

Prepare a JSON array of checks such as `[{"argv":["bun","test","path/to/affected.test.ts"]}]`. Include relevant producer/consumer contract checks and a real scenario. Checks execute without a shell in the isolated integration workspace. Supply the commit message in a file; follow the commit skill and include the canonical ticket and review reference.

```sh
"$WORKTREE_SKILL_ROOT/scripts/integration.ts" apply --input <plan.json> --source-workspace <absolute-source-path> --checks <checks.json> --message <message-file> --remote <remote> --remote-ref refs/heads/<branch>
```

The helper creates a commit object and a separate Worktrunk candidate workspace. It validates the candidate before advancing the base through Worktrunk. It does not rewrite the source branch. It retains candidate resources and reports their identities on success or failure; use scoped cleanup after publication and tracker completion. Dependency preparation must leave the candidate's tracked and untracked source clean; use ignored dependency directories.

The helper runs configured pre-merge hooks explicitly in the candidate workspace, with normal hook approvals, before the declared checks. It then requires the original candidate HEAD, tree, branch, repository and clean workspace. It forces fast-forward application and disables automatic hooks for that final operation, so hooks cannot change the candidate between verification and application. The caller must inspect required post-merge hooks and run them explicitly after publication with normal approval and resource ownership; automatic deployments are not part of candidate validation.

## Coordinate publication

`apply` holds an exclusive reservation in the repository's shared Git directory for the target base branch. All local initiatives and linked checkouts use the same reservation. The reservation spans candidate validation, integration and optional publication. Without `--remote`, the caller must arrange publication separately and cannot claim this reservation covered it.

For publication-only recovery, first verify prior candidate-bound validation and the integration mapping. Run `"$WORKTREE_SKILL_ROOT/scripts/integration.ts" publish --input <original-plan.json> --commit <integration-sha> --remote <remote> --remote-ref refs/heads/<branch>`. It takes the same branch reservation, verifies the existing integration and local ancestry, and skips push when remote reachability already proves publication. It does not create another candidate, merge or source workspace.

A reservation blocks competing local integration, not implementation or review. A remote writer can still advance the target. Push is non-force. On rejection, inspect the recorded candidate and actual local/remote state. Synchronise the accepted base, then prepare and validate a new candidate from the same reviewed source. Preserve both attempts. Do not repeat an already verified merge as recovery.

If a reservation remains after interruption, inspect its owner record and process liveness. Obtain scoped takeover approval before clearing an abandoned reservation. Do not remove a live or uncertain reservation.

## Receipts and completion

New records use `worktree-receipt/v2`; retained v1 records keep their original semantics and bytes. Mixed parent chains are allowed. The v2 finish mapping records integration method, base, reviewed source, expected tree, actual commit and parents, candidate workspace and passing checks bound to that commit/tree. Preserve source-review evidence separately from integration validation.

Use `scripts/write-result.ts --parent-event --repository <absolute-repository> --input <event.json>` for parent lifecycle, checkpoint and finish records. Child results omit `--parent-event` and use their assigned v2 handoff. The writer checks the envelope, store route and source identity, rejects duplicate files, and verifies completed integration mappings. Parent writes do not consume child delivery slots.

Remote publication is proved by integration reachability from the observed remote tip. Later independent commits do not invalidate completion. If the observed remote object is absent locally, the read-only inspector reports verification unavailable. Fetch the named remote branch explicitly, then inspect again. This is not permission to merge again.

Published acceptance and resource cleanup are separate facts. A cleanup refusal preserves source review, integration and publication evidence. Report cleanup pending and recover only that operation; append `FINISHED` only after every required terminal observation is true.

Collect candidate branch/workspace pairs from every prior finish attempt in the parent chain, not just the successful candidate. Preserve failed candidates until scoped cleanup is safe or the operator resolves their disposition. A remaining recorded candidate keeps cleanup pending even when the current integration is already accepted.
