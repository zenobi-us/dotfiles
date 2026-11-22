---
description: Independent frozen-source standards and spec review
title: Artifact-sharing review
type: Concept
---

# Artifact-sharing review

## Verdict

FAILURE

## Identity

- Timestamp: 2026-11-22T08:23:15.331Z
- Ticket: tracker/tickets/skill-contract-manifests-11-artifact-sharing.md
- Initiative: tracker/initiatives/skill-contract-manifests/index.md
- Source branch: feature/skill-contract-manifests-11-artifact-sharing
- Base branch: master
- Reviewed commit: 8d83701befd83473f2a3fb38162cbef0c5082e38
- Reviewed tree: 6da0a4fe4f9809120bab3bc7c11cddd78e87ac22
- Frozen review base: 10048f87a705a20fe4c90080db74309528613599
- Parent phase start: workflows/skill-contract-manifests-11-artifact-sharing/events/review-start-0005.yaml
- Implementation receipt: workflows/skill-contract-manifests-11-artifact-sharing/events/implementation-0002.yaml
- Implementation snapshot: workflows/skill-contract-manifests-11-artifact-sharing/artifacts/snapshots/pr-draft-implementation-0002.md

## Scope and contracts

Committed scope only: git diff 10048f87a705a20fe4c90080db74309528613599...8d83701befd83473f2a3fb38162cbef0c5082e38. Two commits: e45c9119 and 8d83701b.

- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json
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

Affected contracts:

- artifact-share-config/v1
- artifact-share-config/v2
- artifact-share-metadata/v1
- artifact-share-metadata/v2
- artifact-share-index/v1
- skill-contract safe-upgrade API
- bundle plugin registries

Read the publication-checkout ticket, parent initiative, immutable implementation snapshot and receipt, CONTEXT-MAP.md, CONTEXT.md and docs/adr/index.md. Only ADR 0001 exists. It concerns Pi Ink cleanup and does not apply here.

## Standards

No blocking documented-standard violations or heuristic findings. Static review found the configuration adapter consistent with the shared safe-upgrade API. Configuration uses the shared writer and preservation checks. No tooling-enforced style issues are reported. Metadata compatibility is assessed under Spec below; static intent is not runtime proof.

## Spec

One blocking finding. The ticket requires accepted historical formats and coordinated metadata producers and consumers. Configuration read, authorized mutation, unknown-version rejection and authored-data preservation passed the isolated CLI smoke. Numeric-looking publication hashes fail both generation and historical retrieval.

### SPEC-001 — P2 — Preserve numeric-looking share hashes

NO ADR: The new YAML interpretation rejects a valid existing publication representation. This blocks the ticket's historical compatibility and coordinated cutover requirements.

- File: mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/src/share-metadata.ts:14
- Description: The ticket requires ‘accepted historical formats’ and says ‘Update configuration readers and writers and owned publication metadata producers and consumers together.’ buildMdx still emits an unquoted hash (cli.ts:422). A valid hash such as 123456789012 is a YAML number, so the new parser rejects it as non-string. Historical pages used this same unquoted representation and passed the previous regex checker. Consequently, existing-share retrieval (cli.ts:475), newly generated share validation (cli.ts:547), and the updated repository checker reject these hashes. This blocks repository-only shares too, without requiring a hosted build.
- Required change: Quote hashes in newly produced v2 YAML. Add an explicit legacy reader that retains the original hash text, including leading zeros, for historical unquoted hashes without rewriting pages. Cover historical retrieval and new share generation with numeric-looking hashes.
- Validation command: mise exec -- bun -e 'import { readShareMetadata } from "./mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/src/share-metadata.ts"; console.log(readShareMetadata("---\ntitle: Report\nkind: doc\nhash: 123456789012\ndate: 2026-11-22\nsource: report.html\n---\nBody\n"));'

The actual source bytes <h1>Review 376</h1> followed by a newline have SHA-256 prefix 860951705127. The producer writes that hash as an unquoted YAML scalar. Bun.YAML.parse returns a number. The reader requires a string. A historical page with the same unquoted hash fails too. Quoting the hash in the isolated page makes retrieval succeed. Historical handling must retain raw digits, including leading zeros, rather than round-trip a coerced number.

## Validation

Analysis completed before validation. Ran the suite once, then one isolated owning-CLI smoke.

| Check | Result |
| --- | --- |
| mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test | 30 passed; 0 failed; 110 assertions |
| Isolated CLI list | Exit 0; config bytes unchanged |
| Isolated CLI config clone-root | Exit 0; v1 to v2 persisted; share settings and unknown authored fields preserved |
| Unknown explicit config version mutation | Exit 1; original bytes unchanged |
| New share doc source.html --dry-run, hash 860951705127 | Exit 1; Share metadata hash must be a string |
| Historical unversioned page retrieval with that unquoted hash | Exit 1; same error; page and artifact source bytes unchanged |
| Same retrieval with quoted hash | Exit 0; unchanged true; dryRun true; url null |

The temporary fixtures and smoke script were removed. No source, tests, generated files or configuration were edited. No remote operation, push, hosted build or deploy ran. The passing suite does not cover this failing numeric-hash path.

## Base compatibility and integration

The reviewed source and frozen base have identical shared skill-contracts contracts.ts and upgrades.ts bytes. No source/base API incompatibility was found in that boundary. This does not approve a later integration candidate. Registry overlap remains an integration risk from the parent's recorded coordination assessment. That assessment reports incomplete unrelated inventory and makes no blanket compatibility claim. Revalidate bundle registries and shared safe-upgrade consumers against the current base before integration.

Required integration checks from the frozen handoff:

    mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test

## Independent sessions and shutdown

- Standards: run a2be5c72-fa7d-4d28-a803-b0472bfa5e71; fresh session; completed; delivered review-axis/v1; verified and acknowledged.
- Spec: run 19d35fee-18f3-49c4-a19c-f2f9544d884d; fresh session; completed; delivered review-axis/v1; verified and acknowledged.
- Owned child terminals t1zz and t1zy were closed and removed. Post-closure resource observations at 2026-11-22T08:21:31.368Z reported shutdown confirmed for both runs. No domain services were launched.
- The parent owns closure of this reviewer session. No tracker, projection or other workflow state was changed.

## Axis totals

Standards: 0 blocking findings. Spec: 1 blocking finding; worst P2.

