---
description: Independent frozen-source Standards and Spec review
title: TWG benchmark contract review
type: Concept
---

# Review: TWG benchmark record contracts

## Verdict
SUCCESS. No blocking findings. Standards: one nonblocking design judgment. Spec: no findings.

Timestamp: 2026-11-22T08:15:08.762Z

## Frozen identity
Ticket: tracker/tickets/skill-contract-manifests-13-twg-benchmark.md (local-markdown).
Parent specification: tracker/initiatives/skill-contract-manifests/index.md.
Source branch: feature/skill-contract-manifests-13-twg-benchmark. Base branch: master.
Source commit: 33b388888ecb2dbbe46cde0d76f604946c925734.
Source tree: 6bf7cadb7209cb53e0a85d62d7107ae201c38c2f.
Review base commit: 22c0a8274bc66d3e41aad29bf03351864c561ced.
Source commits: a3aa4c6f662613ebd4cb41e299ea56b4bf8bc043 and 33b388888ecb2dbbe46cde0d76f604946c925734.
Source checkout: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-13-twg-benchmark.
Publication checkout: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.

Reviewed the complete three-dot diff and inspected the exact two-dot comparison. Base-only tracker, workflow and muxer changes are not source deletions. The two-dot marketplace agent-core version difference comes from base advancement. Preserve that base release during integration. Developer release metadata moves to 0.2.67 in both owning declarations. Shared metadata overlap does not block this frozen source review. Parent review-start-0004 records the active-stream assessment. Integration still needs the current base and the checks below.

## Changed scope
- **Path:** mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- **Path:** mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- **Path:** mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/SKILL.md
- **Path:** mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/contracts.json
- **Path:** mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/references/configuration-upgrade.json
- **Path:** mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/references/contracts.json
- **Path:** mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/cli.mjs
- **Path:** mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/configuration-owner.mjs
- **Path:** mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/contract.json
- **Path:** mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/contracts.test.mjs
- **Path:** mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/records.mjs
- **Path:** mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/report-renderer.mjs
- **Path:** mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/report-renderer.ts
- **Path:** mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/runner.mjs
- **Path:** mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/runner.ts

## Requirements and contracts
The canonical ticket requires record-family identifiers, separate protocol identity, known historical readers, declared upgrades, both runtimes, actual owning operations, and preserved benchmark meaning. Read-only and rejected operations must preserve artifact bytes. Guidance and examples must match the implementation.

- **Contract:** twg-benchmark-configuration/v1
- **Contract:** twg-benchmark-configuration/v2
- **Contract:** twg-benchmark-result/v1
- **Contract:** twg-benchmark-result/v2
- **Contract:** twg-benchmark-manifest/v1
- **Contract:** twg-benchmark-manifest/v2
- **Contract:** twg-benchmark-judgement/v1
- **Contract:** twg-benchmark-judgement/v2
- **Contract:** twg-benchmark-run/v1
- **Contract:** twg-benchmark-run/v2
- **Contract:** twg-benchmark-progress/v1
- **Contract:** twg-benchmark-progress/v2
- **Contract:** skill-contract-manifest/v1
- **Contract:** benchmark protocol contractVersion 0.1.0
- **Contract:** developer plugin/marketplace release metadata

NO ADR: docs/adr/index.md contains only the Pi Ink cleanup trust-boundary decision. It does not govern benchmark records. CONTEXT-MAP.md and CONTEXT.md establish context ownership, not additional benchmark rules. Root ALIGNMENT-ROOT.md is absent as stated in the handoff.

## Standards
Hard blocking findings: none found against the documented standards. NO ADR: the indexed Pi Ink cleanup trust-boundary decision is unrelated. Nonblocking judgment STD-S1: possible Divergent Change in records.mjs:71,152. The added hunks combine `function validateContent(value, family, historical)` with `export async function writeReport(path, resultPath, html)`. Contract interpretation and report replacement have separate reasons to change. Consider separating artifact I/O; this is not a required correction. Existing paired Node/Bun source duplication follows the pre-existing portable-export convention, so it is not a new duplication finding. Reviewed all 15 source paths against the three-dot diff and inspected the scoped exact two-dot diff. Excluded base-only tracker, workflow, muxer, and agent-core release changes. No source files changed.

## Spec
Hard blocking findings: None found.

