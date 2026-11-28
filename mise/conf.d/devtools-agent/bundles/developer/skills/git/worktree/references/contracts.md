# Worktree contract boundaries

The worktree owner declares contracts in `contracts.json`. Validate it with the installed skill-contracts router before relying on definition discovery. Definitions use skill-relative paths, including references to tracker, delivery, and shared-context owners. Do not copy their definitions. The owning validators remain authoritative for content and provenance.

## Current and historical records

| Record | Current output | Historical input | Rule |
| --- | --- | --- | --- |
| Receipt/result | `schemaVersion: worktree-receipt/v4` | `schema: worktree-receipt/v1` or `v2`; `schemaVersion: worktree-receipt/v3` | Immutable; mixed parent chains remain readable |
| Phase authorization | `schemaVersion: worktree-phase-context/v2` | `schema: worktree-phase-context/v1` | v2 authorizes v4; retained v3 handoffs remain v3; retained v1 keeps its assigned v1/v2 handoff |
| Coordinator event | `schemaVersion: worktree-goal/v2` | `schema: worktree-goal/v1` | Immutable; preserve IDs, parents, timestamps and hashes |
| Inspection | `schemaVersion: worktree-inspection/v1` | None | Read-only result; error uses `worktree-inspection-error/v1` |
| Coordination | `schemaVersion: worktree-coordination/v2` | v1 reports are retained observations | New observations do not upgrade saved reports |
| Manifest | `schemaVersion: worktree-workflow/v3` | `schema: worktree-workflow/v2` | Mutable generated view |
| Latest status | `schemaVersion: worktree-latest-status/v2` | `schema: worktree-latest-status/v1` | Mutable generated view |
| PR draft snapshot | `schemaVersion: worktree-pr-draft/v1` frontmatter | Historical prose | Immutable; prose remains prose, not implicit current structured input |

Exactly one identifier field is valid. Unknown explicit versions, both fields, and absent identifiers fail interpretation-dependent operations. Do not infer a version from numeric ordering. Integration plans keep their existing `worktree-integration/v2` format; the receipt change does not change integration semantics or rewrite saved plans.

## Bounded receipt contract

V4 receipts use the size and artifact policy in [Worktree receipts](receipts.md#bounded-receipt-content). `receipt-size.ts` validates bounded metadata; `write-result.ts` verifies artifact bytes before event publication and delivery. V1-v3 events remain immutable and readable, without retroactive limits. No receipt upgrade is authorized.

| Boundary | Owner and definition | Validator | Compatibility |
| --- | --- | --- | --- |
| Receipt/event and delivered result | Worktree; `contracts/receipt-v4.json` | `receipt-validation.ts`, `receipt-contract.ts`, `receipt-size.ts`, parent diagnostics and writer artifact checks | New output v4; retained v1-v3 readers and assigned continuations; no conversion |
| Phase authorization | Worktree; `contracts/phase-context-v2.json` | `phase-context.ts` | v2 selects v4; retained contexts preserve assigned versions |
| Artifact reference inside receipt | Worktree; receipt-v4 reference definition | `receipt-size.ts` and `write-result.ts` | Existing files only; metadata and checksum, never embedded bytes |
| Log, image and review artifact bodies | Their existing media formats | Existing evidence/review readers | Opaque file bytes; no new record identity |

Other contract families and mutable-view upgrade procedures are unchanged.

## Publication

Resolve the workflow from the publication checkout with shared-context. Use the absolute installed `scripts/write-result.ts` from that checkout to record current parent starts and child results. New launch contracts request `worktree-receipt/v4`. Use phase-context v2 with `receipt_schema: worktree-receipt/v4`. A retained assigned v2 child context continues through phase-context v1 and the unchanged v2 handoff. Do not upgrade delivery merely because current product output changes. The manifest lists v1/v2 receipt production only for retained handoffs and historical reconciliation; acceptance alone does not select an output. Generated v2 child results require a retained v2 phase-start, matching phase and assigned handoff. V2 parent output can close a retained result or failed/blocked missing-result attempt, or continue an existing finish checkpoint/result. New phase starts always use v3, even after historical parents. Full v1 envelope repairs still require their retained authorization.

Use `scripts/inspect.ts <canonical-ticket-ref> --json` for inspection and recovery. CLI, recovery, and explorers share the same validated history. Inspection never upgrades an artifact or creates workflow directories. A recommendation does not authorize a phase.

Before an authorized generated-view mutation, use the absolute installed `scripts/write-view.ts --repository <publication-checkout> --id <workflow-id> --kind manifest|latest-status --input <JSON-file>`. Run it from the publication checkout. For an absent view, supply the complete current view. For an existing view, supply only the generated fields to change. The manifest permits `state` and `latest_receipt`; latest-status also permits source commit/tree, review verdict and open findings. This operation returns `worktree-view-result/v1`; it does not fill a phase result target.

The shared safe-upgrade operation validates source, destination, and preservation before writing. The owner preserves YAML comments and all unknown data. It rejects aliases, explicit tags, unsupported numbers, unknown fields in update requests, and immutable paths. A rejected update preserves original bytes. Read-only access does not call this operation. Explicit bulk upgrades use the shared router with `file:scripts/view-contracts.ts`, never event files.

Create new PR draft snapshots with mq, exclusive writes and frontmatter containing `schemaVersion: worktree-pr-draft/v1`, `workflow_id`, `receipt_id`, `source_commit` and `source_tree`. Include implementation summary, changed files, validation results, open questions, and consumed/produced canonical references in the body. Copy the current snapshot into the replaceable PR draft projection. Ordinary implementation-log prose has no independent schema. Never stamp or rewrite historical reviews or snapshots.

## Retained completion and resolution inputs

A retained v2 `start` completion names an `implementation` phase-result. The owning writer uses the same completion/result mapping as receipt diagnostics. Fresh v2 starts, unassigned results and mismatched phases remain rejected.

`shared-context-resolution/v1` is accepted, not produced. Its authoritative definition is the shared-context owner’s `references/contracts.md`, extending `layout.md`. The adopted definition is byte-identical to commit `3a70f87bac3f44cd6ceb41cebd0887c11ebdbb59` (SHA-256 `9523366fbe7c608d248a131604cab4adb456879cb283904b336a45aafbc090ae`), under the same owner path. This definition-only adoption does not adopt or approve the owner runtime.

At publication boundaries, `context-resolution.ts` accepts tagged v1 output or one retained unversioned shape with neither identity field. Both require the same valid kind, adapter, store, absolute contained paths, reference and publication. Explicit unknown or mixed identities fail. The reader projects location fields separately in memory for comparison. It never stamps, sorts or rewrites retained snapshots; their bytes and hashes remain authoritative. Current typed producer output must remain v1. Legacy input support does not authorize legacy production.
