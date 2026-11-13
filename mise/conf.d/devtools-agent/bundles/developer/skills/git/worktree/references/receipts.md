# Worktree receipts

Use receipts as the durable record for every worktree phase.

New phase executions use `worktree-receipt/v2`. Retained `worktree-receipt/v1` events and explicitly authorized v1 envelope repairs keep their original semantics. Preserve original bytes. Mixed parent chains are valid. Read [Concurrent work streams](concurrency.md) before start, review, goal dispatch or finish. It owns cross-initiative coordination and the distinction between source review and integration validation.

Use the absolute installed `scripts/write-result.ts` with `--parent-event --repository <absolute-repository> --input <event.json>` for parent records. Omit `--parent-event` for child results and use the assigned v2 delivery context. Parent writes do not consume child result slots. The writer validates store/source identity and refuses duplicate events.

## Workflow layout

Resolve the absolute installed shared-context skill directory as `SHARED_CONTEXT_SKILL_ROOT`. Run its CLI from the target repository or surviving base worktree.

Resolve the workflow record with:

```sh
"$SHARED_CONTEXT_SKILL_ROOT/scripts/shared-context/cli.ts" resolve workflow --id <ticket-id> --json
```

Resolve each evidence run separately with:

```sh
"$SHARED_CONTEXT_SKILL_ROOT/scripts/shared-context/cli.ts" resolve evidence --workflow <ticket-id> --run <run-id> --json
```

Use only:

```text
events/
artifacts/reviews/
artifacts/snapshots/
artifacts/evidence/
projections/
manifest.yaml
```

`events/` is authoritative and append-only. `artifacts/` holds immutable
authored outputs and evidence. `projections/` and `manifest.yaml` are generated
and replaceable. Evidence can use a different store from the workflow. Do not
write workflow state to `.scratch/`, `<ticket>/local/`, the ticket collection, or the source collection.

## Rules

- Create one receipt for every `start`, implementation completion, `review`,
  `fix`, `submit`, and `finish` event.
- The parent playbook MUST create a phase-start receipt before it launches an agent.
- The child agent MUST create one phase-result receipt after it completes its work.
- The parent playbook MUST create one phase-complete receipt after it reads and validates the result receipt.
- Store every receipt under `events/`.
- Never overwrite an event or result receipt.
- Allocate a new receipt ID before every write. Fail when the target path already exists.
- Record the exact source commit and tree that the agent inspected or changed.
- Link each receipt to its parent receipt.
- Treat chat, pane output, and `/tmp` handoffs as transport only. They are not workflow state.
- Treat `manifest.yaml` and `projections/` as generated views.
- Name each review artifact `artifacts/reviews/review-<receipt-id>.md`. A relative artifact `ref` that is not found from the repository root resolves inside the receipt's `workflow.ref` folder.
- Put `verdict` only on the review phase-result receipt. The inspector reads the verdict and artifact from the result that a review phase-complete receipt names as its parent.

## Shared recovery decision

Every phase command recovers its own interrupted attempt; recovery is not limited to `continue` or `goal`. Resolve the absolute installed `WORKTREE_SKILL_ROOT` and, from the repository or surviving base worktree, run:

```sh
"$WORKTREE_SKILL_ROOT/scripts/inspect.ts" <canonical-ticket-ref> --json
```

`"$WORKTREE_SKILL_ROOT/scripts/router.ts" inspect <canonical-ticket-ref> --json` exposes the same read-only entry point. Both consume `scripts/recovery.ts`'s single decision. The decision carries `action`, `mode`, `label`, `reason`, `requiredApproval`, `parentReceipt`, `inputs`, and optional `alternatives`. An absent action is not permission to select an arbitrary phase. Inspection reports a decision; it never performs recovery mutations.

| Mode | Execution rule |
| --- | --- |
| `begin` | Run the recommended phase after its normal preconditions. |
| `reconcile` | Validate the existing child result, artifacts, exact source identities, validation, and shutdown; append the missing parent completion without repeating child work. For finish, reconcile actual integration/publication/cleanup boundaries below. |
| `retry` | A missing or unusable child result is not success. After ownership/liveness checks, run a new attempt, with a fresh reviewer for abandoned or unusable review. |
| `takeover` | Recover incomplete start implementation or traceable partial fix in a fresh session and existing worktree; preserve source, including dirty partial work. |
| `observe` | Observe the active owner/reserved dispatch through the muxer contract; do not launch a duplicate. |
| `blocked` | Report the exact missing, ambiguous, or inconsistent evidence. Broken parent graphs block; missing evidence is not proof that an operation did not occur. |
| `complete` | Verified FINISHED plus current remote/tracker/cleanup evidence proves completion; no new mutation. |

