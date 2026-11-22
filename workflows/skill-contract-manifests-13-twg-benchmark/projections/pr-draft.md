---
title: TWG benchmark implementation draft
type: Concept
---

# Implementation draft

## Ticket

[skill-contract-manifests-13-twg-benchmark](../../../tracker/tickets/skill-contract-manifests-13-twg-benchmark.md) — Adopt contracts in TWG benchmark runs.

## Problem

Numeric schemas tied independent configuration and run formats together. Stored result rendering did not reject unsupported schemas. The Node module did not expose matching owning commands.

## Implementation

Added benchmark-owned configuration, result, manifest, judgement, run-payload and progress contracts. Both runtime implementations use the shared manifest resolver and explicit known historical readers. New output uses record-family schemaVersion identifiers, independent of protocol contractVersion and runtime releases. Configuration-only safe and bulk upgrades use the shared writer and preserve all non-identity bytes. Results, manifests, judgements, run payloads and progress remain immutable history. Stored reports never trigger replacement tasks. New output directories and report alias guards protect evidence. Prompts, paired-arm labels, integrity findings, measurements, safety settings and protocol 0.1.0 retain their meaning.

Source branch: feature/skill-contract-manifests-13-twg-benchmark. Base: master. Source commit: 33b388888ecb2dbbe46cde0d76f604946c925734. Source tree: 6bf7cadb7209cb53e0a85d62d7107ae201c38c2f.

Source commits: a3aa4c6f (implementation), 33b38888 (guidance). Repository commit hooks also updated developer plugin and marketplace versions. No shared contract interface changed.

## Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/contracts.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/references/configuration-upgrade.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/references/contracts.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/cli.mjs`
- `mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/configuration-owner.mjs`
- `mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/contract.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/contracts.test.mjs`
- `mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/records.mjs`
- `mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/report-renderer.mjs`
- `mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/report-renderer.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/runner.mjs`
- `mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/runner.ts`

## Validation

The final command `mise exec -- node --test /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-13-twg-benchmark/mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-bench-lite/scripts/benchmark-lite/contracts.test.mjs` ran from `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-13-twg-benchmark` and exited 0. Both Bun/TypeScript and Node/MJS command suites passed.

Direct smoke used stored deterministic arm fixtures, not paid live tasks. It observed 18 successful owning commands and six expected rejections. Both runtime implementations validated numeric configuration, generated artifacts and run payloads, read current and numeric historical results, rendered HTML, and rejected immutable upgrades, unknown explicit schemas and existing output directories without changing evidence bytes. The Node smoke selected Rovo; the Bun smoke selected Codex. Both disabled the live judge.

Shared manifest validation and historical result-definition resolution each exited 0. Complete exact argv, absolute cwd, exit codes, stdout and stderr are in [commands.json](../artifacts/evidence/contracts-001/commands.json). Stored record samples, generated HTML and byte-preservation observations are in [contracts-001](../artifacts/evidence/contracts-001/).

Regression coverage also checks measurement mapping, unknown authored metadata, lossless large numeric lexemes, current-input byte equality, prompt/hash mismatch, paired-arm label mismatch, mixed and unknown schema identities, report symlink/hard-link protection, historical unversioned judgement/progress and partial bulk upgrades.

No paid live research, external mutation, or browser visual audit ran. No service was started. The existing TypeScript language server could not initialize because this workspace has no valid TypeScript installation; actual Bun execution checked the TypeScript entrypoint.

## Review history

Latest reviewer verdict: SUCCESS for `33b388888ecb2dbbe46cde0d76f604946c925734`. [Review review-0005](../artifacts/reviews/review-review-0005.md), [review receipt](../events/review-0005.yaml), [parent completion](../events/review-complete-0006.yaml). No blocking findings or required fixes. One nonblocking Standards design judgment is retained in the review artifact. No earlier review exists.

## Open questions

None.

## Merge status

Squash integration `21e3f6c74e2461fdc2850f063656ff07f3872c93` is published to `origin/master`. Ticket completed and published in `6b39c119aea0a1705e931b1438322c5e734581b8`. Candidate-bound checks and offline run/render smoke passed in both runtimes. Source and integration worktrees were removed; owned process shutdown is confirmed. [Terminal finish receipt](../events/finish-0013.yaml), [integration result](../artifacts/snapshots/integration-result-0008.json), [cleanup](../artifacts/snapshots/cleanup-result-0011.json).

## Supporting records

- [Start receipt](../events/start-0001.yaml)
- [Implementation receipt](../events/implementation-0002.yaml)
- [Command evidence](../artifacts/evidence/contracts-001/commands.json)
- [Source and validation identity](../artifacts/evidence/contracts-001/source.json)

