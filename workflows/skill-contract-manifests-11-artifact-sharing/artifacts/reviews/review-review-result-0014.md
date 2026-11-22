---
description: Independent frozen-source standards and spec review
title: Independent artifact-sharing review
type: Concept
---

# Independent artifact-sharing review

## Verdict

FAILURE

## Frozen identity

| Field | Value |
| --- | --- |
| Timestamp | 2026-11-22T10:06:44.367Z |
| Ticket | tracker/tickets/skill-contract-manifests-11-artifact-sharing.md |
| Initiative | tracker/initiatives/skill-contract-manifests/index.md |
| Source branch | feature/skill-contract-manifests-11-artifact-sharing |
| Base branch | master |
| Reviewed commit | 2b9160cdac8a7c413944876c87292d0d023eeaf1 |
| Reviewed tree | fb5625ebed3cdf92b322286d5c50aee485b887a1 |
| Frozen review base | 69794e4eb60f7dbe26af658805c4876310d7e8ae |
| Publication checkout | /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles |
| Parent phase start | workflows/skill-contract-manifests-11-artifact-sharing/events/review-start-0013.yaml |
| Reviewer run | 6a1878e0-39a9-4050-a7b7-bbc8dc0c8523 |

Review command: `git diff 69794e4eb60f7dbe26af658805c4876310d7e8ae...2b9160cdac8a7c413944876c87292d0d023eeaf1`. Committed changes only. Commits: e45c91191a026ad972c6437b0a89fb71b34c5cd0, 8d83701befd83473f2a3fb38162cbef0c5082e38, 2b9160cdac8a7c413944876c87292d0d023eeaf1.

## Scope

- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/SKILL.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/.mise/tasks/checks/types.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/press.config.tsx`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/src/share-metadata.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/contracts.json`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/config-upgrade.txt`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/config-v1.json`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/config-v2.json`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/index-v1.txt`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/metadata-v1.json`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/metadata-v2.json`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/list.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/share.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/config-owner.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/config.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/lib.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/artifact-shares.test.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/contracts.test.ts`

## Affected contracts

- **Contract:** `artifact-share-config/v1`
- **Contract:** `artifact-share-config/v2`
- **Contract:** `artifact-share-metadata/v1`
- **Contract:** `artifact-share-metadata/v2`
- **Contract:** `artifact-share-index/v1`
- **Contract:** `skill-contract safe-upgrade API`
- **Contract:** `bundle plugin registries`

The canonical ticket, complete initiative, implementation receipt, fix receipt, immutable fix draft, previous review artifact, CONTEXT-MAP.md, CONTEXT.md, and docs/adr/index.md were read from the publication checkout. ADR 0001 is unrelated. The earlier FAILURE applies to its earlier source; it is not this verdict.

## Standards

Two blocking compatibility findings. No additional actionable Fowler smell was found. The shared safe-upgrade and registry review found no additional blocker. These findings apply the documented coordinated contract-cutover rules, not a style heuristic.

### STANDARDS-001 — P1

NO ADR. ADR 0001 concerns Pi Ink cleanup and does not apply.

- **File and line:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts:422`
- **Description:** Hard compatibility-rule breach: every new page now quotes its hash, but repositories created from the base template retain a regex validator that compares the quoted scalar directly with the unquoted index hash. ensureClone only fetches/pulls; it never updates those consumers. Therefore a new publication into an existing repository fails checks:types and is removed. Dry runs skip this check. The initiative requires coordinated producer/consumer cutover. Independently reproduced: the frozen-base checks:types executable rejects a page generated by the current CLI: frontmatter hash is "860951705127", file name says 860951705127.
- **Required change:** Provide an explicit, safe consumer upgrade path for existing share repositories before writing v2 metadata. Preserve repository customizations and existing publication checks. Add a base-template-to-current-CLI publication regression scenario.
- **Validation command:** `mise run checks:types`

### STANDARDS-002 — P2

NO ADR. ADR 0001 concerns Pi Ink cleanup and does not apply.