Before any recovery mutation, inspect afresh, verify agent liveness, active goal reservations, ticket/coordinator ownership, and direct blockers. A timeout, idle pane, missing marker, or unknown session is not proof of shutdown. A known live owner must be observed or explicitly handed off. Unknown or different ownership requires explicit, scoped takeover approval, recorded before execution; approval does not authorize a duplicate live session. Never automatically kill an agent. Use the ticket skill for idempotent held claims or consented ownership transfer; `claimed` alone proves neither ownership nor implementation.

A valid result without parent completion is reconciled, not rerun. Missing/unusable result or review artifact requires a new attempt, never an invented successful receipt. Incomplete start selects start takeover; incomplete review selects fresh review retry; incomplete fix selects fix takeover only when findings and partial source are traceable, otherwise fresh review once a valid clean implementation target is established. Source changes after either review verdict select fresh review, not stale fix or finish. Valid implementation/fix selects review. A current clean SUCCESS selects finish, with submit as the publication-policy alternative. A submitted PR, tracker commit, evidence run, or artifact alone does not prove implementation or completion.

For every recovery attempt append provenance to new receipts: consumed receipts and artifacts in `inputs`, prior attempt/parent reference, observed source and session identities, recovery mode/reason, ownership and approval evidence, validation and actual outcomes. Preserve older receipts and partial source. Do not rewrite an abandoned attempt, invent an evidence run, or add recovery frontmatter to tickets. Shared-context resolves locations; it does not prove workflow existence. Recovery never runs storage `init` or `migrate`.

## Initial start classification

Tracker and evidence-only commits do not establish implementation. For an unstarted ticket with no receipts, source commits, or source workspace, offer `Start` after direct prerequisites complete. Run normal ownership and reservation checks during start; unknown ownership alone does not imply takeover.

Source commits or a matching workspace without receipts require inspection and preservation of existing work. A branch without a checked-out workspace also requires inspection. Multiple candidate workspaces block selection until the source is identified. Inventory, commit-history, and source-inspection failures block a new start and retain the specific error.

Graphs show `READY` only for `start` in `begin` mode. Start recovery and takeover remain `BLOCKED`, with the recovery action and reason available in the detail view. Receipt-based recovery and active-owner decisions retain precedence.

## Append-only envelope repair

An explicitly authorized history repair may restore missing receipts from retained source-worktree or Git records. Create byte-identical copies with exclusive writes; record their source and SHA-256. Preserve every original receipt and parent link.

To supplement a malformed historical envelope, append a normal receipt with a valid parent and current source identity. An authorized repair may retain the historical v1 envelope; do not invent v2 candidate evidence for an old integration. New phase executions use v2. Record `history_repair_reason`, `history_repair_authorization`, and `history_supplements`. List each target in `inputs`. Each supplement contains its root-relative event `ref`, exact original-byte `sha256`, and one or more of:

- `evidence`: the missing `{store, ref}` envelope. It must identify an existing object in the independently resolved evidence store under this workflow. Preserve the recorded evidence; do not invent an execution.
- `normalize_workflow_root: true`: normalize a historical repository-worktree store root to the current workflow store root. The original root must equal the recorded worktree; repository, store and workflow reference must already match.
- `normalize_finish_workspace: true`: normalize only a retained v1 finish whose `workspace_path` equals its parent `repository`, differs from its absolute `worktree`, and whose `source_workspace_path` equals that `worktree`. The effective `workspace_path` becomes `worktree`; original bytes, source identities, session identifiers, outcome and parent links remain unchanged. This does not apply to v2 or other phases.

- `input_refs`: a non-empty list of `{index, ref}` entries. `index` is the zero-based position of an existing input whose `ref` property is absent. Supply only that property; preserve its kind and other metadata. Each `ref` MUST name an existing file inside this workflow's `artifacts/` directory and MUST also appear in the repair receipt's `inputs`. Absolute paths, escaping symlinks, directories, duplicate indices, existing refs (including empty ones), and other entry fields are rejected. This supplies provenance only; it does not establish operator approval or change execution authority.

