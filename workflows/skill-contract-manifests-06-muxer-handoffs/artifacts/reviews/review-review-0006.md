---
date: 2026-11-22T02:46:23.952Z
title: Independent muxer handoff review
type: Report
---

# Independent muxer handoff review

Verify the frozen implementation against the ticket and contract boundaries.
Reader: worktree coordinator. Date: 2026-11-22T02:46:23.952Z.

## Overview

Verdict: SUCCESS. No blocking findings. The parent must validate this receipt before completing the review phase. This verdict covers only the frozen source below. Integration, publication, tracker updates, and reviewer-pane closure remain parent work.

## Frozen review inputs

- **Ticket:** [Muxer handoff ticket](../../../../tracker/tickets/skill-contract-manifests-06-muxer-handoffs.md).
- **Initiative:** [Skill contract specification](../../../../tracker/initiatives/skill-contract-manifests/index.md).
- **Source branch:** `feature/skill-contract-manifests-06-muxer-handoffs`; base branch: `master`.
- **Reviewed commit:** `e8d4f1d2b5a1ea6d16248ba79426e80558a9f357`.
- **Reviewed tree:** `a52fb75b3f43306ade529d963e1351223ed1bfc5`.
- **Frozen review base:** `d0334a6438501d29995f05d7da3f749da8e94645`.
- **Scope:** The muxer-subagents skill, agent-core plugin metadata, and marketplace metadata. The implementation diff contains 26 files. Base-only changes were not treated as implementation deletions.
- **Consumed records:** [Implementation receipt](../../events/implementation-0002.yaml), [implementation snapshot](../snapshots/pr-draft-implementation-0002.md), [implementation validation](../snapshots/validation-implementation-0002.json), and [review authorization](../../events/review-start-0005.yaml).

No applicable muxer ADR (architecture decision record) exists in the ADR index. The initiative, muxer record definitions, completion guide, and result-delivery owner contracts govern this review.

## Standards

No documented-standard breaches or blocking maintainability findings.

