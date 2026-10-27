# Goal recovery and scheduling

Use this reference during read-only goal preparation and before each authorized execution dispatch. Use the ticket skill for tracker state and `receipts.md` for durable phase and coordinator records.

## Build the recovery map

For every scoped ticket, record canonical ticket/workflow refs, tracker readiness and claim state, direct blockers, receipt chain, implementation/fix result, review target/verdict, current source commit/tree and dirty state, worktree identity, agent liveness, ownership evidence, integration evidence, and next safe action. Include completed tickets whose cleanup or finish receipt is incomplete.

Resolve workflow paths through shared-context. Check receipt parents and artifacts rather than choosing the newest filename. If a phase-result exists without its parent completion, reconcile the parent from verified evidence before selecting the next phase. A marker in pane output is not a receipt.

Inspect sessions with the muxer contract's read-only state operations. Preparation may resolve and read contracts for inspection, but must not open, resume, stop, or close sessions. A timeout, idle pane, or unknown owner is not proof that work stopped.

## Choose the next action

Apply these conditions in order. Ambiguous or inconsistent evidence always requires human input.

| Observed state | Next safe action |
| --- | --- |
| An associated agent or reserved dispatch might still be active | Observe it through the muxer; do not launch a duplicate |
| Claim or coordinator ownership cannot be established | Ask for explicit, scoped takeover approval; do not clear the claim |
| Finish began, integration may exist, or cleanup is incomplete | Reconcile through `finish`; never assume a retry needs a new merge |
| Valid finish and current remote/tracker evidence prove completion | Skip implementation; keep it in final verification scope |
| Missing worktree before any verified integration, broken receipt chain, unexplained dirty source, or missing required artifacts | Stop with the exact recovery requirement |
| Implementation or fix succeeded; no review covers its current clean source | Dispatch a fresh `review` in the existing worktree |
| Latest review is FAILURE and its source still matches | Dispatch fresh `fix`, then fresh `review` |
| Latest review is SUCCESS and current source commit/tree match | Dispatch `finish` |
| Source changed after review, with a traceable valid implementation/fix history and no unexplained dirty changes | Invalidate the verdict and dispatch fresh `review`; never run stale fix findings or finish |
| Incomplete implementation/fix/review with a dead session and no valid result | Ask for targeted recovery; never invent a successful receipt or blindly restart |
| Ready, unclaimed ticket with completed direct blockers and no existing implementation | Dispatch `start` |
| No start, recovery, or observable active work can advance the remaining scope | Report the blocking frontier |

A claimed ticket with a completed implementation is not a new `start`. Preserve its worktree and dispatch `review` after ownership is verified. A submitted PR is not completion: inspect source/review/remote state and use `finish` only when the configured publication policy permits local finish. A human-required PR merge gate remains a gate.

## Preserve ownership and dependency rules

Read the coordinator journal, if one exists, before proposing new work. Record existing run identity, frozen scope, consumed allowances, active owner, takeover approvals, unresolved reservations, and OMP accounting evidence in the prepared goal. Do not create a new run merely because the previous coordinator stopped.

A tracker `claimed` value without owner metadata does not establish who owns it. Accept durable ownership evidence tied to the current run, or explicit user approval naming the ticket workflows. For unknown or different owners, finish all safe preparation and ask one batch of adoption questions in the current interview before authorizing execution. User approval does not authorize a second live agent: wait for or hand off the existing session first.

During execution, first observe active work. Reconcile any unresolved reservation before reserving another phase. Recover an authorized existing workflow before starting a new ticket; break ties by canonical ticket ID. Dispatch one ticket at a time. Re-read direct blockers before recovery as well as new work. An incomplete or outside-scope prerequisite must not be bypassed by calling the action recovery.

If a live owner is making progress, report observation/wait as the next action, not blocked or duplicate implementation. Use the muxer contract's wait/event mechanism after authorization. If liveness cannot be established, request human input. If unfinished tickets remain but none can start, resume, or progress through observed active work, stop as blocked.

## Resume without resetting limits

After authorization, initialize or resume the journal using the `Goal coordinator journal` contract in `receipts.md`. Before any mutating phase, acquire sole coordinator ownership, check allowances, and persist a reservation. Pass its reference into the phase handoff; link resulting ticket receipts back to it.

Historical ticket receipts precede the first run's recorded baseline. Once the run exists, its reservations remain consumed across restarts, failed launches, new OMP sessions, and new invocations of `goal`. Preserve per-ticket fix consumption as well as total dispatch consumption. If a prior launch has no observed phase receipt, reconcile the agent and actual state; it still consumed its allowance.

Reusing the same paused OMP goal retains runtime accounting. If the current session already has that goal, return the prepared recovery context and instruct `/goal resume`, not `/guided-goal` or goal replacement. For a replacement OMP goal, require authoritative prior token usage and request only the remaining allowance. If accounting or ownership cannot be established, stop for explicit renewal or takeover; do not silently reset it. Limits are totals for the run, not a fresh allowance for each invocation.

## Completion

Require all frozen tickets' acceptance evidence, reviewed-source-to-integration mappings, remote publication, tracker completion, and terminal finish receipts. Recover missing cleanup/terminal receipts through `finish` even when the ticket label already says completed. Verify final integrated checks. Append a coordinator completion checkpoint before calling the OMP goal complete operation.