The inspector validates supplements before constructing the parent graph. Targets must be older event files in this collection. Duplicate targets, changed checksums, missing evidence objects, replacements of existing evidence and other field changes block inspection. Source commit/tree, verdict, status, ticket identity and parent links cannot be supplemented. Raw event fields remain available beside the validated effective receipt view. The supplement holder must itself pass normal receipt validation. A repair is not a new implementation, review verdict, or authorization to take over a live session.

For a terminal v1 finish repair, retain the exact reviewed source commit/tree and source worktree in the appended finish envelope. Record the current repair checkout, commit/tree and session separately in recovery provenance. Reverify the integration mapping, remote reachability, tracker state and source removal before retaining `FINISHED`; do not claim that historical validation ran again. The repair records the current observation of an old integration, not a new finish execution.

## Receipt fields

Copy `workflow.store`, `workflow.root`, and `workflow.ref` from the corresponding
fields returned by `"$SHARED_CONTEXT_SKILL_ROOT/scripts/shared-context/cli.ts" resolve workflow --id <ticket-id> --json`.
`workflow.root` is the store root. It is not the returned `path`, which includes
`workflows/<ticket-id>`. Never substitute the workflow directory for the store root.

Finish runs in the parent session and MAY record `pane_id: null` before or after ticket completion. A phase-start receipt MAY record `pane_id: null`, because the parent writes it before the pane opens. Parent `phase-complete`, `operator-approval`, and `operator-decision-required` receipts MAY record `pane_id: null`, but MUST name a non-empty parent session ID. Operator records identify the parent decision; they do not require a child pane. This does not waive session identity, receipt provenance, or recovery evidence. Child implementation, review, and fix results still require their child pane identity.

For active workflows, `repository` MAY name another existing checkout of the same Git repository. The inspector MUST verify that both checkouts resolve to the same real Git common directory. A matching origin or source commit alone is insufficient. Repository workflow roots may retain the recorded parent repository or source worktree root when both share the current store’s Git common directory. Shared workflow roots must match the independently resolved store. A retained repository-store root MAY name its recorded source worktree when the inspector proves that it shares the current store’s Git common directory. Store and workflow references MUST still match. This permits byte-identical receipt copies in the base checkout while a review target remains frozen. These checks do not normalize or rewrite receipt fields.

Every ticket-phase receipt MUST include:

```yaml
schema: worktree-receipt/v2
receipt_id: review-0003
workflow_id: GH-42
phase: review
attempt: 1
parent_receipt: implementation-0002

repository: /absolute/path/to/repository
worktree: /absolute/path/to/worktree
source_branch: feature/ABC-123-example
base_branch: main
source_commit: 0123456789abcdef
source_tree: 0123456789abcdef
created_at: 2026-09-29T12:00:00Z

muxer: hrdx
workspace_path: /absolute/path/to/worktree
pane_id: 42
agent: pi
session_id: session-id-or-null

ticket:
  backend: github
  id: "42"
  ref: https://github.com/owner/repository/issues/42

workflow:
  store: shared
  root: /resolved/shared/root
  ref: shared://workflows/GH-42

evidence:
  store: repository
  ref: workflows/GH-42/artifacts/evidence/manual-001

ticket_ref: https://github.com/owner/repository/issues/42

inputs:
  - kind: ticket
    ref: https://github.com/owner/repository/issues/42
  - kind: evidence
    ref: workflows/GH-42/artifacts/evidence/manual-001

outputs:
  - kind: receipt
    ref: review-0003

status: completed
```

Every receipt MUST list the durable records it consumed in `inputs`.
Every receipt MUST list the durable records it created in `outputs`.
Temporary handoffs MUST NOT appear as authoritative outputs.

When dispatched by a goal coordinator, every phase handoff and ticket-phase receipt MUST carry `goal_run_id` and `goal_dispatch_ref`. Include the reservation in receipt `inputs`; parent and child phases preserve these fields. A standalone worktree command omits them. Reconciliation may link older receipts through a new coordinator event without rewriting those receipts.

When an input or output references an external evidence object, include its
`sha256` checksum with the stable `ref`. Local file evidence does not need a
checksum.

Implementation receipts MUST also record changed files, validation results, the implementation summary, and open questions.

