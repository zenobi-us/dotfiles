# Adopt contracts in shared-context operations

## Ticket summary

Ticket: skill-contract-manifests-07-shared-context. Initiative: skill-contract-manifests.
Source: `3a70f87bac3f44cd6ceb41cebd0887c11ebdbb59`. Tree: `42436c397dfe6d48d33d8c592d25283cdf94cd38`.
State: awaiting fresh independent review. Ticket claim and triage remain unchanged.

## Problem

Review review-0005 found seven blockers in route migration, owned Markdown validation, immutable-history guards, and new-record producers.

## Implementation summary

Fix all seven blockers from review-0005. Preserve explicit independent routes after alignment migration; preflight complete safe upgrades before copying; create identity before empty-route commit; reject duplicate YAML identities and invalid owned source/index metadata; protect canonical history targets; declare versioned ingests; share versioned new identity serialization without rewriting historical recovery records.

The shared skill-contracts upgrader now owns the complete read-only preflight and canonical target identity. Shared-context reuses that API before its guarded final route update. Bundle metadata changed through the existing commit hook. No live configuration or history was changed.

## Fix changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/contracts.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/changelog.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/contracts.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/ingest.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/layout.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test/contracts.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/references/upgrades.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.ts`

## Validation

- `mise exec -- bun test <exact-copy>/shared-context/scripts/shared-context/test <exact-copy>/skill-contracts/scripts/upgrades.test.ts`: 117 passed; 0 failed; 494 assertions across 5 files. All 42 copied owner files matched source SHA-256 before execution. Real ajv 8.17.1, yaml 2.8.1, @crustjs/core 0.0.19 and @crustjs/plugins 0.1.2 installed outside source. All dependency copies and aliases removed.
- `shared-context cli.ts migrate alignment --to shared; resolve tickets --json; resolve workflow --id TASK-1 --json; resolve sources --json`: Actual source entrypoint: alignment copied authored AGENTS.md; tickets, workflow and sources retained repository routes. Regression verifies route comments and unknown fields remain exact.
- `shared-context cli.ts migrate sources --to shared; resolve sources --json`: Actual source entrypoint: empty source collection migrated successfully and produced versioned project identity. Regression covers an initially absent shared directory.
- `shared-context cli.ts migrate sources --to shared (quoted legacy schema header)`: Actual source entrypoint rejected unsafe conversion before creating any shared target directory; source and route bytes unchanged. Regression also covers hexadecimal legacy schema.
- `shared-context cli.ts index <source> --kind source --source local --library (duplicate schemaVersion)`: Actual source entrypoint rejected conflicting duplicate YAML identities and preserved installed index bytes. Regression covers null/future identities, typed source metadata, missing index metadata and foreign owner metadata.
- `shared-context cli.ts index <history-alias> --kind source --source local --library; upgrade --artifacts <history-paths.json>`: Actual source entrypoint rejected both index and configuration ancestor aliases into immutable artifacts. Exact historical index/config bytes retained. Regression also covers events and canonical upgrade locks.
- `skill-contracts scripts/router.ts validate --skill <source-shared-context>; shared-context owning ingest procedure for local text; index <resolved-source>`: All nine owned definitions and both upgrade procedures resolved. Source contract appears in produces. Actual local ingest copied original, wrote seven-field explicit shared-context-source/v1 provenance through mq, and generated an index. Refresh SHA-256 matched and skipped rewrite. Non-Git fixture store remained local-only.
- `shared-context cli.ts recover-identity <slug> --remote <origin> (new, repeated and historical)`: Actual source entrypoint emitted shared-context-project/v1 for new recovery; repeated recovery and authored unversioned historical identity remained byte-identical.

The workspace TypeScript LSP could not initialize because TypeScript is absent. No typecheck is claimed. A direct Bun test attempt could not resolve version-qualified YAML through NODE_PATH. The final suite used byte-identical source copies with real external dependencies, not mocks. All isolated dependencies and smoke stores were removed. No phase services were started. Parent session closure and resource shutdown remain parent-owned.

## Review history

Review review-0005 returned FAILURE for `2d5779034ef9f36b24356632a327070ae61daea0`. Its immutable artifact and every prior event remain unchanged. This fix changes source and does not replace that verdict.

## Resolved findings

Standards-1, Standards-2, SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05. Resolution is supported by the checks above, not a new review verdict.

## Remaining findings

No unresolved selected finding IDs. Fresh independent review is required for the new source.

## Latest reviewer verdict

FAILURE for the previous source. No verdict exists for the current source.

## Merge status

Not merged or pushed. Ticket remains claimed, not completed. Source is committed and clean. The source worktree remains available.

## Open questions

None.

## Supporting records

- [Ticket](../../../tracker/tickets/skill-contract-manifests-07-shared-context.md).
- [Start](../events/start-0001.yaml).
- [Implementation](../events/implementation-0002.yaml).
- [Start completion](../events/start-complete-0003.yaml).
- [Review start](../events/review-start-0004.yaml).
- [Failed review](../events/review-0005.yaml).
- [Review completion](../events/review-complete-0006.yaml).
- [Fix start](../events/fix-start-0007.yaml).
- [Fix result](../events/fix-0008.yaml).
- [Immutable review](../artifacts/reviews/review-review-0005.md).
- [Original implementation snapshot](../artifacts/snapshots/pr-draft-implementation-0002.md).
- [Fix snapshot](../artifacts/snapshots/pr-draft-fix-0008.md).

