---
title: Tracker contract cutover implementation
type: Report
---

# Tracker contract cutover

## Ticket and source

Ticket: `tracker/tickets/skill-contract-manifests-04-tracker.md`. Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.

Source branch: `feature/skill-contract-manifests-04-tracker`. Base: `master`. Source commit: `b062761b4a31681f4e826c4e3dad8770e8944607`. Source tree: `c741f5a04985243460a9677166ab9d049d836e9b`. Source status was clean after the atomic commit.

## Problem

Tracker-owned formats used inconsistent identity fields and did not declare their accepted contracts or safe conversion paths. Readers, writers and result consumers needed one coordinated field cutover without changing immutable history.

## Implementation

Declared tracker-owned record, result, migration and setup contracts, with current schemaVersion outputs and explicit retained historical readers. Reused shared manifest resolution and safe/bulk upgrade policy. Added authorized owning update/upgrade commands with canonical kind/identity and complete membership preflight, raw authored-byte preservation, independent partial outcomes and rejected-byte equality. Preserved immutable migration plan/event bytes and hash chains. Coordinated normal tracker discovery, explorer consumers and tracker result validation/delivery. Setup upgrades run through shared policy only during authorized init; plan/check remain read-only. Updated owner guidance, examples/templates and required plugin/catalogue versions. No live tracker/workflow content was converted, and no merge, push, ticket completion or formal worktree review was performed.

The owning `records.ts update` and `records.ts upgrade` commands perform tracker preflight before shared persistence. The internal adapter is not a public tracker entrypoint. Only title changes apply to initiatives; tickets also support scalar work status and triage changes. Structural membership operations retain their existing coordinated-transaction authority.

Historical unapplied v1 migration plans are validated but cannot create new historical-format output; a newly reviewed v2 plan is required. Already-applied v1 plans remain readable and idempotent. Independently owned result-delivery transport and worktree receipt formats remain unchanged. The separate receipt stream and frozen repair source were not integrated or edited.

## Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/data.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/scripts/delivery.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/scripts/delivery.ts`
- `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/assets/tree/alignment/docs/agents/issue-tracker.md.jinja`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/contracts.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/initiative-legacy-v1.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/initiative-v1.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/initiative-v2.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/migration-plan-v1.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/migration-plan-v2.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/migration-v1.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/migration-v2.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/record-upgrade.md`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/result-v1.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/result-v2.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/ticket-legacy-v1.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/ticket-v1.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/ticket-v2.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/result-contract.md`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/schema.md`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/answers-v1.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/answers-v2.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/error-v1.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/result-v1.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/state-v1.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/state-v2.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/upgrade-v1-v2.md`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup/cli.md`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/stores/local-markdown.md`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/tasks/initiative.md`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/tasks/migrate.md`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/usage.md`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/dep-tree-markdown.test.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/dep-tree-markdown.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-markdown.mq`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-migration.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-schema.test.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-schema.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-upgrade.test.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-upgrade.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.test.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/setup.test.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/setup.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/validate-result.test.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/validate-result.ts`

## Validation

| Command | Observed result |
| --- | --- |
| `mise exec -- bun test mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/scripts` | 142 tests passed across 11 files; 789 assertions. Includes tracker normal graph discovery, current/historical contracts, actual CLI migration/update/bulk and result content validation, setup state safety, rejected byte equality and immutable history. |
| `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts` | 33 tests passed; 288 assertions. Current tracker-result/v2 artifact delivery, independent worktree receipt transport and inherited final-result isolation passed. |
| `mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/data.test.ts --test-name-pattern versioned|initiative links` | 5 tests passed; 24 assertions. Actual explorer loader reads retained v1/current v2, rejects unknown/dual/invalid membership, and preserves record bytes. |
| `mise exec -- bun /tmp/tracker-contract-typecheck/node_modules/typescript/bin/tsc -p /tmp/tracker-contract-typecheck/tsconfig.json` | Scoped strict TypeScript check passed for tracker scripts/tests and imported consumer/shared modules. Used isolated TypeScript 5.9.3, Bun/Node types and mappings to the declared pinned dependencies. |
| `mise exec -- bun /tmp/tracker-contract-smoke.ts` | Actual shebang records CLI: historical read/check left bytes unchanged; authorized mutation persisted current-only schemaVersion plus requested status and preserved authored comments/unknown metadata/direct blockers; explicit bulk returned partial/nonzero and preserved rejected unknown-version bytes; normal dependency discovery and manifest validation passed. Disposable fixture and smoke script removed. |
| `mise exec -- bun /tmp/tracker-setup-smoke.ts` | Actual setup CLI/Copier: historical answers stayed unchanged; plan/check preserved historical state bytes; authorized init staged declared shared upgrades and persisted current-only state; managed-file membership and directory order stayed equal; unknown authored state rejected unchanged. Disposable fixture and smoke script removed. |
| `mise exec -- bun /tmp/tracker-migration-smoke.ts` | Actual migrate plan/apply/check: planning left source bytes unchanged; apply produced current record/plan/events; check preserved event bytes. Retained applied v1 plan/event fixture passed owning migrate check and idempotent apply with byte-identical plan, events and source. Disposable fixture and smoke script removed. |
| `mise run checks:agent-bundle-versions -- check --staged` | Required staged plugin versions and marketplace validation passed: agent-core 0.1.34, developer 0.2.64, matt-pocock 0.1.12. |

Smoke scripts used disposable repositories. Their fixtures and scripts were removed. Isolated dependency links were removed from the source. No manual evidence run was created.

## Validation limit

The initial broad run exposed two failures in unchanged explorer expectation paths: `data.test.ts:296` (recorded attempts on invalid parent history) and `data.test.ts:609` (an unrelated missing blocker in a scoped snapshot). These behaviors were outside this schema cutover. The assertions and implementation were left unchanged. A separate baseline run was not performed. The scoped owner, delivery and compatibility checks below passed.

## Review history

Independent implementation self-checks covered standards and specification. Three mutation findings were fixed: initiative-only field limits, selected kind/path validation, and omitted direct-child membership. Both self-check axes reported no remaining findings after source/guidance inspection. The targeted owning CLI regressions passed. These self-checks are not the formal worktree review phase.

Resolved findings: all three self-check findings. Remaining scoped findings: none. Latest formal reviewer verdict: not available; formal review remains the parent workflow's next gate.

## Merge and publication

Source commit only. No merge, push, ticket completion, storage migration or metadata commit was performed. The parent owns review, lifecycle completion and publication of workflow metadata.

## Open questions

No implementation decisions remain open. Preserve the two unrelated broad-suite failures for separate triage.

## Supporting records

- **Start receipt:** [start-0001](../../events/start-0001.yaml).
- **Implementation receipt:** [implementation-0002](../../events/implementation-0002.yaml).
- **Prerequisite receipt:** `workflows/skill-contract-manifests-03-safe-upgrades/events/implementation-0002.yaml`.
- **Child result:** file:///var/home/zenobius/.local/state/result-delivery/runs/eea5b9a0-3a8c-4b85-a281-e6a1a9d340ee/result.json; payload SHA-256 `e9f35d4cebf451ccd8a84f70970b93f8a65812a0971090b97c47bd0aa80ed9e9`; file SHA-256 `09c1753f55469fa827c3cee0ca8e445899d505b2f6af6188b37e24b71c7dad52`.
- **Child result:** file:///var/home/zenobius/.local/state/result-delivery/runs/199c1d8a-c9c2-4f2e-ba6f-75be6cc72838/result.json; payload SHA-256 `21b036ed3815564c0d04d2035a9f9e0fc35c1d0987c0de71c4fb681e5bd514a1`; file SHA-256 `a8f29aec74ca4f09ca765e79ac499e02d2ab60fc897c027cea0058ece173be18`.
- **Child result:** file:///var/home/zenobius/.local/state/result-delivery/runs/3e789824-d56d-41f3-978b-323dc9496ce8/result-revision-1.json; payload SHA-256 `0b4bbe2dcc309163318574fd90abeb827083f419772c45cad4b4cbd1266bb59e`; file SHA-256 `57cd047cd12d169b8a2ec46e30696f0ff39f3808d04a1e1b8db31c18c3c208ca`.
- **Child result:** file:///var/home/zenobius/.local/state/result-delivery/runs/04b64cb3-5878-4d3e-9cd8-f632b790d178/result-resolution-1.json; payload SHA-256 `721cb20cefae73f3603fe14b73d1da00a49a63fb3c855643130aaa9fa92e330e`; file SHA-256 `7742233cf0453113b4436f457fefea0fc5282c1b172f20c5035456986e6178dc`.
- **Child result:** file:///var/home/zenobius/.local/state/result-delivery/runs/68276146-f1cd-44fd-b21e-a48d75b99fcd/result-resolution-2.json; payload SHA-256 `352b943ea5ec293eb1942ac7752c4815a84b4bd1a3d89adc9edbd07b429eaf91`; file SHA-256 `65c4f801386ff7df4134570b12e0bb9479d6ec50484129f5df3ae68f99e99602`.

