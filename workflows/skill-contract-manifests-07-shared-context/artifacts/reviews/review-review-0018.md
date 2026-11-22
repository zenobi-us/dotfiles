# Independent worktree review 0018

Review the complete shared-context contract change for the parent workflow owner.
Date: 2026-11-22T08:23:21.344Z. Reader: parent reviewer/fixer coordinator. Attempt: 3.

## Overview

Verdict: FAILURE. One blocking Spec finding remains. The affected suite passes, but a real owning command produces an index that its next read rejects.

Fix SPEC-0018-01, then obtain a fresh independent source review. STD-0018-01 is a non-blocking maintainability heuristic. This review changes no source and grants no integration approval.

Navigation: [Identity](#identity), [Scope and contracts](#scope-and-contracts), [Standards](#standards), [Spec](#spec), [Validation](#validation), [Integration assessment](#integration-assessment), [Resources and publication](#resources-and-publication).

## Identity

- **Ticket:** skill-contract-manifests-07-shared-context; backend local-markdown; ref `tracker/tickets/skill-contract-manifests-07-shared-context.md`.
- **Initiative:** `tracker/initiatives/skill-contract-manifests/index.md`.
- **Branches:** source `feature/skill-contract-manifests-07-shared-context`; base `master`.
- **Frozen commit:** `fc4bf19ed4d42aae5fb246e40904f4be956d3298`.
- **Frozen tree:** `7f3a38fb53fa37605d2128815c2c3d9f8041b122`.
- **Source checkout:** `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-07-shared-context`.
- **Publication checkout:** `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`. Both checkouts share its physical `.git` directory.
- **Workflow:** repository store; `workflows/skill-contract-manifests-07-shared-context`.
- **Authorization:** `review-start-0017`, following `fix-0015` and `fix-complete-0016`. The parent retains ownership under `fix-approval-0013`.

Read the canonical ticket, initiative, latest fix and completion, fix snapshot, prior review receipt and artifact, context map, domain context, tracker rules, and ADR index from the designated checkout. The only architecture decision record concerns Pi Ink device cleanup. It does not govern this change; findings use NO ADR.

## Scope and contracts

Reviewed all seven ticket commits, not only the last fixes: `2d577903`, `47a5b40e`, `792e4912`, `3a70f87b`, `58e472f0`, `1101dfb2`, `fc4bf19e`.

Read both comparisons with immutable endpoints:

`git diff 10048f87a705a20fe4c90080db74309528613599 fc4bf19ed4d42aae5fb246e40904f4be956d3298`

`git diff 10048f87a705a20fe4c90080db74309528613599...fc4bf19ed4d42aae5fb246e40904f4be956d3298`

The ticket comparison contains 23 paths. Its affected code and guidance match the direct comparison. Bundle version metadata differs because the base advanced independently. The direct comparison also includes base-only workflow and muxer changes. These reverse differences are not source defects.

The following fields retain the supplied names and exact values:

```json
{
  "review_base_commit": "10048f87a705a20fe4c90080db74309528613599",
  "changed_scope": [
    "mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json",
    "mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json",
    "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/SKILL.md",
    "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/contracts.json",
    "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/changelog.md",
    "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/configuration-upgrades.md",
    "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/contracts.md",
    "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/ingest.md",
    "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/layout.md",
    "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/README.md",
    "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts",
    "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/config.ts",
    "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/contracts.ts",
    "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/layout.ts",
    "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts",
    "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test/contracts.test.ts",
    "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test/shared-context.test.ts",
    "mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/references/upgrades.md",
    "mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.ts",
    "mise/conf.d/devtools-agent/bundles/matt-pocock/.claude-plugin/plugin.json",
    "mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/tasks/migrate.md",
    "mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-migration.ts",
    "mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.test.ts"
  ],
  "affected_contracts": [
    "shared-context-routes/v2",
    "shared-context-routes/v3",
    "shared-context-layout/v1",
    "shared-context-layout/v2",
    "shared-context-config/v1",
    "shared-context-project/v1",
    "shared-context-source/v1",
    "shared-context-index/v1",
    "shared-context-resolution/v1",
    "skill-contracts safeUpgrade/bulkUpgrade public artifact identity and canonical targets",
    "tracker-migration-plan/v2 historical resolution snapshots and immutable IDs",
    "shared-context resolution consumers: tracker and worktree"
  ],
  "integration_checks": [
    {
      "argv": [
        "mise",
        "exec",
        "--",
        "bun",
        "test",
        "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test",
        "mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.test.ts",
        "mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.test.ts",
        "mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-upgrade.test.ts"
      ]
    },
    {
      "argv": [
        "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts",
        "resolve",
        "ticket",
        "--id",
        "skill-contract-manifests-07-shared-context",
        "--json"
      ]
    }
  ]
}
```

## Standards

Fresh independent session: `1e2a37df-42fc-4a48-a28b-39da30c600af`. One non-blocking P3 heuristic; no evidence-backed hard standards violation.

### STD-0018-01 — P3 — NO ADR — non-blocking

Possible Duplicated Code. [contracts.ts:26–29](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-07-shared-context/mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/contracts.ts#L26-L29) repeats the relative-path policy in [layout.ts:11–15](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-07-shared-context/mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/layout.ts#L11-L15). [readLayout:28–34](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-07-shared-context/mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/layout.ts#L28-L34) then applies both validators.

Two policy copies can drift. Optional change: reuse one dependency-neutral path validator and one layout-key validator. Verify existing layout resolution and upgrade cases, including rejected traversal, absolute paths, drive prefixes, backslashes, empty components and whitespace.

This is the code-review smell baseline, not a hard contract requirement. It does not block completion. The axis-local ID STANDARDS-01 maps to STD-0018-01 here.

## Spec

Fresh independent session: `f6cddb9d-0a49-43f7-a2e4-bccac5620a05`. One blocking P2 finding. The axis reported a static hypothesis; the reviewer confirmed it through actual owning commands.

### SPEC-0018-01 — P2 — NO ADR — blocking

File: [lib.ts:970–976](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-07-shared-context/mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts#L970-L976).

The index producer persists versioned metadata without destination validation. [lib.ts:907–922](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-07-shared-context/mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts#L907-L922) replaces the logical directory with its canonical path, then uses its basename as source identity. [validateIndexMetadata:864–870](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-07-shared-context/mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts#L864-L870) later rejects uppercase source identifiers.

Requirement: “Introduce new versions for affected field-name changes and update producers, validators, consumers, examples, and guidance together.” The initiative also requires destination validation before persistence.

Concrete evidence from an exact frozen archive:

1. Create an empty `repo/CanonicalSources` directory. Point `repo/sources/library/web` to it. The alias remains inside the same repository.
2. Run `cli.ts index "$REPO/sources/library/web" --kind source --source web --library`. Exit 0. It writes `schemaVersion: "shared-context-index/v1"` and `source: "CanonicalSources"`.
3. Run the identical command again. Exit 1. Standard error: `Invalid owned index metadata`.
4. Direct indexing of an empty `repo/Web` directory also exits 0 once, then 1 with the same error. It persists `source: "Web"`.

Required change: validate generated metadata before writing. Separate logical source identity from canonical filesystem safety checks, or reject unsupported identities before persistence. Do not report success for an index the next owning read cannot accept.

Validation command, after creating the isolated alias fixture:

```sh
"$CLI" index "$REPO/sources/library/web" --kind source --source web --library
"$CLI" index "$REPO/sources/library/web" --kind source --source web --library
```

Both commands must succeed with valid metadata, or the first must reject without creating an index. Also check a normal lowercase source and exact preservation of source copies and authored index text.

Why this blocks completion: a successful owning operation writes an artifact outside its declared contract. Routine repeat indexing then fails and needs user repair. The axis-local ID SPEC-01 maps to SPEC-0018-01 here; it is not the prior retained-plan finding.

The previous review findings were assessed against current evidence, not carried forward. Public upgrade paths now preserve lexical selections; the owning tracker smoke reports partial outcomes and required publication. Equivalent authored project identity bytes survive migration. The affected suite covers retained route snapshots and immutable migration IDs/events. The original historical-producer smoke remains recorded in `fix-0015`; this review did not rerun that earlier archive scenario.

## Validation

The affected suite ran once after investigation. Result: 153 passed, 0 failed, 701 assertions, seven files, 70.35 seconds. Missing-record diagnostics were expected rejection-path output.

Command:

```sh
env BUN_OPTIONS=--install=fallback mise exec -- bun test \
  ./mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test \
  ./mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.test.ts \
  ./mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.test.ts \
  ./mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-upgrade.test.ts
```

Ran tests and mutation scenarios in `/tmp/review-0018-oiiTOj`, not the source. The archive contained 2246 tracked bundle files or symlinks. All bytes and link targets matched source before and after validation.

Installed real AJV 8.20.0, YAML 2.8.1, @crustjs/core 0.0.19 and @crustjs/plugins 0.1.2 outside source. Qualified dependency aliases point to these real installations. No fake package fallback or source transformation was used.

Owning-command smoke groups passed:

- **Read-only resolution:** returned shared-context-resolution/v1 and retained legacy route bytes. Missing machine configuration remained absent.
- **Authorized configuration:** upgraded the route header and preserved comments, unknown metadata and independent inherited child storage.
- **Explicit bulk conversion:** persisted the selected valid layout and reported partial failure while retaining future-version bytes.
- **Source indexing:** retained authored surrounding text and exact source-copy bytes. Malformed markers rejected without index changes.
- **Project identity:** equivalent historical .git-origin metadata and authored extras remained byte-identical during empty-collection migration.
- **Tracker consumer:** alias selections joined successful and rejected upgrade results. The valid record persisted, rejected bytes remained exact, and publication was required.

The separate index-boundary smoke confirmed SPEC-0018-01. Its harness exited 0 because it asserted the observed producer/reader failure; this is not acceptance success.

The actual frozen source CLI also ran `resolve ticket --id skill-contract-manifests-07-shared-context --json`. Exit 0; correct repository store and source ticket path.

An initial disposable smoke invocation failed because isolated HOME left the mise Bun shim without a selected version. Explicit MISE_BUN_VERSION=1.4.4 and the installed runtime path fixed the harness. No product code changed. No typecheck is claimed: the fixer recorded unavailable TypeScript LSP dependencies, and this review did not repeat that failed setup. No browser or UI verification applies.

## Integration assessment

The frozen review_base_commit remains `10048f87a705a20fe4c90080db74309528613599`. A later read observed master at `f9d720853721557f7c7131f09c9df787ef30f56b`; it did not replace the frozen base.

Route/layout producers feed shared-context readers. Resolution output feeds tracker and worktree consumers. Canonical upgrade targets must retain lexical public result identities. Retained migration snapshots must preserve their original property shape and hash. These are producer/consumer hazards even without shared source files.

Base movement since the pinned review context includes backlog-grooming contract adoption and workflow/tracker metadata. The new backlog-grooming command imports shared `bulkUpgrade` at `grooming-report.ts:7,183–185`. Include that consumer when validating the combined candidate. Preserve advancing bundle metadata; do not overwrite it with a source-only version copy.

Before integration, run the exact integration_checks above against a combined frozen-source/current-base candidate. Repeat the real resolution, tracker alias, retained-plan and index-boundary scenarios there. Also run `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/scripts/grooming-report.test.ts` and its owning upgrade command with a temporary valid/future selection. These combined checks were not run by this source review and are not approved implicitly.

The supplied coordination inventory is incomplete, with no concrete hard blocker. Unknown scopes are not proof of compatibility. This review makes no merge, rebase, push, or new-base source approval.

## Resources and publication

Both independent axis results were read through result-delivery, validated and acknowledged. Their terminals were closed with scoped hc kill/rm. Registered process shutdown was confirmed at 2026-11-22T08:19:23.025Z and 2026-11-22T08:19:23.542Z. Desktop inventory contained neither axis terminal afterward. No unrelated terminal or service was stopped.

Only this immutable artifact and its new review receipt are published by this child. Source, tests, configuration, generated files, tickets, prior artifacts and projections remain unchanged. Temporary fixtures, scripts and dependency archives are removed before handoff. No evidence run is invented.

The parent owns receipt validation/acknowledgement, its smallest smoke, ticket review comment, review-complete-0019, projections, publication commits and this review terminal's closure.

Standards: one non-blocking P3 heuristic. Spec: one blocking P2 finding. Verdict: FAILURE.
