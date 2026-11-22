# Independent worktree review 0011

## Verdict

FAILURE. Three blocking findings remain. Review completed; no source fixes or integration approval.

## Identity

Timestamp: 2026-11-22T05:18:15.701669+00:00.
Canonical ticket: `tracker/tickets/skill-contract-manifests-07-shared-context.md` (`local-markdown`).
Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.
Source branch: `feature/skill-contract-manifests-07-shared-context`. Base branch: `master`.
Frozen source commit: `3a70f87bac3f44cd6ceb41cebd0887c11ebdbb59`.
Frozen source tree: `42436c397dfe6d48d33d8c592d25283cdf94cd38`.
Fixed review base: `e89668ebab19e7b40b7cb03edcf59a2c2e3ba0ba`.
Source: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-07-shared-context`.
Publication checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`. Both checkouts share `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/.git`.
Workflow: repository store, `workflows/skill-contract-manifests-07-shared-context`.

## Comparison and scope

Inspected the fixed-base two-dot comparison and the ticket-specific three-dot comparison. The latter contains 19 files.
The large reverse workflow/muxer differences in the two-dot comparison are base-only advancement, not source defects.
Reviewed all four ticket commits: `2d577903`, `47a5b40e`, `792e4912`, `3a70f87b`.
Also inspected incremental fixes from `2d5779034ef9f36b24356632a327070ae61daea0` to frozen source.