Nonblocking smell judgments: None raised on this axis.

Reviewed the 15 source paths at 33b388888ecb2dbbe46cde0d76f604946c925734 against the canonical ticket and parent initiative. Inspected three-dot and exact two-dot comparisons. Excluded base-only tracker, workflow, muxer, and agent-core release differences from source findings.

The change separates record-family identities from protocol 0.1.0. It declares historical readers and a configuration-only upgrade, updates both runtime producers and consumers, and preserves immutable evidence in the exercised rejection and reading paths. No unsupported scope expansion found.

NO ADR: The publication-root ADR index contains only the unrelated Pi Ink cleanup trust-boundary decision.

Verdict: PASS for the Spec axis within the reviewed scope. Live paid research and judges were not exercised.

## Validation
The reviewer ran the following checks once after source investigation. All exited 0.

`mise exec -- node --test mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/contracts.test.mjs`

`mise exec -- bun mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/runner.ts check configuration mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/contract.json`

`mise exec -- node mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/runner.mjs check configuration mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/contract.json`

The scoped suite passed 2 tests, 0 failures. It exercised both runtimes, configuration upgrades with exact non-identity byte preservation, current and historical reads, run generation, report generation, rejected conversions, unsupported versions, alias protection and partial bulk results.

The reviewer also ran an independent offline owning-operation smoke with `mise exec -- node /tmp/twg-review-64a33-smoke.mjs`. Its temporary script and fixtures were removed after execution. Both Bun/TypeScript and Node emitted twg-benchmark-run/v2 with protocol 0.1.0. Each used completed control/test text fixtures and an exact prompt file with UTF-8 and trailing whitespace. Both used --no-judge. The smoke then checked result, manifest and progress, rendered current and historical results, retried the existing run directory, rejected a historical result upgrade, and rejected an unknown explicit result version.

Observed for each runtime: prompt_preserved=true, protocol=0.1.0, unobserved_metrics=null, integrity_valid=false, immutable_bytes_preserved=true, historical_bytes_preserved=true, unsupported_rejected_unchanged=true. Existing-directory run, historical-result upgrade and unsupported-result check exited 1 as expected. Successful reads and renders exited 0. Null measurements and failed isolation findings remained evidence, not invented success.

The Spec child separately used the actual base-commit Node producer, then read and rendered its historical artifacts through both current runtimes. All reads and renders exited 0 with unchanged historical result bytes. Changed prompt text with an unchanged hash failed in both runtimes: "Result prompt hash does not match the stored prompt."

The Standards child checked numeric-v1 and unknown configuration fixtures through the owning Node command. Numeric-v1 succeeded without rewriting. Unknown /v99 failed with "Unsupported configuration schemaVersion; use a declared historical reader or the current record contract." Source bytes remained unchanged.

Recorded implementation inputs were also read: events/implementation-0002.yaml, events/start-complete-0003.yaml, artifacts/snapshots/pr-draft-implementation-0002.md and artifacts/evidence/contracts-001 (source identity, command records, persisted records and observations). These are implementation evidence, not new review runs.

## Integration checks
`{"argv":["mise","exec","--","node","--test","mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/contracts.test.mjs"]}`

`{"argv":["mise","exec","--","bun","mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/runner.ts","check","configuration","mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/contract.json"]}`

`{"argv":["mise","exec","--","node","mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/runner.mjs","check","configuration","mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/contract.json"]}`

## Review sessions and limits
Fresh Standards run: 44100f6e-aa26-4e57-9c6e-8237bebda665. Fresh Spec run: f9e9179d-6f7a-4eeb-814d-db8165cb1b9d. Both ran concurrently at depth 2. Their typed code-review-axis/v1 results were independently read, verified and acknowledged. Both owned tabs were removed. Resource observations confirmed shutdown for both runs. Terminal closure initially left stopped owned processes; verified run tags and start ticks limited final termination to those owned processes.

No paid live research, live judge, external mutation, browser visual audit, commit or push occurred. HTML generation and stored content were exercised; visual layout was not audited. No source, tests, configuration, generated files, tracker comments or projections changed. The receipt writer verifies frozen source identity and clean state before publication. No evidence run was invented.

Standards: 0 blocking findings, 1 nonblocking possible Divergent Change (STD-S1). Spec: 0 findings. Worst issue per axis: none blocking.

