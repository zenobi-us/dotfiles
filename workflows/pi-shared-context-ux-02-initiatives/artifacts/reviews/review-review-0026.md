---
description: Fresh read-only review of d1ad6dba; attempt 2
title: "Frozen independent review: pi-shared-context-ux-02-initiatives"
type: Report
---

# Frozen independent review: pi-shared-context-ux-02-initiatives

Assess the approved initiative-navigation slice for the workflow coordinator and source maintainer.

Date: 2026-10-28T00:35:37.794020+00:00. Attempt: 2. Receipt: review-0026.

## Overview

Verdict: FAILURE. Standards passed with one nonblocking advisory. Spec failed with two P2 blockers. Both blockers reproduced in actual Pi.

All five previous blockers are resolved on this frozen source. The complete affected suite and scoped TypeScript passed. Those checks do not cover the two remaining navigation failures.

Use the [canonical ticket](../../../../tracker/tickets/pi-shared-context-ux-02-initiatives.md) for requirements. The parent owns tracker updates, projections, helper completion receipts, and any new fix dispatch.

Navigation: [Scope](#scope), [Standards](#standards), [Spec](#spec), [Previous blockers](#previous-blockers), [Validation](#validation), [Accounting](#accounting), [Next step](#next-step).

## Scope

Ticket: `pi-shared-context-ux-02-initiatives`. Backend: `local-markdown`. Ref: `tracker/tickets/pi-shared-context-ux-02-initiatives.md`.

Parent specification: [pi-shared-context-tui-ux-spec](../../../../tracker/initiatives/pi-shared-context-tui-ux-spec/index.md).

Source branch: `feature/pi-shared-context-ux-02-initiatives`. Base: `master`.

Frozen commit: `d1ad6dbabb7131de2910334f2b750f8586a0e4ca`. Frozen tree: `80f4559a9f6cbe6e51d2e102480714703eac160f`.

Source worktree: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives`.

Reviewed all ten committed files against the merge base with `master`. The four source commits are `7c647581`, `d360076d`, `a3c89c7b`, and `d1ad6dba`. [Full frozen diff](../evidence/review-0026/frozen-source.diff) and [correction diff](../evidence/review-0026/correction.diff) preserve the scope.

Changed extension files: `data.ts`, `data.test.ts`, `explorer.ts`, `explorer.test.ts`, `index.ts`, `modal.ts`, `modal.test.ts`, `model.ts`, and `projects.test.ts`. The tenth file is the shared-context CLI `README.md`.

Read `CONTEXT-MAP.md`, `docs/agents/domain.md`, and `docs/adr/index.md` through mq. `CONTEXT.md` is absent. NO ADR applies because the ADR index contains no recorded decision for this area.

Mixed-item expansion, full description readers, event presentation, and queue redesign remain outside this ticket. Uncommitted canonical-checkout edits were not reviewed. The historical implementation budget overage has recorded continuation approval; it is not a new blocker.

## Standards

SUCCESS — Standards only. No hard violations found against AGENTS.md communication rules, CONTEXT-MAP.md ownership rules, or docs/agents/domain.md. NO ADR: docs/adr/index.md lists no decisions. Judgement call STD-02-J1 (low, nonblocking): explorer.ts:619 and :709 repeat the same summary selector. Optionally extract one helper to prevent drift. Reviewed all ten files in master...d1ad6dba, including the full correction code. Refresh reconciliation, viewport tracking and narrow phase/count separation have explicit local logic. Queue and collection rows share childRow. Frozen commit and tree match the handoff. The reviewed files match HEAD. Tests, builds, compiler, formatter and runtime checks were not run by this axis. LSP initialization failed because TypeScript was unavailable. Main reviewer must run affected validation after both axes finish; this verdict does not certify Spec or VAL-001.

[Independent Standards receipt](../../events/standards-result-0022.json).

STD-02-J1 is the same optional summary-selector concern as historical STD-J1, not another blocking requirement. The repeated selector appears at [explorer.ts:619](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts#L619) and [explorer.ts:709](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts#L709). Main TypeScript validation passed after the axis completed.

## Spec

FAILURE. Two specification gaps remain. UX02-SPEC-005: actual Pi at 40x12 returns from Events to a child-list pane instead of the saved ticket overview. Esc and the ticket ancestor both lose the visible reading context. UX02-SPEC-006: static control flow redirects an unrelated action menu when a remembered ticket disappears. The selected queue ticket can still exist. Both findings violate retained navigation or selection requirements. The four original correction paths are present, but ticket-removal handling still lacks active-target scoping. No scope creep was found. Mixed items, description readers, event redesign and queue redesign remain outside this slice. No tests, compiler or formatter ran in this axis. The main reviewer owns the single affected validation run, including VAL-001.

[Independent Spec receipt](../../events/spec-result-0023.json). Main verification subsequently reproduced UX02-SPEC-006 in actual Pi. The axis reports remain separate.

### UX02-SPEC-005: Restore the compact ticket overview on return

Severity: P2. ADR: NO ADR. Ticket criterion 9 requires: “Esc returns one level and restores selection and scroll position.”

Location: [explorer.ts:458–465](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts#L458-L465), [ancestor return:406–411](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts#L406-L411), and [compact pane selection:598–603](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts#L598-L603).

At 40x12, enter alpha and A1. The ticket overview is visible. Enter Events, then press Esc. The returned view shows the child-list pane instead of the overview. The canonical A1 identity survives, but the reading context is hidden. The Spec axis also reproduced the ticket-ancestor path.

Required change: Restore the overview pane on compact return from Events and ticket-ancestor activation. Keep its saved scroll position. Do not unconditionally assign list focus to that destination.

Validation command:

```sh
termscope session --cols 40 --rows 12 -- pi --offline --no-session --no-extensions --no-mcp --no-skills --no-prompt-templates --no-context-files --no-tools -e /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/index.ts
```

Scenario: In a disposable tracker, open an initiative and child. Page its overview, open Events, and return through Esc and the ticket ancestor. The overview must return at its saved position.

Evidence: [overview before](../evidence/review-0026/pi-005-overview-before-40x12.json), [Events](../evidence/review-0026/pi-005-events-40x12.json), and [wrong return pane](../evidence/review-0026/pi-005-returned-40x12.json).

### UX02-SPEC-006: Scope ticket-removal navigation to the active target

Severity: P2. ADR: NO ADR. Ticket criteria 10 and 13 require retained selection and existing action behavior.

Location: [explorer.ts:193–219](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts#L193-L219), specifically line 205. Queue action targets use a different selection at [explorer.ts:770–774](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts#L770-L774).

Read A2 through alpha, return home, select B1 in All, and open B1 actions. Remove only remembered A2 and update membership consistently. The watcher closes B1 actions and redirects to empty alpha. B1 still exists. The visible canonical reference changes away from `tracker/tickets/B1.md`.

Required change: Gate removal navigation on the active logical screen and selected canonical target. Reconcile inactive remembered ticket state without closing an unrelated queue or initiative action menu.

Validation command:

```sh
termscope session --cols 120 --rows 40 -- pi --offline --no-session --no-extensions --no-mcp --no-skills --no-prompt-templates --no-context-files --no-tools -e /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/index.ts
```

Scenario: Use an external tracker with A2 and B1. Follow the sequence above, delete only A2, and keep membership valid. B1 actions, selection, and queue viewport must remain unchanged. Also cover a home initiative action menu with an inactive remembered child.

Evidence: [B1 actions before deletion](../evidence/review-0026/pi-006-b1-actions-before-removal-120x40.json), [empty alpha after deletion](../evidence/review-0026/pi-006-b1-actions-after-removal-120x40.json), and [complete runtime ledger](../evidence/review-0026/pi-runtime-ledger.json).

## Previous blockers

Each previous blocker is resolved for its original reported scenario. UX02-SPEC-006 is a distinct inactive-ticket removal case, not proof that unrelated initiative removal still fails.

- **UX02-SPEC-001 — resolved.** [Complete-modal regressions:133–167](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.test.ts#L133-L167) cover readers, receipts, action menus, nearby canonical targets, and empty-parent no-dispatch. Actual Pi moved A1 to Ungrouped, closed its reader, explained the removal, and selected A2. [Recorded result](../evidence/review-0026/pi-001-reader-reconciled-120x40.json).
- **UX02-SPEC-002 — resolved.** [Regression:169–188](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.test.ts#L169-L188) preserves queue viewport and canonical T-2. Actual Pi kept B1 selected in All after remembered alpha disappeared. [Before](../evidence/review-0026/pi-002-queue-before-initiative-removal-120x40.json) and [after](../evidence/review-0026/pi-002-queue-after-initiative-removal-120x40.json).
- **UX02-SPEC-003 — resolved.** [Regressions:190–222](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.test.ts#L190-L222) cover resize, preceding-title expansion, canonical child targets, and deliberate paging on unchanged layouts. Actual Pi kept Beta visible across resize. [Narrow result](../evidence/review-0026/pi-selected-beta-resized-40x12.json).
- **UX02-SPEC-004 — resolved.** [Regression:224–237](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.test.ts#L224-L237) reads the full phase and unique Items count. Actual Pi at 40x12 exposed the complete long phase across pages and `Items: 2` on a separate line. [Phase start](../evidence/review-0026/pi-phase-page-0-40x12.json) and [phase end plus count](../evidence/review-0026/pi-phase-page-1-40x12.json).
- **VAL-001 — resolved.** The complete affected suite loaded all 11 files through temporary real-package ESM links. It passed 133 tests with 1809 expectations. Scoped TypeScript also passed. No mocks, suppressed errors, omitted files, or dependency-version changes were used.

## Validation

The main reviewer ran the complete extension and shared-context suite once, after both independent axes finished:

```sh
mise exec -- bun --install=fallback test mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context
```

Result: 133 pass, 0 fail, 1809 expectations across 11 files. [Test output](../evidence/review-0026/focused-tests.txt).

```sh
mise exec -- bun /tmp/ux02-deps/node_modules/typescript/bin/tsc --project /tmp/ux02-review-0026-tsconfig.json --pretty false
```

Result: exit 0. Scope includes the extension, affected tests, imported shared-context modules, and ambient declarations. [Compiler output](../evidence/review-0026/scoped-typescript.txt), [exact config](../evidence/review-0026/scoped-tsconfig.json), and [temporary real-package links](../evidence/review-0026/dependency-links.json). Mise emitted the existing undefined `DOTFILE_REPO_ROOT` warning; it did not affect either check.

Actual Pi v1.1.0 loaded the explicit frozen worktree `index.ts` through termscope. The run used disposable versioned tracker records, real loaders, and the filesystem watcher. It exercised root → initiative → child, compact selection, resize, long phase/count paging, reparenting, queue preservation, and both remaining defects.

Skills were disabled. No model request or action dispatch ran. Canonical dispatched targets are covered by the complete-modal suite. The first compact probe inherited list focus; it was not used as proof. The later settled-key probe established the overview before reproducing UX02-SPEC-005.

The fix's six colour/monochrome captures at 40x12, 80x24, and 120x40 were inspected, not rerun by this reviewer. They show type/ID/title/state separation and selected backgrounds. Their PNGs reconstruct native recorded text and RGB spans; they are not untouched native screenshots. The fix ledger retains the primary terminal data.

- **Colour matrix:** [40x12](../evidence/fix-0017/rgb-children-40x12.png), [80x24](../evidence/fix-0017/rgb-children-80x24.png), [120x40](../evidence/fix-0017/rgb-children-120x40.png).
- **Monochrome matrix:** [40x12](../evidence/fix-0017/verified-mono-children-40x12.png), [80x24](../evidence/fix-0017/verified-mono-children-80x24.png), [120x40](../evidence/fix-0017/verified-mono-children-120x40.png).
- **Prior runtime record:** [fix runtime summary](../evidence/fix-0017/runtime-summary.json) and [fix ledger](../evidence/fix-0017/pi-runtime-ledger.json).

[Current validation record](../evidence/review-0026/validation.json), [runtime observations](../evidence/review-0026/runtime-observations.json), and [cleanup/source audit](../evidence/review-0026/cleanup-and-source-audit.json) preserve the evidence. All temporary dependency links, external compiler config, and runtime fixture were removed. Actual Pi exited 0. Both helper panes closed. The frozen source branch, commit, and tree stayed exact; source status is clean. No source, tracker, manifest, lockfile, or generated-code edits were made.

## Accounting

Exactly two fresh reserved axes ran. Both had zero pre-goal assistant messages and native budget 241808 before substantive review. Both completed their native goals with `goal.complete` as the last tool call.

- **Standards:** Session `01a17fe4-d859-713a-83f5-4ffc463c69ee`; native completion 104407/241808; full provider work 104828 tokens. [Full accounting](../evidence/review-0026/standards-accounting.json).
- **Spec:** Session `01a17fe4-d860-7643-a852-a649144d1670`; native completion 149004/241808; full provider work 149438 tokens. [Full accounting](../evidence/review-0026/spec-accounting.json).
- **Main checkpoint:** Session `01a17fe4-4c87-749c-8e09-6a09e726e0da`; goal `15b7466f55195dc5`. Explicit goal.get observed 160427/241808 before result preparation. The later session checkpoint records native 165196 and provider work 165920. Neither is final-session usage. [Checkpoint](../evidence/review-0026/main-accounting-checkpoint.json).

Provider work means input + output + cacheWrite, excluding cacheRead. Helper totals include final responses. The coordinator must audit the main session through its final response. [Bounded activation](../evidence/review-0026/activation-accounting.json) and [helper shutdown](../evidence/review-0026/axis-shutdown.json) are recorded.

Goal run: `ux-rest-7ec8ff00-4758-43aa-94fb-7baf30d40135`. Main reservation: `dispatch-reserved-0028.yaml`; Standards: `dispatch-reserved-0029.yaml`; Spec: `dispatch-reserved-0030.yaml`, under `workflows/goal-pi-shared-context-tui-ux-spec/events/`. No goal was reset, replaced, or increased.

## Next step

Keep this source out of merge. Resolve UX02-SPEC-005 and UX02-SPEC-006 in an approved fix phase, then review the new source independently. No SUCCESS covers the frozen revision.

Axis totals: Standards 1 advisory, 0 blockers, worst low; Spec 2 blockers, worst P2. Validation blockers: 0. Overall verdict: FAILURE.