Completed review receipts MUST record `verdict: SUCCESS|FAILURE` and every finding with an ID, severity, ADR reference, file, line, description, required change, and validation command.

When a blocked or failed review has no usable verdict, omit `verdict`. An explicit verdict MUST be `SUCCESS` or `FAILURE`. A missing verdict does not establish review success.

Fix receipts MUST record the consumed review receipt IDs, resolved finding IDs, unresolved finding IDs, validation results, and the new source commit.

## Child result delivery

Use the agent-core result-delivery skill for transport, not workflow authority. Before launch, select worktree-receipt/v2 as the result schema and retain the muxer delivery context and target. Retained v1 handoffs must still receive v1 results; do not change a live handoff's schema.

Launch the child through the muxer spawn router with --result-schema worktree-receipt/v2. The router opens the fresh pane, sets RESULT_DELIVERY_CONTEXT and binds the run identity. Include the phase-start reference and result requirements. Do not launch the child twice.

The child prepares its phase-result as one JSON object with the existing receipt fields. Resolve WORKTREE_SKILL_ROOT to this installed skill directory. From the source repository, invoke its absolute scripts/write-result.ts entrypoint with --repository, --input and the prepared JSON filename. Its mise shebang selects Bun. The command resolves the workflow through shared-context, checks the envelope and current source identities, writes an immutable YAML event and delivers the same object to the parent. It does not approve the phase, claim a ticket, merge, commit or push. Existing phase preconditions still apply.

Without `--parent-event`, the writer accepts only child phase-result events with phase `implementation`, `review` or `fix`. With `--parent-event`, it writes parent lifecycle and finish records without consuming the child handoff. Omit `created_at`; the writer records the current UTC time. It rejects a `created_at` more than 10 minutes from the current time. Existing events are never overwritten. If publication succeeded but transport failed, preserve recovery JSON and recover delivery; do not repeat implementation, review or fix.

After the muxer reports completion, the parent reads the assigned result target through result-delivery. Validate its schema, run, operation and hash. Independently verify the authoritative YAML event, parent chain, source commit/tree, artifacts, validation, ownership and required publication. Acknowledge only after those checks. A blocked signal is not terminal completion. No pane marker is required.

Transport data and acknowledgement remain outside temporary muxer cleanup. Keep the authoritative event and transport result separate. Human sessions receive a summary and canonical receipt/artifact references. Machine callers can request JSON.

## Receipt protocol

Set `event: phase-start` and `status: started` before launching an agent. Set
`event: phase-result` on its result and `event: phase-complete` on the parent
completion. Phase-start and phase-complete receipts use the envelope above, but
MAY omit `evidence` when they produce no evidence run. Preserve their durable
input and output references. Phase-result receipts MUST include `evidence` when
an evidence run exists. When none exists, omit `evidence` or set it to `null`.
Do not invent an evidence run to satisfy the envelope.

1. Resolve the workflow root before selecting a receipt ID.
2. List the existing receipt IDs under `events/`.
3. Select the next unused sequence number.
4. Write a new file under `events/` with `--no-clobber` or the equivalent
   atomic operation.
5. Read the receipt after writing it.
6. Stop when a required field is missing or the target path exists.

Lifecycle control records remain part of the parent graph. They do not prove a phase result or authorize integration. The reader accepts these event/status pairs:

| Event | Status | Minimum attempt |
| --- | --- | --- |
| `phase-start` | `started`; retained finish starts may use `RUNNING` | 1 |
| `phase-input-ready`, `phase-checkpoint` | `started` | 1 |
| `operator-approval` | `approved` | 0 |
| `operator-decision-required` | `blocked` | 0 |
| `source-once-inputs-prepared`, `bounded-review-inputs-prepared` | `prepared` | 1 |

These control records MUST NOT carry a review verdict. Attempt zero records an operator decision, not a phase execution. Phase results still require a positive attempt and a result status below. Preserve historical status fields; do not rewrite receipts to make them readable.

Use these phase result values for `status`:

```text
completed
failed
blocked
```

Use `FINISHED` or `FINISH_FAILED` for terminal finish receipts. The example above shows the normal `completed` value.

Use these finish result states:

```text
FINISHED
FINISH_FAILED
```

