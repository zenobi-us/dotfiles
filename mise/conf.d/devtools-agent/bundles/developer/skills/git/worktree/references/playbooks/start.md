# Playbook: start

Create an isolated Worktrunk worktree and start an implementation agent.

This playbook receives `muxer`, `agent`, `muxerContract`, and `agentContract` from the `worktree` skill, which resolves them with the `muxer-subagents` skill. It does not detect either.

## Inspect and recover first

Resolve the canonical ticket and absolute installed `WORKTREE_SKILL_ROOT`. From the repository or surviving base worktree run:

```sh
"$WORKTREE_SKILL_ROOT/scripts/inspect.ts" <canonical-ticket-ref> --json
```

Follow the shared decision and execution gates in `references/receipts.md` before the normal process below. This command recovers its own interrupted attempt. Inspection is read-only; the playbook performs any authorized reconciliation or retry. If a different action is recommended, dispatch that playbook rather than bypassing its gates. Observe active owners, check reservations and ownership, obtain required scoped takeover approval, and never auto-kill a session. Append recovery provenance; preserve prior receipts and partial source.

## Preconditions

- Read `references/receipts.md`.
- Load the issue-tracker reference and ticket skill. Resolve the canonical ticket
  `ref` and backend. Ask when the selector is missing or ambiguous.
- Use Worktrunk and the `muxerContract` and `agentContract` resolved by the
  `muxer-subagents` skill.
- Designate a surviving context checkout, normally the base checkout, for repository-backed tracker and workflow publication. Run shared-context there and retain its absolute checkout path, route table, alignment root, workflow store, and reference. Before child launch, verify that this checkout and the source worktree resolve to the same real Git common directory. A source checkout is not the workflow publication root; shared-store routes remain unchanged.
- Follow `ALIGNMENT-ROOT.md` before reading context, ADRs, or `docs/agents/`.
- Resolve the workflow root with
  `shared-context resolve workflow --id <ticket-id> --json`.
- Use the applicable Matt Pocock engineering skill.

## Cross-initiative coordination

Before a claim, worktree creation, or child launch, inspect active executable tickets across all initiatives. Resolve `WORKTREE_SKILL_ROOT` to this installed skill directory. From the target repository or surviving base worktree, run:

```sh
"$WORKTREE_SKILL_ROOT/scripts/coordination.ts" <canonical-ticket-ref> --json \
  --scope <repository-relative-path> --scope <another-repository-relative-path>
```

Pass the proposed files or directories as repeated literal `--scope` paths. Do not use globs. If scope is not yet known, omit `--scope`; the report must remain unknown.

Apply [Concurrent work streams](../concurrency.md) to assess prerequisites, shared contracts/resources, and ownership across initiatives. Check canonical ticket/receipt references, workspace owners, and outstanding goal reservations. Verify liveness through the muxer contract and preserve claim/takeover gates.

Missing scope, inspection errors, or `inventoryComplete: false` requires a recorded assessment, not a repository-wide stop. Resolve uncertainty that affects this ticket's prerequisites, owner, dispatch reservations, shared resources, interfaces, or scope before that operation. An unrelated damaged workflow does not block an independent stream solely because its history is incomplete. Record the evidence for independence and the remaining uncertainty; unknown scope is never proof of compatibility. The CLI returns observations, not permission or a lock.

The inventory includes verified linked checkouts that share the Git common directory. The designated context record remains authoritative for readiness and dependencies; stale linked body, comment, or status copies do not replace it. Linked differences remain unpublished observations in `ambiguities`. Use each reservation's `locations` to inspect its authoritative copies. Byte-identical copied journal events count once. An outstanding or ambiguous reservation for this ticket requires owner/coordinator reconciliation before duplicate dispatch.

Each drift copy provides its checkout, canonical reference, observed status/blockers, and `snapshotDigest`. This SHA-256 digest covers the normalized ticket JSON, not the file bytes. Retrieve the full record through its reference and named checkout when needed.

Inspect `proposed.ownership`, `proposed.owners`, `proposed.sourceObservations`, and `proposed.receiptRefs` even when `proposed.reservations` is empty. Observe an active owner instead of launching a duplicate. Reconcile uncertain existing workspace/receipt ownership through the phase inspector and muxer contract before dispatch. A matching branch does not replace an unavailable recorded source workspace.

`recordDiagnostics` identifies unreadable tracker records by canonical reference and checkout. Coordination can assess unaffected records without weakening the tracker parser's default strict mode. A malformed proposed record in the designated context fails explicitly. A missing or malformed canonical prerequisite remains unresolved; a stale completed copy in another checkout cannot clear it.

Completed tickets with no retained workspace, active owner, or outstanding dispatch are not active source streams. A retained workspace can appear with `cleanupOnly: true` and comparison `cleanup-only`. Its archive/cleanup errors do not make unrelated source inventory incomplete. Preserve its workspace and apply targeted ownership and resource checks before reuse; recover cleanup separately.

