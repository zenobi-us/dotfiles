---
review_base_commit: a377108e5df4f6eef8c3d259812c2cdab71dd4de
reviewed_commit: a20008e3e548e98ecf568b06d1c762898337bcb3
reviewed_tree: aacf1e028ca5c8c221138b2deeb96d4f00467909
ticket_ref: tracker/tickets/skill-contract-manifests-08-worktree.md
timestamp: 2026-11-22T04:08:21.661Z
title: Independent worktree review
verdict: FAILURE
---

# Worktree review

Verdict: **FAILURE**. Standards: 0 findings. Spec: 2 blocking P2 findings.

## Reviewed identity

Ticket: `tracker/tickets/skill-contract-manifests-08-worktree.md`.
Branch: `feature/skill-contract-manifests-08-worktree`; base: `master`.
Frozen source commit: `a20008e3e548e98ecf568b06d1c762898337bcb3`.
Frozen source tree: `aacf1e028ca5c8c221138b2deeb96d4f00467909`.
Review base commit: `a377108e5df4f6eef8c3d259812c2cdab71dd4de`.
Timestamp: `2026-11-22T04:08:21.661Z`.
Reviewer session: `01a20167-d154-74e6-a4ac-3f443c96d01f`; operation: `382e2c08-d9f4-4db6-95b4-0e2b0bcfd784`.

## Standards

No evidence-backed introduced standards violations found. Reviewed the actual three-dot diff against a377108e5df4f6eef8c3d259812c2cdab71dd4de, including contract declarations, historical identity handling, mutable-view upgrades, delivery integration, and documentation. Applied repository ownership rules, worktree receipt and concurrency rules, skill-contracts requirements, TypeScript guidance, and code-comment guidance. No applicable ADR: the ADR index lists only the unrelated Pi Ink cleanup decision. Baseline code smells did not establish a reportable defect. This was a read-only static review. No build, test, lint, or formatting commands ran, as required.

Independent helper: `26f54a2b-43a5-4f5d-b1f3-080bd63d071e`. Its typed result was verified and acknowledged.

## Spec

Two hard specification findings; no heuristic smells reported. New v2 phase starts remain writable without retained authorization. Mutable-view upgrades do not bind the contract family to its canonical filename. The diff otherwise declares owned contracts, references external owners, introduces current wire identities, and routes historical receipt reads through shared validation. Reviewed the actual frozen diff and relevant producer, recovery, explorer and upgrade paths. No verification commands, builds, tests, lint or formatters were run, as assigned. Runtime verification remains with the parent. No finding treats missing base-owner manifests as a source change.

Independent helper: `4f8c8620-7fb8-4aaf-9bf3-b35de1a65378`. Its typed result was verified and acknowledged.

### SPEC-1: Fresh workflows can still emit historical v2 receipts

Severity: P2; blocking specification violation.
Location: `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/phase-context.ts:14`.
ADR: NO ADR: the ADR index contains only the unrelated Pi Ink cleanup decision; this requirement comes from the initiative.

The current writer can start a brand-new workflow with schema: worktree-receipt/v2. A phase-context/v1 with receipt_schema v2, phase-start and parent_receipt null needs neither a retained parent nor an assigned historical handoff. Only v1 receipts receive that restriction. The new integration fixture explicitly uses this path. This leaves old production available for new executions, contrary to the documented retained-handoff exception. Spec: ‘Migrate schema to schemaVersion by contract family ... Update producers, validators, consumers, examples, and guidance together.’

Required change: Require v3 for new starts and executions. Limit v2 production to validated retained authorization/handoffs and necessary reconciliation of historical attempts. Keep historical reads unchanged.

Runtime evidence: Actual write-result.ts accepted a fresh v2 phase-start with parent_receipt null and no delivery context. It persisted schema: worktree-receipt/v2; inspect.ts reported valid history and takeover recovery.

Validation command: `After adding a regression for rejected fresh v2 starts and accepted retained v2 handoffs: mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts`.

### SPEC-2: Mutable views accept the wrong contract family

Severity: P2; blocking specification violation.
Location: `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/view-contracts.ts:44`.
ADR: NO ADR: the ADR index contains no worktree contract decision; the ticket and declared upgrade procedure define this boundary.

mutable() checks the filename and workflow ID but not the contract family. A valid latest-status/v1 document stored as manifest.yaml passes mutable(), validation and conversion, so write-view --kind manifest upgrades it to latest-status/v2 and updates it successfully. The reverse mismatch also passes. Existing-file handling in write-view.ts lacks the family check used during initialization. Spec: ‘Validate artifact content against its declared source contract’; the owning procedure further requires ‘Validate the exact source contract and path’. Wrong-family artifacts must fail before mutation.