A phase-complete receipt MUST link to the phase-result receipt when a usable child result exists. If no child result exists, the parent MAY append a failed or blocked phase-complete receipt with `result_missing: true`, `parent_receipt` naming the interrupted phase-start receipt, and `failure_reason` describing the observed failure. This parent-side record MUST NOT claim success or invent a child result. A later invocation inspects that failed/blocked attempt for retry or takeover. A projection MUST
NOT replace a receipt.

The append-only history under `events/` is the workflow record.

## Terminal finish receipt

A terminal finish receipt MUST use these fields:

```yaml
merged_commit: abc123
pushed: true
ticket_completed: true
worktree_removed: true
workspace_closed: true
```

When finish fails, it MUST also record:

```yaml
failure_step: push
failure_reason: ...
worktree_preserved: true
workspace_preserved: true
```

## Finish checkpoints and integration evidence

Use the ticket receipt envelope for append-only finish checkpoints. Set `phase: finish`, `status: FINISHING`, and `checkpoint` to the last verified boundary: `prepared`, `merged`, `pushed`, `ticket_completed`, or `worktree_removed`. Record `next_step`. Append `FINISH_FAILED` on failure; never erase earlier checkpoints.

Before integration, record `review_receipt`, `reviewed_source_commit`, `reviewed_source_tree`, `base_before`, `base_branch`, `remote`, `remote_ref`, `integration_method` and `expected_merge_tree`. Compute the expected clean result from the frozen reviewed source and current base. Follow `concurrency.md` for candidate creation, compatibility checks and product-code conflict resolution. Record the proposed commit message and ticket reference before Worktrunk advances the base.

After integration, record `merged_commit`, `merged_tree`, `merged_parents`, `candidate_branch` and `candidate_workspace`. V2 `merge` requires parents `[base_before, reviewed_source_commit]`; v2 `squash` requires `[base_before]`. Both require the computed expected tree. V1 retains its original single-base-parent squash rule. Record each check in `validation_results` with `argv`, absolute `cwd`, `exit_code`, `source_commit` equal to `merged_commit` and `source_tree` equal to `merged_tree`. Publication and completion require non-empty passing candidate-bound checks. `source_commit` and `source_tree` in the envelope continue to identify the reviewed source, not the integration candidate.

After push, record `remote_observed_commit` and evidence that `merged_commit` is reachable from it on the named remote ref. Later legitimate commits on the base do not invalidate reachability. After ticket completion, record the canonical tracker reference, observed state, and publication evidence required by its backend. Record actual worktree/workspace identity and removal observations.

If a process stopped after a mutation but before its checkpoint, inspect actual state before retrying. Recover a missing merge checkpoint only if one unique commit is identified by the prepared base parent, expected tree, and recorded merge identity. Reconcile remote and tracker state independently. If evidence cannot establish a boundary, request human input rather than repeat a potentially completed mutation.

Older receipts remain readable. Missing recovery fields are not permission to fabricate evidence. Require independently verifiable evidence or human recovery instructions.

## Goal coordinator journal

This journal is not a ticket-phase receipt. For an initiative, resolve its workflow with `resolve workflow --id goal-<initiative-id> --json`. For an explicit ticket collection, sort and deduplicate canonical ticket references, serialize them as a compact JSON array, and compute the SHA-256 of its UTF-8 bytes. Use `resolve workflow --id goal-tickets-<sha256> --json`. Reordered selectors must resolve to the same journal. Verify that the returned location does not hold another workflow. Preparation reads existing journal events only. Create the journal after the user authorizes execution.

Store append-only YAML events under that workflow's `events/`, with schema `worktree-goal/v1`. Use the receipt protocol's exclusive, no-clobber writes and parent links. Keep projections replaceable. Every event records its unique ID, parent event, timestamp, repository identity, canonical initiative reference (null for an explicit collection), frozen ticket references, workflow store/ref, coordinator session/muxer identity, and event kind.

The first `goal_started` event records the run ID, initial ticket receipt baseline, takeover approvals, per-ticket fix limit, dispatch limit, configured token budget, and associated OMP session/goal ID. The run ID survives coordinator restarts. A new invocation for the same unfinished initiative or exact ticket collection resumes that run; it does not create fresh allowances. A changed collection requires explicit scope approval and reconciliation of existing runs, claims, and consumed allowances before dispatch; a different hash is not permission to reset limits or duplicate work.