Ordinary stream inventory reads receipt envelopes, journals, and matched current workspaces without remote publication checks or repository-history scans. Inventory observations never establish `historyValid`. A reconciled reservation is cleared only after full validation of its referenced result/completion. For the proposed ticket, coordination selectively validates that reference in its exact checkout and caches the result. Other unverified reconciliations remain visible in `reservationObservations` for scoped assessment; an observed reconciliation is not verified completion. Use the phase inspector and finish checks for execution and integration decisions.

Record the assessed scope as optional `scope_paths` in the new phase-start receipt and any goal dispatch reservation. Keep paths repository-relative. Record the decision, ownership evidence, hazards, and consumed authoritative ticket/receipt/journal references in the handoff and receipt. Recheck immediately before launch if scope, source, ownership, or reservations changed. A temporary CLI report does not replace those authoritative records.

## Process

1. Resolve and validate the ticket. Run its preflight and claim operation.
   Before making a tracker write, inspect the Git status of the repository
   containing the resolved tracker store. Classify existing changes by their
   resolved shared-context paths and ownership; do not assume that unrelated
   files merely inside the same Git repository are shared-context changes. If
   there are uncommitted shared-context changes relevant to the workflow,
   include them in atomic commit groups using the `commit` skill before starting
   source work. Every such commit title must include the resolved ticket
   reference. Preserve and do not stage unrelated user changes. A scoped
   tracker commit may proceed alongside unrelated dirty files only when the
   `commit` skill permits safe path-specific staging. If changes cannot be
   safely classified or isolated, stop and report the paths and ask for
   direction. Never silently discard, stash, or commit unrelated changes.
2. Read the relevant context, ADRs, and agent instructions.
3. For `begin`, resolve the base branch and create the source branch with Worktrunk. For authorized `takeover`, verify repository, recorded source branch/commit and base identity, liveness, reservations, and ownership. Reuse the existing worktree and preserve partial source, including dirty work. If the worktree was removed but the surviving source branch is uniquely identified and verified, use Worktrunk to recreate a checkout of that existing branch after those same checks. Never reset source, create a replacement branch, overwrite an occupied path, or infer branch identity from a name alone. If identity cannot be established, stop for targeted recovery instructions. Reconcile an existing valid result without launching another implementer. A missing/unusable result requires a fresh implementation session and new attempt, not a fabricated completion.
4. Create the workflow root and fixed internal directories only for an authorized new workflow write. For recovery, preserve existing storage and append a new `start` phase-start receipt linked to prior attempt and consumed inputs. Regenerate projections from events without resetting history.
5. Write a temporary implementation handoff. Include the ticket `ref` and
   backend, branch, worktree, base branch, designated context checkout path,
   context route table, workflow store and reference, relevant files,
   requirements, validation commands, receipt path, and these
   completion requirements:
   - Implement the ticket.
   - Run validation.
   - Write the immutable implementation phase-result with `"$WORKTREE_SKILL_ROOT/scripts/write-result.ts" --repository <absolute-designated-context-checkout> --input <prepared-result.json>`, following `references/receipts.md`. This writes authoritative YAML and delivers the parent result in one operation. Resolve publication through the supplied context checkout, not the child's source cwd. Keep publication writes outside the frozen source worktree.
   - Write `artifacts/snapshots/pr-draft-<receipt-id>.md`.
   - Regenerate `manifest.yaml`, `projections/pr-draft.md`,
     `projections/implementation-log.md`, and
     `projections/latest-status.yaml`.
   - Preserve failed or blocked outcomes in the result. Do not paste the full receipt or a completion marker into final chat.
6. Use the `muxer-subagents` spawn router with the worktree, handoff file, explicit muxer and agent, and `--result-schema worktree-receipt/v2`. Retain its delivery context and assigned target. The router opens and launches the fresh session; do not launch it again.
7. Do not open another implementation session for this worktree while one is active.
8. Wait for completion using the muxer contract. Read the assigned result through result-delivery, then validate the authoritative result and artifacts independently. Acknowledge the transport after domain checks. Do not scrape final pane text for JSON or a completion marker.
9. If the result is blocked, validation fails, or no usable result exists, append an accurate failed/blocked phase-complete receipt and keep the worktree and partial source. A later start recovers this attempt through a fresh session after the recovery gates.
10. If the agent succeeds, verify the implementation phase-result receipt, draft snapshot, and projections. Record their paths in a phase-complete receipt.
11. Close the implementation pane. Keep the worktree and workspace available for review.

## Receipt requirements

The implementation receipt MUST record the exact source commit and tree after implementation, changed files, validation results, implementation summary, open questions, agent, session or pane identifier, and parent `start` receipt.

## Output

Report:

- ticket
- status
- source branch
- base branch
- worktree path
- muxer, workspace path, and pane or session identifier
- implementation receipt
- draft snapshot and projection paths
- handoff path
- validation result
- pane close result
- next action and reason from a fresh shared inspection after recording the actual outcome; report `review <ticket-id>` only when a valid clean implementation result supports it. For failed, blocked, or missing results, report the inspected recovery/observation requirement instead of promising review.
