---
title: Home Assistant contracts — review-0017
type: Review
---

# Home Assistant contracts — review-0017

Independent acceptance review for the parent coordinator. Date: 2026-11-25T20:39:48.537Z. Reader: ticket maintainer. Requirements: tracker/tickets/skill-contract-manifests-14-homeassistant.md.

## Overview

SUCCESS. No blocking findings. Complete frozen implementation and both authorized prerequisite commits accepted. Standards: zero blocking findings; retained P3 serializer duplication remains nonblocking. Spec: zero findings. Fresh source suite:5 pass. Fresh dispatch regression:1 pass. New isolated-service smoke:18 owning commands passed. No live Home Assistant used. Parent retains integrated-candidate checks, tracker comment, parent completion and finish.

Contents: [Frozen scope](#frozen-scope), [Standards](#standards), [Spec](#spec), [Prerequisite review](#prerequisite-review), [Validation](#validation), [Findings and lifecycle](#findings-and-lifecycle).

## Frozen scope

Ticket: tracker/tickets/skill-contract-manifests-14-homeassistant.md. Initiative: tracker/initiatives/skill-contract-manifests/index.md. Source branch:feature/skill-contract-manifests-14-homeassistant; base:master. Source commit:b0c57a266b38c54f6a02ad1a2d4643f24c12398e; tree:59ddce610e75c9340a56b2bbbc69ce1c39fb47e1. Review base:62c66402d3e677c05eb501ca6ce1d712f6d3704d. Source:/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-14-homeassistant. Publication:/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles. Common Git directory:/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/.git. Initial source status was clean; the owning receipt writer enforces final frozen identity and cleanliness.

Reviewed git diff 62c66402d3e677c05eb501ca6ce1d712f6d3704d...b0c57a266b38c54f6a02ad1a2d4643f24c12398e, including a67bb9fe,6bee44cc,b0c57a26. Actual HA diff:19 files,+1264/-56:

- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/CHANGELOG.md
- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/SKILL.md
- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/bun.lock
- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/contracts.json
- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/package.json
- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts.md
- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts/homeassistant-cleanup-plan-v1.schema.json
- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts/homeassistant-cleanup-plan-v2.schema.json
- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts/homeassistant-reference-report-v1.schema.json
- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts/homeassistant-reference-report-v2.schema.json
- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts/homeassistant-rename-map-v1.schema.json
- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts/homeassistant-rename-map-v2.schema.json
- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts/homeassistant-snapshot-v1.schema.json
- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts/homeassistant-snapshot-v2.schema.json
- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/playbook.md
- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/scripts/ha_ops.ts
- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/scripts/records.ts
- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/tests/cleanup-plan.test.ts
- **Source file:** mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/tests/ha-ops.test.ts

Additional prerequisite diff scope: worktree phase-context.ts, delivery-integration.test.ts, receipts.md, CHANGELOG.md; ticket records.ts and usage.md; developer/matt-pocock plugin.json and marketplace.json. Those prerequisites are base-only, not in frozen HA source.

Affected contracts: homeassistant-snapshot/v1, homeassistant-snapshot/v2, homeassistant-cleanup-plan/v1, homeassistant-cleanup-plan/v2, homeassistant-reference-report/v1, homeassistant-reference-report/v2, homeassistant-rename-map/v1, homeassistant-rename-map/v2, skill-contract-manifest/v1, worktree-phase-context/v2, worktree-receipt/v3, per-phase dispatch reservation binding, tracker-result/v2, external Home Assistant payload and approval/rollback boundaries, external plugin metadata.

No source merge or shared runtime resource was introduced during review. All authored review evidence lives in publication, not source. Unrelated website edits, tickets, worktrees and processes were preserved. Base-only movement does not extend this source verdict.

## Standards

Fresh assigned helper:a3e2c636-9691-49e4-888f-52803835dc2e. No new documented-standard breaches. Shared manifest validation remains authoritative; Home Assistant owns content validation. Retained serializer duplication remains a nonblocking P3 heuristic. No applicable Home Assistant ADR appears in the repository ADR index.

The helper inspected the complete diff, schemas, callers, guidance and prerequisite commits without tests or source edits. Its immutable payload mistakenly labels its axis as spec. Only its Standards section supplies this assigned axis. The separate Spec helper below remains independent. [Full Standards evidence](../evidence/review-0017/standards-axis.json).

## Spec

Fresh independent helper:f5424f53-bf21-435e-a127-725bcce11ac2. No missing requirements, incorrect behavior or scope creep. All four owned record families declare current/historical support. Producers and readers use the contracts. Readers preserve bytes; unknown identities fail before interpretation-dependent remote access. No upgrades are declared because commands do not mutate saved records. External payload ownership, approval and dry-run boundaries remain unchanged.

SPEC-001 remains resolved by cleanup-plan contracts and stderr progress routing. VALIDATION-001 retains all eight serial rejects and exit2 assertions within20-second tests; afterEach kills/awaits children and closes the server. The reviewer ran fresh fixture operations after both helper reports. [Full Spec evidence](../evidence/review-0017/spec-axis.json).

## Prerequisite review

**ab092148a98741bfeb3582704aface14ad4dfe39 — accepted.** Reviewed its complete exact diff. In worktree/scripts/phase-context.ts:123-127, only phase-start can change goal_dispatch_ref. goal_run_id remains fixed. Child results and parent completions still require the parent dispatch. The new public-writer regression rejects changed run, changed completion dispatch and changed child dispatch. Accepted delivery retains the new dispatch and prior receipt bytes. Incidental formatting changes alter no behavior. Receipt docs/changelog agree. Developer and marketplace versions both advance0.2.80→0.2.81. No binding weakening found.

**dcee9de03b64baeac8eff407413078ee1619f9df — accepted.** Reviewed its complete exact diff. Ticket scripts/records.ts:1 adds Bun --install=fallback only. Dependency loading changes; record interpretation, receipt identity and approval do not. Usage docs agree. Matt-pocock and marketplace versions both advance0.1.17→0.1.18. Parent evidence records successful native ticket check. No new findings.

Fresh regression used byte-identical committed phase-context.ts and delivery-integration.test.ts. Ticket records.ts also matches its exact prerequisite blob. [Binding evidence](../evidence/review-0017/prerequisite-binding.json).

## Validation

- **Fresh HA suite:** env -u HA_URL -u HA_TOKEN mise exec -- bun test mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/tests. Exact frozen checkout; exit0;5 pass,0 fail,39 assertions,16.60s. [Evidence](../evidence/review-0017/ha-suite.json).

- **Fresh public regression:** mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts -t 'goal phases reserve distinct dispatches'. Publication checkout; exit0;1 pass,57 filtered,14 assertions. [Evidence](../evidence/review-0017/dispatch-regression.json).

- **Fresh owning commands:** env -u HA_URL -u HA_TOKEN mise exec -- bun --install=fallback /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-14-homeassistant/artifacts/evidence/review-0017/smoke.ts. Exit0;18 commands against a new loopback fixture. [Command/request evidence](../evidence/review-0017/cli-smoke.json).

- **Fixture acceptance:** cleanup emitted populated renames, group changes and warnings. Snapshot preserved entity identity, unknown registry fields, automation configuration and states. Current/historical validation and rollback plans preserved bytes. Declined approval made no mutation. Approved rollback restored requested identity/fields through exactly two fixture updates. Wrong-family, unknown and mixed records made no requests. Existing snapshot replacement was correctly rejected. Rename-map consumption produced a validated v2 report. Fixture server stopped.

- **Fresh manifest validation:** installed skill-contracts/scripts/router.ts validate --skill /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-14-homeassistant/mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops; exit0; all eight definitions resolved. [Evidence](../evidence/review-0017/manifest-validation.json).

- **Consumed parent integration evidence:** mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts;58 pass,0 fail,437 assertions,81.00s after both repairs. Ran before prerequisite commits. Not a fresh reviewer full-suite run. Current reviewed runtime/test blobs match exact commits. Native ticket CLI check also passed in parent evidence. Earlier56-pass/two-failure state was not rerun. [Parent evidence](../evidence/prerequisite-dispatch-20261126/verification.json).

Required integrated-candidate checks remain the full HA directory command and full delivery-integration.test.ts command above. Parent must run both on the actual integrated candidate.

## Findings and lifecycle

No blocking findings. No new nonblocking findings. Retained serializer duplication remains P3. Earlier review-0005 and review-0011 are history, not current verdicts. Consumed review-start-0016, fix-0014, fix-complete-0015 and pr-draft-fix-0014. Goal run:skill-contract-manifests-20261125-t2dv. Dispatch:workflows/goal-skill-contract-manifests/events/dispatch-reserved-0007.yaml.

Fixture children were awaited and server stopped. Both owned axis tabs were killed/removed with hc. Four helper processes survived normal closure. The user then explicitly authorized only those PID/start/boot/run identities. Fresh checks preceded every signal. SIGTERM stopped two processes; SIGKILL stopped the remaining two. Both owning resource reports now confirm shutdown. [Authorization](../evidence/review-0017/shutdown-authorization.json), [escalation](../evidence/review-0017/shutdown-escalation.json), [Standards shutdown](../evidence/review-0017/standards-shutdown-final.json), [Spec shutdown](../evidence/review-0017/spec-shutdown-final.json). The reviewer terminal remains for parent closure.

Standards:0 blocking findings, worst retained issue P3 duplication. Spec:0 findings, no worst issue.
