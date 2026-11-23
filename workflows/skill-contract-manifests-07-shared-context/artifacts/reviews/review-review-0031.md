# Independent review

## Verdict

SUCCESS. No blocking finding remains. Standards has two new nonblocking P3 heuristics. Spec has no findings. Retained STD-0018-01 remains nonblocking.

## Identity

Timestamp: 2026-11-23T05:17:27.508Z.

Canonical ticket: `tracker/tickets/skill-contract-manifests-07-shared-context.md`.
Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.
Source branch: `resolve/skill-contract-manifests-07-shared-context-finish`. Base branch: `master`.
Frozen source commit: `109f3e0ebf668a6ab9d0002af19c906da4298c94`.
Frozen source tree: `290dad56a125ae56be029fa773889ef054d237da`.
Frozen review base: `6b64c4aaad9ebc97783aaf52d4a182e38b7eef5f`.

This attempt reviews the entire ticket diff, not only conflict resolution. Command:

`git diff 6b64c4aaad9ebc97783aaf52d4a182e38b7eef5f...109f3e0ebf668a6ab9d0002af19c906da4298c94`.

Ticket commits: 2d577903, 47a5b40e, 792e4912, 3a70f87b, 58e472f0, 1101dfb2, fc4bf19e, 79250a53, 109f3e0e. Candidate parents are 79250a53fad0780ac51d40f17121b50d8d76ef6f and b31360101dafd23ae07fe82dc3813973a56935e8. The source and publication checkouts share the same physical Git common directory.

## Scope

- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/SKILL.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/contracts.json`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/changelog.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/configuration-upgrades.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/ingest.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/layout.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/README.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/config.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/contracts.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/layout.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test/contracts.test.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test/shared-context.test.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/references/upgrades.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/.claude-plugin/plugin.json`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/tasks/migrate.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-migration.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.test.ts`

## Affected contracts

- **Contract:** `shared-context-routes/v2`
- **Contract:** `shared-context-routes/v3`
- **Contract:** `shared-context-layout/v1`
- **Contract:** `shared-context-layout/v2`
- **Contract:** `shared-context-config/v1`
- **Contract:** `shared-context-project/v1`
- **Contract:** `shared-context-source/v1`
- **Contract:** `shared-context-index/v1`
- **Contract:** `shared-context-resolution/v1`
- **Contract:** `skill-contracts safeUpgrade/bulkUpgrade public artifact identity and canonical targets`
- **Contract:** `tracker-migration-plan/v2 historical resolution snapshots and immutable IDs`
- **Contract:** `shared-context resolution consumers: tracker and worktree`
- **Contract:** `shared-context-index/v1 logical identity and producer/read validation`
- **Contract:** `advancing-base bulkUpgrade consumers including backlog-grooming`
- **Contract:** `worktree receipt v3, phase context v2, mutable view upgrades and shared-context-resolution/v1 consumers`
- **Contract:** `generated bundle versions and approved source-candidate ancestry`

## Standards

Standards: PASS with two non-blocking P3 heuristics. No documented hard-standard violation found. Reviewed every hunk of the exact three-dot diff and its nine commits, plus pinned review-inputs-0030.json and owner contract guidance. Duplicate safety checks could drift between preflight and commit. Positional current/legacy arrays obscure configuration family relationships. Neither finding establishes incorrect behavior or blocks acceptance. Required changes: none; optional refactors appear in findings. Spec review was excluded. No builds, lint, tests, or formatters ran, as instructed; validation commands are recommendations for the parent.

### STD-0031-01 — P3, nonblocking, NO ADR

File: `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.ts:89`.

Possible Duplicated Code: Both preflightUpgrade and safeUpgrade repeat lstat, regular/singly-linked checks, UTF-8 round-trip checks, and owner.mutable checks.

Rule: code-review smell baseline: Duplicated Code; repeated logic should share one implementation.

Required change: Optional: extract a private artifact-reading and validation helper. Keep locking and final identity rechecks in safeUpgrade.

Validation command: `mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.test.ts mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test/contracts.test.ts`.

This is a code-review smell heuristic. No documented hard rule makes it a blocker. Static inspection confirms the cited code. The affected suite passed.

### STD-0031-02 — P3, nonblocking, NO ADR

File: `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/contracts.ts:7`.

Possible Data Clumps / Mysterious Name: Parallel current/legacy arrays encode routes and layout through positions 0 and 1; validation, family lookup, and conversion depend on that order.

Rule: code-review smell baseline: Data Clumps and Mysterious Name; group related fields and use names that reveal their meaning.

Required change: Optional: replace positional arrays with one family-keyed descriptor containing current identity, legacy identity, and numeric schema.

Validation command: `mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test/contracts.test.ts`.

This is a code-review smell heuristic. No documented hard rule makes it a blocker. Static inspection confirms the cited code. The affected suite passed.

Retained STD-0018-01: possible duplicated layout validation at `shared-context/scripts/shared-context/contracts.ts:29` and `layout.ts:11-15,28-34`. P3, NO ADR, unchanged and nonblocking. No change is required for approval.

## Spec

No blocking or non-blocking Spec findings identified in git diff 6b64c4aaad9ebc97783aaf52d4a182e38b7eef5f...109f3e0ebf668a6ab9d0002af19c906da4298c94. Reviewed the canonical ticket and parent initiative, all changed files, pinned review-inputs-0030.json, and shared-context, skill-contracts, and worktree contract guidance.

The diff declares owned formats, separates route/layout content upgrades from storage migration, adds explicit bulk conversion and authorised route mutation, preserves historical project identities and tracker migration snapshots, and guards canonical immutable targets. The prior logical index identity correction is present before realpath, with generated metadata validation before persistence. No competing tracker or workflow definition was introduced.

Observed checks: the shared skill-contracts router validate command succeeded for the source shared-context skill. The actual shared-context CLI resolve ticket --id skill-contract-manifests-07-shared-context --json command succeeded and returned shared-context-resolution/v1 with the expected repository route.

No build, lint, test suite, or formatter ran. Mutation, rejection-byte preservation, and moving-base integration scenarios were reviewed in code but remain assigned to the parent final check. Standards conclusions are excluded.

The reviewer also exercised the owning commands below. Their persisted results support the Spec conclusion independently of the axis code inspection.

## Command evidence

The affected integration check ran once on the frozen source:

```json
{
  "argv": [
    "env",
    "BUN_OPTIONS=--install=fallback",
    "mise",
    "exec",
    "--",
    "bun",
    "test",
    "./mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test",
    "./mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.test.ts",
    "./mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.test.ts",
    "./mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-upgrade.test.ts",
    "./mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/scripts/grooming-report.test.ts",
    "./mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/context-resolution.test.ts",
    "./mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/view-contracts.test.ts",
    "./mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts"
  ]
}
```

Exit 0. Observed: 263 pass, 0 fail, 1299 assertions, 11 files, 271.46 seconds. Missing-file mq diagnostics came from rejection cases; the suite passed. No typecheck is claimed. Existing real dependency preparation was reused.

The reviewer launched actual CLIs from the frozen checkout. All mutating scenarios used isolated temporary fixtures:

| Owning command | Observed behavior |
|---|---|
| shared-context resolve source --source web --library --json | Produced shared-context-resolution/v1. Legacy route configuration stayed byte-identical. |
| shared-context index logical/source/alias --kind source --source web --library | Logical web/library identity survived an uppercase physical CanonicalSources directory. Repeated runs preserved complete index bytes. |
| shared-context index direct Uppercase target | Exit 1, Invalid owned index metadata. No index file appeared. |
| shared-context index with authored footer and source copy | Managed entries changed. Authored surrounding text and source-copy bytes stayed exact. A repeated run changed no bytes. |
| shared-context index with future source/index version or malformed source title | Exit 1. Rejected source and index bytes stayed exact. |
| shared-context index through immutable-history alias or outside-root alias | Exit 1. Immutable index bytes stayed exact. No outside index appeared. |
| shared-context upgrade through immutable alias or canonical lock alias | Exit 1. Configuration bytes and the other owner's lock stayed exact. |
| shared-context configure-route --kind workflows --store shared | Upgraded routes to v3, preserved comments and unknown metadata, and pinned inherited evidence storage. No files moved. |
| shared-context upgrade --artifacts selected.json | Reported partial success for legacy layout plus future route configuration. Converted layout retained authored bytes outside its header. Rejected configuration stayed exact. |
| records migrate plan/apply/check with retained unversioned resolution snapshots | Applied and checked a v2 plan. Repeated apply was idempotent. Plan ID, input plan, stored snapshot, event list and event bytes stayed exact. |
| records migrate apply with future resolution version | Exit 1. Accepted plan and journal stayed exact. |
| write-view --repository fixture --id VIEW --kind manifest --input request.json | Upgraded v2 manifest to worktree-workflow/v3 and updated state. Authored comments and unknown nested data survived. |
| skill-contracts bulk-upgrade with worktree view adapter | Current view remained byte-identical. |
| grooming-report upgrade through ancestor alias; check-actions | Produced grooming-actions/v2 with unchanged ticket data. Public result retained the lexical alias path. Validation passed. |
| shared-context migrate sources --to shared | Physical source and copied destination bytes stayed exact. New project identity declared shared-context-project/v1. |
| shared-context recover-identity with an equivalent historical identity | Historical origin spelling, authored extra field and all JSON bytes stayed exact. |
| shared-context resolve with absent/future machine configuration | Missing default configuration remained absent. Future explicit identity failed before storage creation. |
| skill-contracts validate --skill source shared-context/tracker/worktree | All three owner manifests validated. |
| shared-context resolve ticket --id skill-contract-manifests-07-shared-context --json | Passed on the frozen source. |

Initial fixture corrections are not product failures. Tracker apply first rejected an initiatives adapter of files; a separate fixture used the documented markdown adapter and passed. An isolated HOME first lacked a resolvable Bun shim; the existing real Bun directory corrected PATH. Storage migration skips directory aliases under its existing traversal policy; a separate physical-source fixture proved copy preservation. No source or dependency files changed.

## Integration checks

Retain the assigned checks exactly. Dependency preparation was already present and was not repeated:

```json
[
  {
    "argv": [
      "mise",
      "exec",
      "--",
      "bun",
      "/tmp/shared-context-finish-Awgys9/prepare-dependencies.ts"
    ]
  },
  {
    "argv": [
      "env",
      "BUN_OPTIONS=--install=fallback",
      "mise",
      "exec",
      "--",
      "bun",
      "test",
      "./mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test",
      "./mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.test.ts",
      "./mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.test.ts",
      "./mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-upgrade.test.ts",
      "./mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/scripts/grooming-report.test.ts",
      "./mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/context-resolution.test.ts",
      "./mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/view-contracts.test.ts",
      "./mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts"
    ]
  },
  {
    "argv": [
      "./mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts",
      "resolve",
      "ticket",
      "--id",
      "skill-contract-manifests-07-shared-context",
      "--json"
    ]
  }
]
```

The resolved source already contains advancing-base worktree view, resolution and backlog consumers. The affected suite and actual commands exercised those consumers with the changed shared upgrader. This is source-bound evidence, not a future integration-commit verdict.

## Integration hazards and limits

- **Moving base:** Finish must recheck current base compatibility and run checks bound to the actual squash integration commit and tree. Base-only workflow metadata is not a source deletion.
- **Coordination limit:** The supplied assessment has no hard blocker or reservation, but inventory completeness is false. Retained parent herdr-app:t1yx owns recovery. Preserve unrelated sessions.
- **Version observation:** The frozen commit actually contains agent-core 0.1.43 and matt-pocock 0.1.17, with matching marketplace entries. Developer remains 0.2.77. Handoff prose names the earlier manual resolutions 0.1.42 and 0.1.16. The reviewed identity is the exact approved commit/tree, not those prose numbers. No downgrade or marketplace mismatch was found.
- **Runtime boundary:** Real installed YAML, AJV and Crust dependencies were reused. No fake fallback was installed. The prior unavailable TypeScript LSP was not retried.
- **Publication boundary:** No merge, push, tracker mutation or source edit occurred. This review authorizes no independent finish mutation. The parent owns the next phase and publication.

## Independent sessions and shutdown

Standards and Spec ran in fresh depth-2 tabs in the existing source workspace. Their transport summaries are not canonical review artifacts. Both delivered review-axis/v1; the reviewer validated schema, axis, findings and transport identity/hash before acknowledgement.

- **Standards axis:** run 99780369-9a34-417e-8acf-5b75c6175d2a; SHA-256 c506326fb3a1ba4f642aab9630d85578f887ef9024bb637b57c135b83340e095; acknowledged; completion sequence 2; owned tab closed; shutdown confirmed at 2026-11-23T05:16:07.445Z.
- **Spec axis:** run fb2ab4f4-2a29-4a24-b549-457d5f3f0382; SHA-256 bd2beaf9bde83874073b182536560b0e1a2dde66a88afb8a8f6f249123b66dad; acknowledged; completion sequence 2; owned tab closed; shutdown confirmed at 2026-11-23T05:16:07.976Z.

Only normal owned-tab closure was used. Both tabs disappeared from the desktop inventory. All registered axis process identities are stopped. No broad kill or extra process signal occurred.

## Consumed provenance

Canonical ticket, parent initiative, review-inputs-0030.json, pr-draft-review-start-0030.md, source-approval-0029, review-start-0030, fix-0021, fix-complete-0022, review-0024, review-complete-0025 and finish-complete-0028. Prior artifacts and events remain unchanged. ADR index contains no decision applicable to this slice.

## Handoff

Parent: validate review-0031 and this artifact, acknowledge the assigned result, run the smallest smoke, close this reviewer tab and confirm shutdown. Continue finish only under the approved recovery gates.