- **File and line:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/press.config.tsx:17`
- **Description:** The site consumer still requires hash: z.string(). Historical numeric-only YAML hashes parse as numbers. The new readShareMetadata recovery fixes CLI retrieval and checks:types, but defineDocs never calls that reader. Thus the newly documented historical compatibility does not extend to site compilation. This conflicts with the initiative's coordinated consumer-update rule and the declared metadata/v1 interpretation. Independently reproduced: actual Fumapress builds reject both unversioned hash 860951705127 and v1 hash 000000000123 with “hash: Invalid input: expected string, received number”. The quoted v2 control builds successfully.
- **Required change:** Apply lossless historical hash interpretation at the MDX loader boundary, with the same explicit-version restrictions. Preserve leading zeros and stored page bytes. Cover legacy numeric hashes and rejection of numeric v2 hashes through the actual site consumer.
- **Validation command:** `mise exec -- bunx --no-install fumapress build`

## Spec

Two blocking compatibility findings. The ticket requires “Update configuration readers and writers and owned publication metadata producers and consumers together.” It also requires accepted historical formats and unchanged publication requirements. No scope-creep or additional configuration/access-boundary finding was found.

### SPEC-002 — P1

NO ADR. ADR 0001 concerns Pi Ink cleanup and does not apply.

- **File and line:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts:422`
- **Description:** The ticket requires: ‘Update configuration readers and writers and owned publication metadata producers and consumers together.’ Every new hash is now quoted, but existing share repositories retain the base checks:types reader. That reader captures the quotes with /^hash:\s*(\S+)\s*$/m and compares them with an unquoted index hash. ensureClone only fetches/pulls; it never updates repository-owned consumers. Thus new publications into existing repositories fail their required check. Dry runs hide this because runShareChecks skips checks:types for staged roots. Independently reproduced: the frozen-base checks:types executable rejects a page generated by the current CLI: frontmatter hash is "860951705127", file name says 860951705127.
- **Required change:** Provide a safe, explicit consumer upgrade for existing repositories before producing v2 metadata. Preserve customized registries, authored content, settings, and publication checks. Cover a repository created from the frozen base, not only current-template clones.
- **Validation command:** `mise run checks:types`

### SPEC-003 — P2

NO ADR. ADR 0001 concerns Pi Ink cleanup and does not apply.