Required change: Bind manifest.yaml to worktree-workflow and projections/latest-status.yaml to worktree-latest-status inside the owner path validator, covering both write-view and shared bulk upgrades. Reject mismatches without changing bytes.

Runtime evidence: Actual write-view.ts --kind manifest accepted latest-status/v1 in manifest.yaml, persisted latest-status/v2, and changed state. Reverse swap also succeeded. Both cases reproduced in two isolated repositories.

Validation command: `After adding both swapped-family rejection cases: mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/view-contracts.test.ts`.

## Verification

- **Command:** `mise exec -- bun /tmp/review-382-smoke.ts /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-08-worktree`. Exit 0. Independent owning-command scenarios reproduced SPEC-1 and both SPEC-2 directions. Current v3 start, historical v2 inspection/recovery, both valid view upgrades, read-only receipt bytes and rejected-update bytes also passed. Temporary fixtures removed.
- **Command:** `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts`. Exit 0. 168 pass, 0 fail; 971 expect calls across 11 files. One earlier test invocation lost its result when the Eval worker reached its own deadline; this direct invocation supplied observed verification.
- **Command:** `/home/zenobius/.omp/agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts validate --skill /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-08-worktree/mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree`. Exit 0. Public manifest validation resolved produced/accepted definitions and upgrade procedures from /tmp.

Tracked workflow history check: `git diff --exit-code a377108e5df4f6eef8c3d259812c2cdab71dd4de...a20008e3e548e98ecf568b06d1c762898337bcb3 -- workflows` exited 0. Frozen HEAD/tree match the handoff and the worktree is clean. Current master is `0fdc33386424a4c67c6236514c1f9e9a685256ea`.

Both axes completed before the verification run. Existing tests pass but do not reject the reproduced cases. No source, permanent test, configuration, generated view, or tracker record was changed.

## Moving-base compatibility

The product-path comparison from the review base to current master had no changes in agent-core, developer, matt-pocock, or bun.lock at review time. Metadata publication on master does not invalidate this frozen source review. Preserve overlapping repair/hc-spawn streams. This review does not authorize integration or approve later base changes.

## Helper lifecycle

Both owned helper terminals were closed after typed-result acknowledgement. Standards process shutdown is confirmed. The Spec helper's OMP process and LSP service stopped. Its registered daemon broker PID 625425, boot 1093b557-9bca-45b2-a143-4217cd820f51, start ticks 2544998 remains running. No documented shutdown command was available. Do not kill a potentially shared broker without scoped authority. Cleanup is pending; this does not change the source verdict. Parent owns closure of this reviewer terminal.

## Changed scope

- **Path:** `bun.lock`.
- **Path:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/package.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/CHANGELOG.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/SKILL.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/contracts.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/concurrency.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/coordination-v1.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/coordination-v2.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/goal-v1.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/goal-v2.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/inspection-error-v1.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/inspection-v1.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/integration-v2.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/latest-status-v1.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/latest-status-v2.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/phase-context-v1.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/phase-context-v2.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/pr-draft-v1.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/receipt-v1.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/receipt-v2.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/receipt-v3.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/view-result-v1.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/view-upgrade.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/workflow-v2.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/workflow-v3.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/fix.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/review.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/start.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/receipts.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/contract-identity.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/coordination.test.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/coordination.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/goal-contract.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspection.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/phase-context.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/receipt-contract.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/receipt-diagnostics.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/view-contracts.test.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/view-contracts.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-result.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-view.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/types/versioned-imports.d.ts`.

## Affected contracts

- **Contract:** `worktree-receipt/v1`.
- **Contract:** `worktree-receipt/v2`.
- **Contract:** `worktree-receipt/v3`.
- **Contract:** `worktree-phase-context/v1`.
- **Contract:** `worktree-phase-context/v2`.
- **Contract:** `worktree-goal/v1`.
- **Contract:** `worktree-goal/v2`.
- **Contract:** `worktree-inspection/v1`.
- **Contract:** `worktree-coordination/v2`.
- **Contract:** `worktree-workflow/v2`.
- **Contract:** `worktree-workflow/v3`.
- **Contract:** `worktree-latest-status/v1`.
- **Contract:** `worktree-latest-status/v2`.
- **Contract:** `worktree-pr-draft/v1`.
- **Contract:** `tracker-ticket/v2`.
- **Contract:** `result-delivery/v2`.
- **Contract:** `shared-context locations`.
- **Contract:** `yaml@2.8.1`.

## Integration checks

- **Command:** `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts`.

## Axis totals

Standards: 0 findings. Spec: 2 findings; worst severity P2. Verdict: FAILURE.

