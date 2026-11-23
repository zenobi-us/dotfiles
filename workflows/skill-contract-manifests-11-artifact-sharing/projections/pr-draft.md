---
receipt_id: fix-result-0026
schemaVersion: worktree-pr-draft/v1
source_commit: 8b616592357dd7c5c7472b54d3e946029bd2d2a9
source_tree: d3d9d6e312b93131799b44b1d11b49d07bd1ebb8
title: SPEC-004 fix
type: Concept
workflow_id: skill-contract-manifests-11-artifact-sharing
---

# SPEC-004 fixed; independent review pending

Historical readers now recover the complete plain 12-character lowercase hexadecimal hash scalar, including exponent-shaped hashes. Current-contract numeric scalars remain rejected. No historical publications were converted. The supported local consumer upgrade recognizes the deployed pre-fix reader.

## Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/consumer-history.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/src/share-metadata.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/metadata-v1.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/share.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/consumers.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/contracts.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/site.test.ts`

## Validation

Affected suites: 7 pass, 0 fail, 112 assertions. Actual MDX ingestion covers `123456789e12`, `42226e907802`, ordinary numeric text and leading zeros. Numeric v2 and unsupported versions fail. Actual CLI `list`, `share doc <source> --dry-run`, `check`, and `upgrade private --confirm private` exit 0. Historical pages, source and published asset remain byte-identical. Exact argv, cwd, exit codes and resources: [validation snapshot](validation-fix-0026.json).

## References

Consumed review: `review-result-0022`, artifact `artifacts/reviews/review-review-result-0022.md`. Authorization: `fix-approval-0024`; start: `fix-start-0025`. Produced result: `fix-result-0026`. Source commit: `8b616592357dd7c5c7472b54d3e946029bd2d2a9`; tree: `d3d9d6e312b93131799b44b1d11b49d07bd1ebb8`.

## Open questions

None. FIXED, not SUCCESS. Historical FAILURE is stale; current verdict is null. Parent owns independent review, workflow commits, and live child shutdown. No merge, push, or tracker mutation ran.


## Parent completion and cleanup

[fix-complete-0027](../events/fix-complete-0027.yaml) records verified typed delivery, clean source and passing [parent CLI smoke](../artifacts/snapshots/validation-parent-fix-0027.json). The fixer tab was removed; OMP and language-server processes remain live. [Cleanup evidence](../artifacts/snapshots/resources-fix-complete-0027.json). Shutdown requires scoped approval before independent review. No merge or push ran.


## Ticket and implementation context

[Ticket](../../../tracker/tickets/skill-contract-manifests-11-artifact-sharing.md): adopt configuration and publication metadata contracts while preserving historical records and authored data. The [initial implementation](../events/implementation-0002.yaml) introduced contracts; [compatibility fix 0018](../events/fix-result-0018.yaml) added safe local upgrades for existing consumers and lossless numeric-hash MDX ingestion. This fix closes the remaining exponent-hash gap.

## Review history

- [Review 0006](../events/review-result-0006.yaml): FAILURE, SPEC-001. [Artifact](../artifacts/reviews/review-review-result-0006.md). [Fix 0010](../events/fix-result-0010.yaml) resolved SPEC-001; [completion](../events/fix-complete-0011.yaml).
- [Review 0014](../events/review-result-0014.yaml): FAILURE at `2b9160cdac8a7c413944876c87292d0d023eeaf1`, findings STANDARDS-001, STANDARDS-002, SPEC-002 and SPEC-003. [Artifact](../artifacts/reviews/review-review-result-0014.md); [completion](../events/review-complete-0015.yaml).
- [Fix approval 0016](../events/fix-approval-0016.yaml) and [start 0017](../events/fix-start-0017.yaml) authorized [fix 0018](../events/fix-result-0018.yaml), which resolved those four findings. [Draft](../artifacts/snapshots/pr-draft-fix-0018.md); [completion](../events/fix-complete-0019.yaml).
- [Review 0022](../events/review-result-0022.yaml): FAILURE at `3378f0d89811c8ce67feadcc0326f8c86764a0ae`, SPEC-004. Standards had no actionable finding. [Artifact](../artifacts/reviews/review-review-result-0022.md); [completion](../events/review-complete-0023.yaml). Existing suite passed 36 tests; owning-command smoke exposed the untested exponent-hash failure.
- [Fix approval 0024](../events/fix-approval-0024.yaml) and [start 0025](../events/fix-start-0025.yaml) authorized [fix 0026](../events/fix-result-0026.yaml). [Immutable draft](../artifacts/snapshots/pr-draft-fix-0026.md); [completion](../events/fix-complete-0027.yaml).

## Resolved and remaining findings

Resolved: SPEC-001, STANDARDS-001, STANDARDS-002, SPEC-002, SPEC-003 and SPEC-004. No unresolved implementation finding. Latest reviewer verdict remains historical FAILURE, stale after the fix. Current-source verdict is null; independent review is required.

## Merge status

Unmerged and not pushed. Source is committed on `feature/skill-contract-manifests-11-artifact-sharing`; the worktree is retained. Cleanup remains pending as recorded above.