- **Path:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/SKILL.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/contracts.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/changelog.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/configuration-upgrades.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/contracts.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/ingest.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/layout.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/README.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/config.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/contracts.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/layout.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test/contracts.test.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test/shared-context.test.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/references/upgrades.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.ts`.

## Affected contracts and integration hazards

- **Contract:** `shared-context-routes/v2`.
- **Contract:** `shared-context-routes/v3`.
- **Contract:** `shared-context-layout/v1`.
- **Contract:** `shared-context-layout/v2`.
- **Contract:** `shared-context-config/v1`.
- **Contract:** `shared-context-project/v1`.
- **Contract:** `shared-context-source/v1`.
- **Contract:** `shared-context-index/v1`.
- **Contract:** `shared-context-resolution/v1`.
- **Contract:** `skill-contract-manifest/v1`.
- **Contract:** `skill-contracts safeUpgrade/bulkUpgrade`.
- **Contract:** `shared-context resolution consumers: worktree and tracker`.
- **Contract:** `skill-contracts read-only complete preflight API`.
- **Contract:** `skill-contracts canonical filesystem target and lock identity`.

The read-only inspector reported valid history, no receipt diagnostics, and exact clean source identity.
Its ownership classifier remained unknown; the supplied review-start authorizes this child under the retained parent.
No takeover occurred. Prior fixer shutdown is recorded in fix-complete-0009.
Cross-initiative inventory remains incomplete because of stale linked ticket copies, unrelated historical goal diagnostics, and a missing prototype checkout.
The parent retains ownership. No global reservation or unrelated record was changed.
Shared upgrader and resolution changes affect tracker/worktree consumers even when source paths do not overlap.
Current-base integration still requires combined consumer checks. This source verdict does not approve newer base code.
No applicable ADR exists. The ADR index lists only the unrelated Pi Ink cleanup trust boundary.

## Standards

Fresh research session: `690a9822-c65b-4e06-bcfe-b24ca6be0a93`. One blocking finding.
Reviewed repository rules, contract-owner rules, complete relevant changes, and shared API consumers.
Heuristic maintainability concerns are not blockers.

### STD-001 — P1 — NO ADR

File: `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.ts:43`.

Canonicalizing the internal target changes successful UpgradeResult.artifact to the physical path. The tracker bulk consumer still matches results to lexical selections at record-migration.ts:300-308. An ancestor alias therefore causes a command failure after persistence and hides the changed record and required publication. This breaks the coordinated consumer cutover requirement.

Consumer-visible evidence: An isolated shared-store ancestor symlink and valid tracker-ticket/v1 selected through its alias: fixed-base command exited 0 with publication required. Reviewed command exited 1: undefined is not an object (evaluating 'result.status'). The physical ticket nevertheless changed to tracker-ticket/v2; the returned error had changes:null and publication:null.

Required change: Keep canonical lock/check/write targets, but preserve the resolved caller path in public artifact results; or migrate every result/projection consumer to one canonical identity before persistence. Preserve successful and failed item reporting.

Validation command:

```sh
records.ts upgrade --repository "$REPOSITORY" --shared-context-base "$ALIASED_SHARED_BASE" --artifacts "$SELECTION_JSON"
```

## Spec

Fresh research session: `0ca6f8a9-dead-4077-94c4-8e0de6952838`. Two blocking findings.
Reviewed original ticket acceptance criteria, parent initiative decisions, complete relevant changes, and incremental fixes.
The findings below were independently confirmed through isolated owning-command fixtures after both research axes completed.

### SPEC-01 — P1 — NO ADR

File: `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts:551`.

The new resolution schemaVersion breaks retained tracker migration plans. validatePlanPaths compares fresh route objects to immutable plan.routes by exact JSON equality at record-migration.ts:511. Retained plans lack the new field. Historical ID reconstruction at line 524 also uses a fresh resolution object. The ticket requires producer/consumer cutover; the initiative requires historical readers without rewriting immutable history.

Consumer-visible evidence: An exact fixed-base owner/consumer archive generated and applied tracker-migration-plan/v2 8897a433400f4b41bd88447a for an isolated standalone ticket. Fixed-base migrate check exited 0 with contentVerified:true. Reviewed migrate check and idempotent apply both exited 1 with Plan roots or routes do not match fresh shared-context resolution. Routes and stored plan did not change. The nested historical route objects have no schemaVersion.

Required change: Update tracker migration readers to compare retained resolution snapshots under their historical shape. Preserve original plan bytes, event hashes, property ordering, and immutable IDs. Keep current versioned resolution objects in new plans.

Validation command:

```sh
records.ts migrate check --repository "$REPOSITORY" --shared-context-base "$SHARED_BASE" --migration "$PRE_CUTOVER_PLAN_ID"; records.ts migrate apply --repository "$REPOSITORY" --shared-context-base "$SHARED_BASE" --plan "$OLD_PLAN" --acknowledge-writer-safety
```

### SPEC-02 — P2 — NO ADR

File: `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts:352`.

Route migration does not preserve equivalent historical project metadata. writeProjectIdentity compares the raw stored origin to a suffix-free HTTPS string, although the existing reader accepts the same canonical remote with .git. It rewrites authored bytes or rejects extra authored fields. The ticket requires preservation of historical records. The recovery-only regression does not exercise this writer.

Consumer-visible evidence: With origin https://github.com/example/contracts.git, a matching historical identity { "origin": "https://github.com/example/contracts.git" } was rewritten to {"origin":"https://github.com/example/contracts"}. migrate sources --to shared exited 0. With an additional authored:"keep" property, the same migration exited 1: Authored project metadata requires an explicit identity recovery decision. Both identities describe the same canonical project.

Required change: Validate existing project metadata and compare canonical remote identity. If it matches, preserve exact existing bytes. If it differs, reject without replacement. Apply this rule to initialization and route migration as well as recover-identity.

Validation command:

```sh
shared-context/scripts/shared-context/cli.ts migrate sources --to shared  # isolated repository with matching historical .context-project.json; compare identity bytes, then repeat with authored extra metadata
```

## Prior fixes and coverage

The seven prior finding IDs are not carried forward as proof of defects.
The scoped suite and source review confirm explicit route precedence after copied alignment instructions, identity creation before empty-route commit, and complete conversion preflight before copies.
The suite also covers duplicate/null/future YAML identities, typed source/index metadata, external source preservation, immutable ancestor aliases, canonical locks, and repeated identity recovery.
The source contract now appears in produces. Ingest and layout guidance declare the versioned provenance template.
No separate ingest engine changed; its producer is the owning skill procedure. This review did not repeat the reported ingest handoff smoke.
No competing tracker or workflow contract definitions were added.
SPEC-02 concerns migration/initialization identity handling, not the corrected recovery-only path.

## Validation

- **Command:** `mise exec -- bun test ./mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test ./mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.test.ts`. 117 passed; 0 failed; 494 assertions across 5 files. Exact 42-file owner archive; all SHA-256 comparisons matched frozen source. Real Ajv 8.20.0, YAML 2.9.1, Crust core 0.0.19/plugins 0.1.2 installed only outside source. Qualified package aliases were outside source.
- **Command:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts resolve ticket --id skill-contract-manifests-07-shared-context --json`. Actual frozen source entrypoint produced shared-context-resolution/v1 and the correct repository ticket location.
- **Command:** `skill-contracts/scripts/router.ts validate --skill <absolute frozen shared-context skill>`. Actual source command resolved all nine owned definitions and both declared upgrade procedures.
- **Command:** `fixed-base records.ts migrate plan/apply/check, then reviewed records.ts migrate check/apply against the same applied plan`. Baseline succeeded; both reviewed commands rejected an unchanged retained plan. SPEC-01 confirmed.
- **Command:** `fixed-base and reviewed records.ts upgrade through an ancestor-aliased shared-store root`. Baseline returned committed item and publication requirement. Reviewed command failed after persisting v2 bytes and omitted persistence/publication. STD-001 confirmed.
- **Command:** `reviewed shared-context cli.ts migrate sources --to shared with equivalent historical identity, with and without authored extra metadata`. Observed exact byte rewrite and avoidable authored-metadata rejection. SPEC-02 confirmed.
- **Command:** `LSP references for preflightUpgrade`. Unavailable: TypeScript language server initialization failed because the workspace has no valid TypeScript installation. No typecheck claimed; direct caller reads used.
- **Command:** `git status --porcelain=v1; git rev-parse HEAD HEAD^{tree}; git branch --show-current`. Before and after review: clean source at frozen commit/tree and requested branch. Publication writes use the separate designated context checkout.

