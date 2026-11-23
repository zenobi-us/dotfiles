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