The manifest reuses the shared validator. Transport definitions point to result-delivery rather than competing copies. [Record validation](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-06-muxer-handoffs/mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents/scripts/records.ts#L7-L48) keeps owner content validation local. [The shell launcher](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-06-muxer-handoffs/mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents/scripts/shell-launch.ts#L20-L44) uses the same completion writer as native muxers.

I preserved source, tests, configuration, generated files, tracker records, and commits. The focused suite ran from an external copy. Test dependencies and version-qualified import links existed only under `/tmp/muxer-independent-review-f2vQVI`.

## Spec

All four acceptance criteria passed the exercised boundaries.

1. **Contract ownership:** The manifest declares current producers, current and historical readers, and no upgrades. All 15 definition references resolved from the source skill while the caller directory was `/tmp`.
2. **Producer-consumer cutover:** Real spawn returned `muxer-spawn/v2` and created a `result-delivery/v2` context. The result bound the assigned run, operation, reference, domain contract, and payload hash. [Spawn allocation](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-06-muxer-handoffs/mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents/scripts/spawn.ts#L63-L123) preserves these separate identities.
3. **Actual lifecycle:** The real child completed through native waiting. Its domain result intentionally reported failure. Owning result read and acknowledgement succeeded. Completion did not imply domain success or process shutdown.
4. **History and rejection:** Explicit historical command reads and waits preserved every fixture byte. The default reader rejected legacy input. Historical transport passed both owner retrieval and muxer context consumption without rewriting files. Unknown resource versions and symlinked evidence failed without changing evidence or the external result sentinel.

[Completion storage](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-06-muxer-handoffs/mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents/scripts/signals.ts#L119-L170) rejected a conflicting terminal update and retained sequence bytes. [The evidence reader](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-06-muxer-handoffs/mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents/scripts/evidence.ts#L7-L32) verifies completion and process filename identities. Focused tests also cover run mismatches, PID reuse, permission failures, owned descendants, and preserved transport results.

Findings: none. Standards: 0. Spec: 0.

## Validation and operational limits

- **Focused suite:** `mise exec -- bun test muxer-subagents/scripts`, cwd `/tmp/muxer-independent-review-f2vQVI`: exit 0; 54 passed, 0 failed, 153 assertions. The copy contains the source muxer, result-delivery, and skill-contracts directories. Dependencies: Ajv 8.20.0, @crustjs/core 0.0.19, @crustjs/plugins 0.1.2. No source dependency links were created.
- **Manifest command:** Installed skill-contracts `scripts/router.ts validate --skill /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-06-muxer-handoffs/mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents`, cwd `/tmp`: exit 0; 15 definitions resolved.
- **Current contracts:** Source `scripts/router.ts contracts --muxer herdr-app --agent omp`: exit 0; explicit child run and v2 delivery context matched the assigned review handoff.
- **Real smoke:** Run `11ccc401-8d7d-4420-a58f-71c6bc3b4319`; operation `review-0006-smoke`; parent run `ea1d84af-4b39-4b63-9129-d27c615af4f2`; child depth 2. Spawn used the source router with `--result-schema muxer-review-smoke/v1`. Native `wait --timeout 180000` returned completed sequence 2. The retrieved payload had `status: failed` and `reason: intentional-domain-failure`. Verified payload SHA-256: `5d04a6c84c1634bc0b1981e14212bffe9e9b19dfe16b85ace2028c434c261e56`.
- **Owned closure:** Resource observation reported pending before closure. `hc kill` and `hc rm` removed only the smoke terminal. The app listing confirmed its removal. A stopped OMP process remained. I rechecked its boot ID, start ticks, and assigned run tag, then sent SIGTERM and SIGCONT to that exact owned PID. Final source `resources 11ccc401-8d7d-4420-a58f-71c6bc3b4319` returned exit 0 and `shutdown: confirmed`. Completion sequences and transport results remained retained. This terminal-runtime observation is not an implementation finding.
- **Boundary scenarios:** External throwaway programs invoked source `read`, `wait --historical`, `resources`, and result-delivery `read`. Expected historical successes and safe-rejection exits matched. SHA-256 comparisons proved unchanged legacy bytes and rejected-operation evidence. The temporary fixture directories were removed.
- **Integration check:** Retain the handoff command `mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents/scripts` for the integration candidate. The parent must provide the same dependency resolution if Bun test cannot resolve version-qualified imports. I did not run an integration candidate or a typecheck.

Retained real-smoke evidence:

- **Evidence checksum:** `file:///var/home/zenobius/.local/state/muxer-subagents/runs/11ccc401-8d7d-4420-a58f-71c6bc3b4319/run.json`; SHA-256 `6e082b33a3549426e3ae8b53cb427b853a45bce343580e85c11d3f84c5ffc87e`.
- **Evidence checksum:** `file:///var/home/zenobius/.local/state/muxer-subagents/runs/11ccc401-8d7d-4420-a58f-71c6bc3b4319/signal-2.json`; SHA-256 `e5c5039ff05953b1dc1dc4018b541932cd64014b535aa22cbcd945a5822655b0`.
- **Evidence checksum:** `file:///var/home/zenobius/.local/state/muxer-subagents/runs/11ccc401-8d7d-4420-a58f-71c6bc3b4319/resources.json`; SHA-256 `da4298ff3cea914777d57f1971bbba1399c0eac8fbdf0c6835083154b3a12948`.
- **Evidence checksum:** `file:///var/home/zenobius/.local/state/result-delivery/runs/11ccc401-8d7d-4420-a58f-71c6bc3b4319/context.json`; SHA-256 `3ad1bace166813f1a2bcebe96927036f578e5cf20ce037ab7bcf65622db4fa80`.
- **Evidence checksum:** `file:///var/home/zenobius/.local/state/result-delivery/runs/11ccc401-8d7d-4420-a58f-71c6bc3b4319/result.json`; SHA-256 `fa50a1273a757a46233a3cabbb1f5601620925b737d7d01083036a02e7ed5aca`.
- **Evidence checksum:** `file:///var/home/zenobius/.local/state/result-delivery/runs/11ccc401-8d7d-4420-a58f-71c6bc3b4319/result.json.ack.json`; SHA-256 `709fcfede6c073e7c460605fe3f5fb2284b143d60686e66d6e144f9d7747fc3f`.

