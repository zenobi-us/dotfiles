# Adopt contracts in shared-context operations

## Ticket summary

Ticket: [skill-contract-manifests-07-shared-context](../../../tracker/tickets/skill-contract-manifests-07-shared-context.md).
Initiative: skill-contract-manifests.
Source commit: `2d5779034ef9f36b24356632a327070ae61daea0`. Source tree: `dc28c302db0cd500e2ca3f11ba9771ec884b328d`.

## Problem

Shared-context formats lacked a common contract declaration and safe content conversion boundary.

## Implementation

Declared shared-context-owned contracts; retained explicit route/layout historical readers; added lossless configuration upgrades and route updates through shared skill-contracts; tagged resolution/index outputs; preserved authored configuration, source copies, immutable history, external formats, and independent inherited routes. Coordinated unchanged resolution location fields with worktree-08. Commit hook updated agent-core bundle metadata to 0.1.36.

Route v3 replaces numeric schema with schemaVersion. Layout v2 makes the same cutover. Read-only commands retain historical readers without conversion. Explicit bulk conversion remains separate from storage migration. Unknown identifiers, ambiguous managed blocks, immutable paths, and unsupported authored mutation syntax stop before replacing the rejected artifact.

The authoritative resolution definition extends the retained location semantics in `references/layout.md`. Worktree-08 confirmed it can retain that owner reference. Tracker, worktree, muxer, and external source formats remain under their existing owners.

## Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/contracts.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/changelog.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/configuration-upgrades.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/contracts.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/layout.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/README.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/config.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/contracts.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/layout.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test/contracts.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test/shared-context.test.ts`

## Validation

- `mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test`: 63 passed; 0 failed; 289 assertions. Real Ajv and Crust dependencies installed in an isolated temporary directory and linked through ignored node_modules aliases for Bun test. All aliases and fixtures removed afterward.
- `skill-contracts/scripts/router.ts validate --skill <absolute-source-shared-context-skill>`: All nine owned contract definitions and both declared procedures resolved.
- `shared-context/scripts/shared-context/cli.ts resolve workflow --id SMOKE --json`: Produced shared-context-resolution/v1; retained fields resolved the isolated repository path; legacy route bytes remained equal.
- `shared-context/scripts/shared-context/cli.ts configure-route --kind workflows --store shared`: Safely upgraded routes v2 to v3; retained authored header comment; pinned inherited evidence to repository.
- `shared-context/scripts/shared-context/cli.ts upgrade --artifacts <isolated-selected.json>`: Expected partial outcome: layout v1 converted to v2 with authored comments intact; future route v99 rejected byte-identically.
- `shared-context/scripts/shared-context/cli.ts index <isolated-source> --kind source --source web --library`: Generated shared-context-index/v1 with original source title and URL; source copy retained.
- `shared-context/scripts/shared-context/cli.ts configure-route --kind workflows --store repository (multiline authored TOML)`: Expected rejection; exact original route bytes retained. Missing machine configuration remained absent throughout read-only inspection.

Initial suite attempts exposed missing version-qualified runtime dependencies. The final suite used real installed dependencies, not mocks. Temporary dependency aliases and isolated smoke fixtures were removed. No live services were started. LSP initialization was unavailable because this checkout lacked TypeScript; runtime and owning-command checks supplied verification.

## Review history

2026-11-22T04:10:19.730Z: [review-0005](../artifacts/reviews/review-review-0005.md) returned FAILURE for commit `2d5779034ef9f36b24356632a327070ae61daea0`.

## Resolved findings

No prior review findings.

## Remaining findings

Standards-1, Standards-2, SPEC-01, SPEC-02, SPEC-03, SPEC-04, and SPEC-05 remain open. See the immutable review for evidence and required changes.

## Latest reviewer verdict

FAILURE.

## Merge status

Not merged or pushed. Ticket claim retained. Ticket not marked completed. Source worktree remains available.

## Open questions

None.

## Supporting records

- [Start receipt](../events/start-0001.yaml).
- [Implementation receipt](../events/implementation-0002.yaml).
- [Implementation snapshot](../artifacts/snapshots/pr-draft-implementation-0002.md).