- **File and line:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/press.config.tsx:17`
- **Description:** The ticket requires: ‘Declare configuration and independently consumed share metadata contracts, accepted historical formats, and supported upgrades.’ The v1 definition explicitly accepts historical plain numeric hashes, but the site consumer still uses z.string() and never calls readShareMetadata. Its YAML-parsed numeric hash therefore fails site validation even though the new CLI/check reader accepts it. SPEC-001 fixes generation and retrieval, but does not coordinate this publication consumer. Independently reproduced: actual Fumapress builds reject both unversioned hash 860951705127 and v1 hash 000000000123 with “hash: Invalid input: expected string, received number”. The quoted v2 control builds successfully.
- **Required change:** Make site ingestion accept the declared historical numeric-hash representation without rewriting pages or losing leading zeros. Exercise the real site build with unversioned/v1 numeric-only hash pages and current v2 pages.
- **Validation command:** `mise exec -- bunx --no-install fumapress build`

Standards: 2 findings, worst P1. Spec: 2 findings, worst P1. Each axis independently identified the same two defects. Their reports remain separate; there are two distinct defects.

## SPEC-001 assessment

The original generation/retrieval defect is fixed at those boundaries. The exact source bytes are `<h1>Review 376</h1>\n`; their SHA-256 prefix is `860951705127`. Current generation writes `hash: "860951705127"`. Unversioned and explicit v1 retrieval accept historical unquoted numeric scalars without rewriting pages. The current repository checker also accepts `000000000123` and preserves the original page bytes.

That repair does not complete the consumer cutover. The old repository checker rejects the new wire representation. The Fumapress loader bypasses readShareMetadata and rejects the declared historical representations. Blind numeric-to-string coercion would also discard leading zeros.

## Validation

Static analysis finished before the final affected suite and runtime scenarios.

| Check or scenario | Observed result |
| --- | --- |
| Manifest validate through skill-contracts/scripts/router.ts | Exit 0; all five definitions and config upgrade resolved |
| mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test | Exit 0; 32 passed, 0 failed, 132 assertions |
| mise exec -- bun run --cwd mise/conf.d/devtools-agent/bundles/agent-core typecheck | Exit 0; bundle tsc passed |
| Isolated CLI list | Exit 0; legacy config bytes unchanged |
| Isolated CLI config clone-root | Exit 0; v1 to v2; names, repository settings, branch, null Pages setting, nested authored fields preserved |
| Isolated CLI config upgrade on current v2 | Exit 0; changed false; exact bytes unchanged |
| Isolated CLI share doc report.html --dry-run --description 'Authored description' | Exit 0; numeric hash quoted, v2 identity present, authored description present, URL null |
| Generated asset and source | Both remain exactly `<h1>Review 376</h1>\n` |
| Historical unversioned/v1 retrieval for 860951705127 | Exit 0; unchanged true, dryRun true, URL null; page/config/source/clone unchanged |
| Current checks:types with unversioned/v1 000000000123 | Exit 0; exact leading-zero identity and page bytes retained |
| Numeric v2, unknown metadata version, short/null hash | CLI and current checker reject; exact clone bytes unchanged |
| Unknown/null config identity, malformed shares, unsafe integer, duplicate keys, immutable config | Mutation rejects; input bytes unchanged |
| Frozen-base checks:types with current generated page | Exit 1; quoted hash mismatch confirmed |
| Isolated bun install --frozen-lockfile | Exit 0; dependencies installed only in temporary site clone |
| Actual fumapress build, unversioned hash 860951705127 | Exit 1; hash expected string, received number |
| Actual fumapress build, v1 hash 000000000123 | Exit 1; same validation error |
| Actual fumapress build, quoted v2 hash 860951705127 | Exit 0; control proves the failure is historical hash ingestion |
| All site build inputs | Exact page bytes unchanged after each build |
| Final source observation | Clean; exact reviewed commit and tree retained |

The first throwaway smoke run failed only at its own final fixture restoration assertion: it reset .types to empty rather than restoring template comments. All preceding behavior assertions passed. The harness was corrected to restore original bytes; its full rerun passed and reproduced the base-checker defect. This was not a source change.

Runtime commands used the actual owning CLI shebang. Share commands used only --dry-run. No GitHub mutation, publication, merge, push, bypass flag, or domain service ran. Generated MDX was read through mq with explicit raw/text formats and the required okf import.

## Base compatibility and integration hazards

The frozen source and frozen base have identical shared skill-contracts contracts.ts, upgrades.ts, and agent-core package.json bytes. No shared-API incompatibility was found at that boundary. The source and publication checkout share the same Git common directory.

The two plugin registry changes advance agent-core 0.1.36 to 0.1.39. Other active streams also touch shared registry files. Reconcile versions and validate the combined registry at integration; do not overwrite unrelated skill registrations. The supplied coordination inventory is incomplete, so this review makes no global compatibility claim.

Existing publication repositories are an affected consumer/resource boundary, not just fresh template assets. An eventual fix must preserve customized registries, authored pages, assets, repository settings, and required checks. Contract validity is not publication permission. No later moving-base candidate is approved by this frozen-source review.

Required integration checks, copied unchanged from the handoff:

    mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test

    mise exec -- bun run --cwd mise/conf.d/devtools-agent/bundles/agent-core typecheck

Also exercise the base-template/current-producer scenario and real site builds for unversioned, v1 leading-zero, and current v2 metadata before accepting a fix.

## Independent sessions and resources

| Axis | Fresh run | Delivery verification | Closure |
| --- | --- | --- | --- |
| Standards | 408e6b25-24b5-4bed-8331-ee5968d3895d | review-axis/v1 identity/hash verified and acknowledged | terminal removed; owned process shutdown confirmed |
| Spec | 140dcd46-53c5-4e6d-9f42-3aff0b796987 | review-axis/v1 identity/hash verified and acknowledged | terminal removed; owned process shutdown confirmed |

Both children ran static review only. No nested children or domain services remain. Temporary CLI fixtures, generated stages, site clone/dependencies, and throwaway scripts were removed. The source checkout, user configuration, and existing share clones were not modified. The parent owns closure of this final reviewer pane and all tracker/projection updates.

## Durable inputs and output

- **Implementation receipt:** workflows/skill-contract-manifests-11-artifact-sharing/events/implementation-0002.yaml
- **Fix receipt:** workflows/skill-contract-manifests-11-artifact-sharing/events/fix-result-0010.yaml
- **Fix draft:** workflows/skill-contract-manifests-11-artifact-sharing/artifacts/snapshots/pr-draft-fix-0010.md
- **Previous review:** workflows/skill-contract-manifests-11-artifact-sharing/artifacts/reviews/review-review-result-0006.md
- **Coordination assessment:** workflows/skill-contract-manifests-11-artifact-sharing/artifacts/snapshots/coordination-review-0013.json
- **Review receipt:** workflows/skill-contract-manifests-11-artifact-sharing/events/review-result-0014.yaml

This file is the sole immutable review body. No tracker or projection was edited.

