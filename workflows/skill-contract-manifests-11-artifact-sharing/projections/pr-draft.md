---
title: Artifact-share implementation
type: Concept
---

# Artifact-share contracts

## Ticket summary

Implement [skill-contract-manifests-11-artifact-sharing](../../../tracker/tickets/skill-contract-manifests-11-artifact-sharing.md). The ticket remains claimed.

## Problem

Configuration had no explicit contract and discarded unknown authored properties when read and saved. Independently consumed publication frontmatter had no declared compatibility boundary.

## Implementation

Configuration now accepts supported unversioned or explicit v1 and v2. New writes produce artifact-share-config/v2 through the shared safe-upgrade operation. The installed owner preserves complete authored configuration, materializes legacy defaults, and rejects unknown versions, duplicate keys, unsafe numbers, immutable records and stale saves. Local config upgrade and clone-root commands do not publish or move repositories.

New pages produce artifact-share-metadata/v2. The CLI, template metadata reader, repository checks and build schema accept supported historical v1 without rewriting pages. Existing-page retrieval validates the metadata and index agreement. The .types index stays artifact-share-index/v1 with no wire change. Package and hosting formats stay external and unchanged. Existing publication approvals remain mandatory.

## Source identity

- Feature commit: e45c91191a026ad972c6437b0a89fb71b34c5cd0.
- Regression commit: 8d83701befd83473f2a3fb38162cbef0c5082e38.
- Final source tree: 6da0a4fe4f9809120bab3bc7c11cddd78e87ac22.
- Branch: feature/skill-contract-manifests-11-artifact-sharing.
- Base: master.
- Source checkout: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing.

## Requirements coverage

| Requirement | Implementation and observed proof |
| --- | --- |
| Declare configuration and independently consumed metadata | contracts.json, five resolved authoritative definitions, one config v1-to-v2 procedure; shared public validate/resolve passed |
| Cut over readers and writers together | Configuration owner and all saves; MDX producer, historical retrieval, template checker and build schema updated together |
| Exercise owning commands | Real list baseline; isolated list, config clone-root, config upgrade, share --dry-run generation and retrieval, template checks:types and explicit bulk-upgrade |
| Preserve meaning and bytes | Deep authored config equality, source asset byte equality, clone snapshot equality during dry-run, byte-identical rejected inputs and bulk failure item |
| Preserve access and approvals | No remote create/share/redact/pages/recreate operation ran; repository-only smoke returned url null; existing Pages confirmation tests passed |

## Changed files

- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/SKILL.md
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/.mise/tasks/checks/types.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/press.config.tsx
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/src/share-metadata.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/contracts.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/config-upgrade.txt
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/config-v1.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/config-v2.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/index-v1.txt
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/metadata-v1.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/metadata-v2.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/list.md
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/share.md
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/config-owner.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/config.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/lib.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/artifact-shares.test.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/contracts.test.ts
- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json

The pre-commit bundle-versions hook generated the two bundle registry changes. It set agent-core to 0.1.37 for the feature commit and 0.1.38 for the regression commit. No unrelated authored changes were staged.

## Validation

| Command or scenario | Result |
| --- | --- |
| mise exec -- bun test skills/artifact-shares/scripts/artifact-shares/test (agent-core directory) | 30 passed, 0 failed, 110 assertions |
| mise exec -- bun run typecheck (agent-core directory) | Passed |
| skill-contracts/scripts/router.ts validate --skill <absolute artifact-shares> | Passed |
| skill-contracts/scripts/router.ts resolve for all five identifiers | All passed |
| Real owning-command smoke with isolated repositories/configuration | Passed; real size, image-metadata and offline credential checks ran |
| Explicit bulk-upgrade with valid and unsupported fixtures | Expected nonzero partial result; valid item upgraded; rejected item byte-identical |

The initial test run lacked existing Turndown dependencies. Installing existing bundle dependencies with bun install --no-save --ignore-scripts fixed that environment prerequisite. Tests that deliberately bypass the shebang now pass --install=fallback. Obsolete help-text, output-echo, registry-default and source-wiring assertions were removed, not re-pinned.

The real list baseline was notes-share, airtonix/notes-share, Pages disabled, zero shares. The user's configuration and repositories were not mutation targets. All mutation, conversion and generation fixtures were temporary. The throwaway smoke script and its fixture repository/stage were removed.

## Review history

No review ran in this implementation session. Latest reviewer verdict: none. Resolved findings: none. Remaining review findings: none recorded. This is not review approval.

## Risks and limits

Older cloned checks tolerate the additive metadata field but do not gain the new explicit contract validator automatically. Current template consumers were exercised. No remote push or hosted site build/deploy was authorized or exercised. Contract validation is neither publication approval nor publication success.

A tool write/edit fidelity issue changed indentation across two files. Exact original indentation was restored without changing intended behavior. The final 30-test suite and typecheck passed after recovery.

No domain service was launched. The current child terminal and agent/tool-runtime processes remain live for parent verification and pane closure. Resource observation is pending, not confirmed shutdown.

## Merge status

Unmerged and not pushed. Ticket completion remains with the parent after review and integration.

## Supporting records

- [Parent start receipt](../events/start-0001.yaml).
- [Implementation result](../events/implementation-0002.yaml).
- [Observed owning-command results](../artifacts/snapshots/validation-implementation-0002.json).
- [Owned resource observation](../artifacts/snapshots/resources-implementation-0002.json).