The first isolated test run could not resolve version-qualified Ajv imports. External package aliases resolved that dependency issue.
An unanchored Bun path filter also included baseline tests: 209 passed across nine files. The final `./`-anchored command selected only the intended 117 tests.
No tests, builds, lint, or formatters ran while either research axis was active.
All mutation scenarios used disposable stores. No live configuration, source, tracker, or historical workflow record changed.
Reproduce findings with the stated fixture conditions and owning commands; the disposable fixture paths are not durable evidence artifacts.

## Resource evidence

Both axis results used typed `review-axis/v1` transport, passed envelope/hash verification, and were acknowledged.
The Standards result hash is `94ca3aa20d0e50c772f8d31812b3b6d026e00deee1175f77de0ff74fd7b7be16`.
The Spec result hash is `d4a5eeaca6e65cf9395540fab43c1278f54dc85b018fcac7496ad655619c699a`.
Both completion signals were completed, sequence 2. Owned terminals were killed and removed; the application inventory confirmed their absence.
Resource observation at 2026-11-22T05:14:44.974Z confirmed Standards PID 931093 stopped, start ticks 2951283.
Observation at 2026-11-22T05:14:45.446Z confirmed Spec PID 931027 stopped, start ticks 2951282.
Both resource reports state shutdown confirmed. Boot identity: `1093b557-9bca-45b2-a143-4217cd820f51`.
No phase services were started. Disposable dependency archives and stores were removed before handoff.
The parent owns this reviewer session's closure, all commits, tracker comments, projections, and phase completion.

## Inputs and next action

Consumed review-start-0010, fix-0008, fix-complete-0009, and artifacts/snapshots/pr-draft-fix-0008.md through the designated context checkout.
The previous failed review remains immutable history for its original source.
Standards: one finding, worst P1. Spec: two findings, worst P1.
The parent must dispatch fixes for current findings, then obtain a new independent review of the resulting exact clean source.

