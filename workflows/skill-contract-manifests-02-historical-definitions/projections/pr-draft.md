# Pinned historical definitions

## Ticket summary

[skill-contract-manifests-02-historical-definitions](tracker/tickets/skill-contract-manifests-02-historical-definitions.md) resolves authoritative historical definitions without changing a checkout.

## Problem

The shared resolver previously rejected all Git references. Caller repositories must not determine historical content.

## Implementation

Resolve full commit-pinned Git definitions and upgrade procedure references from sourceRepository through an isolated temporary bare repository. Reject mutable pins, wrong or unavailable repositories, absent objects, missing or empty content, and non-commit objects without partial output or revision substitution. Preserve local file reference behavior and owner validators.

Git results expose an immutable commit:path locator and full content. Local file results retain absolute paths. No automatic conversion or domain wire-format changes occur. The commit hook updated agent-core plugin version metadata.

## Source

Commit: `613c8a3d42260b1443195303d8e6b74f158992ad`
Tree: `6fc6394ecad750c000417c93262a2cd5ab487ba3`
Branch: `feature/skill-contract-manifests-02-historical-definitions`
Source worktree: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-02-historical-definitions`
The source checkout is clean.

## Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/how-to-validate-contracts.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/references/manifest.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/contracts.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/contracts.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts`

## Validation

- Public CLI regression suite: 39 passed; 169 assertions.
- Direct executable CLI smoke: fetched initially absent historical content from a different repository. Both resolve and validate succeeded.
- Invalid branches, tags, abbreviated pins, unavailable objects, missing content, wrong repositories and unavailable repositories failed without JSON success output.
- Source, caller and installed checkout HEAD, status and authored content stayed unchanged.
- Local file resolution remained owner-relative.
- Focused strict TypeScript check passed for all three resolver scripts with real dependency types in a temporary environment.
- Bundle typecheck could not start because tsc is not installed in this checkout. No source dependencies were added.

## Review history

[Review review-0006](../artifacts/reviews/review-review-0006.md): SUCCESS at 2026-11-19T21:50:05.748Z, commit `613c8a3d42260b1443195303d8e6b74f158992ad`. Standards: 0 findings. Spec: 0 findings. [Result receipt](../events/review-0006.yaml). [Parent completion](../events/review-complete-0007.yaml).

## Resolved findings

None.

## Remaining findings

None recorded.

## Latest reviewer verdict

SUCCESS.

## Merge status

Not merged, submitted, pushed or marked completed. The ticket remains claimed.

## Open questions

None. Remote network authentication was not exercised; repository transport used local Git sources.

## Supporting records

- [Start receipt](../events/start-0001.yaml)
- [Implementation receipt](../events/implementation-0002.yaml)
- [Immutable draft](../artifacts/snapshots/pr-draft-implementation-0002.md)