Before each mutating phase, append a `dispatch_reserved` event with ticket ref, phase, attempt, consumed receipt refs, exact source commit/tree when available, and remaining allowances. The reservation consumes one dispatch even if launch fails or the process stops before a ticket receipt appears. A `fix` reservation also consumes one fix cycle for that ticket. Link the phase-start receipt in a later `dispatch_observed` event. Preserve failed and unresolved reservations; never reserve a duplicate while a prior dispatch could still be active.

Append `dispatch_reconciled` after validating the phase result and parent completion receipts. A child marker or result receipt alone is not a completed parent phase. Recover a missing parent completion only from verified result, artifacts, validation, and agent shutdown; record the reconciliation without relaunching the child.

Derive consumed allowances from reservations in this run, not from chat memory or replaceable projections. Resume from the original baseline. Refuse dispatch when the cap is reached or the event chain cannot establish the count. An explicit `limits_renewed` event must record user approval, prior consumption, and the new total limits; preserve all history.

Record observed OMP token usage and its session/goal identity in checkpoints. On the same OMP goal, retain its runtime budget/accounting. Before creating a replacement goal, establish prior consumption from saved authoritative OMP accounting and carry forward only the remaining allowance. If exact accounting is unavailable, request explicit budget renewal; a lower-bound snapshot is not proof of remaining budget. Independent child spending is not bounded by this token budget.

Only one coordinator may write for a run. Verify recorded owner liveness through the muxer contract before taking ownership. A live coordinator must be observed or explicitly handed off, not duplicated. An absent or unverifiable owner requires recorded takeover approval before a new owner event. Do not infer ticket ownership from `claimed` alone. Record which ticket workflows the user permits this run to adopt; claiming or changing ownership remains the ticket skill's operation.

Append a checkpoint at pause, blocked, capped, and completion boundaries. Record outstanding dispatches, active agents, latest valid ticket receipts, recovery actions, and accounting evidence. Publish journal events according to the resolved store's rules. A journal write/publication failure blocks further dispatch.

## Projection requirements

`manifest.yaml` MUST contain:

```yaml
schema: worktree-workflow/v2
workflow_id: ABC-123
ticket_ref: https://github.com/owner/repository/issues/42
initiative: example-initiative
event_root: events
artifact_root: artifacts
projection_root: projections
latest_receipt: finish-0031
state: FINISHED
```

Use `null` for `initiative` when no initiative applies.

`projections/pr-draft.md` MUST contain:

- ticket summary;
- problem statement;
- implementation summary;
- changed files;
- validation results;
- review history;
- resolved findings;
- remaining findings;
- latest reviewer verdict;
- merge status;
- links to all supporting receipts and artifacts.

`projections/implementation-log.md` MUST contain:

- implementation and fix receipt history;
- changed files by phase;
- validation results by phase;
- unresolved questions.

`projections/latest-status.yaml` MUST contain:

```yaml
schema: worktree-latest-status/v1
workflow_id: ...
ticket: ...
state: ...
latest_receipt: ...
latest_source_commit: ...
latest_source_tree: ...
latest_review_verdict: SUCCESS|FAILURE|null
open_findings: []
```

## Snapshots and projections

Create versioned draft snapshots under `artifacts/snapshots/`, for example:

```text
artifacts/snapshots/pr-draft-0002.md
artifacts/snapshots/pr-draft-0004.md
```

Regenerate these convenience views after each implementation or fix:

```text
projections/pr-draft.md
projections/implementation-log.md
projections/latest-status.yaml
```

A projection MUST link to the receipts and review artifacts that support it. A later projection MUST NOT remove earlier review history.

## State transitions

The valid sequence is:

```text
CREATED → IMPLEMENTING → IMPLEMENTED → REVIEWING
REVIEWING → REVIEW_FAILED → FIXING → FIXED → REVIEWING
REVIEWING → REVIEW_PASSED → FINISHING → FINISHED
```

Require valid implementation/fix evidence for a new review target, current persisted `FAILURE` findings for a new fix, and a `SUCCESS` receipt covering the current clean source commit and tree for a new merge. These gates do not prohibit recovery of incomplete attempts selected by the shared decision: preserve partial start/fix source and reconcile valid results before choosing the next phase. Invalidate both review verdicts on subsequent source changes. After a verified merge, finish recovery uses the recorded reviewed-source-to-integration mapping; source-worktree removal does not invalidate that durable evidence.
