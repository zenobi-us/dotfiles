---
description: Read-only frozen review
title: "Frozen independent review: pi-shared-context-ux-02-initiatives"
type: Report
---

# Frozen independent review: pi-shared-context-ux-02-initiatives

Assess the approved initiative-navigation slice for the workflow coordinator and source maintainer.

Date: 2026-10-27T23:57:20.073464+00:00. Review attempt: 1. Receipt: review-0014.

## Overview

Verdict: FAILURE. Standards passed with one advisory. Spec failed with four P2 findings, all reproduced through the complete modal. The focused-suite run also has an unresolved dependency-loading gap. Keep this source out of merge until a fix and fresh review pass.

Use the [canonical ticket](../../../../tracker/tickets/pi-shared-context-ux-02-initiatives.md) for requirements, not this review as a replacement specification.

Navigation: [Scope](#scope), [Standards](#standards), [Spec](#spec), [Validation](#validation), [Accounting](#accounting), [Next step](#next-step).

## Scope

Ticket: `tracker/tickets/pi-shared-context-ux-02-initiatives.md`. Backend: `local-markdown`.
Parent specification: `tracker/initiatives/pi-shared-context-tui-ux-spec/index.md`.
Source branch: `feature/pi-shared-context-ux-02-initiatives`. Base: `master`.
Frozen commit: `7c647581807920320efa191f946b8ce9183558b7`.
Frozen tree: `22cc10c0b34ecb19a066fcf2efce821a6a41cbe7`.
Source worktree: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives`.

The review inspected all ten committed changes against the merge base with `master`. It did not review uncommitted canonical-checkout edits.

The extension directory is `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/`. Changed files are `data.ts`, `data.test.ts`, `explorer.ts`, `explorer.test.ts`, `index.ts`, `modal.ts`, `modal.test.ts`, `model.ts`, and `projects.test.ts`. The tenth file is `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/README.md`.

Context inputs: `CONTEXT-MAP.md`, `docs/agents/domain.md`, and `docs/adr/index.md`. `CONTEXT.md` is absent. NO ADR applies because the ADR index contains no recorded decision for this area. Mixed-item expansion, full description readers, event presentation, and queue redesign remain later-ticket scope.

The frozen source and source-branch tip stayed exact. The final source status was clean. `master` advanced externally during review; its final tip was `1b662a14c312a07e21049410e9384973611dce14`. No source, test, configuration, tracker, or generated file changed in this review.

## Standards

Standards verdict: SUCCESS. No blocking documented-standard violation was found in the ten-file frozen diff.

Hard violations: none. AGENTS.md requires short, plain language and routes Markdown work through mq. CONTEXT-MAP.md and docs/agents/domain.md define context ownership and domain entry points. docs/adr/index.md records no relevant decision; NO ADR applies. CONTEXT.md is absent. No CONTRIBUTING or CODING_STANDARDS document was found.

Judgement call STD-J1 (P3, Duplicated Code): explorer.ts:608 and :698 both use body.split(/\r?\n/).map(line => line.trim()).find(...) to select the initiative summary. Consider one helper so summary-selection changes cannot diverge. This is nonblocking.

Reviewed all ten committed files, including tests and navigation documentation. Skipped tooling-enforced formatting and type trivia. No tests, compiler, formatter, or runtime acceptance ran in this axis. The main reviewer owns behavioral validation. LSP references were attempted but initialization failed because the workspace has no valid TypeScript installation. No source or tracker files changed.

[Standards receipt](../../events/standards-result-0010.json) preserves the independent report.

STD-J1 is advisory, not a required redesign. It concerns [explorer.ts:608 and :698](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts#L608-L698). Its optional change is one shared summary-selection helper. Static validation: `git diff master...7c647581807920320efa191f946b8ce9183558b7 -- mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts`.

## Spec

The independent Spec axis reported four P2 blockers. Main-reviewer modal runs reproduced each one. [Spec receipt](../../events/spec-result-0011.json) preserves the original static-analysis findings. NO ADR applies to all four findings.

### UX02-SPEC-001: Clear stale child targets after membership changes

Location: [explorer.ts:204–207](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts#L204-L207).
Requirement: “Live updates preserve selection by record identity. Record removal displays an explanation and selects a nearby record or its parent.”

A1 moves to Ungrouped while its detail stays open. Esc returns to empty A, but Enter and Ask Matt still target A1. Reconcile membership for detail and action screens. Restore a visible child or parent before return navigation.

### UX02-SPEC-002: Retain queues when an unrelated initiative disappears

Location: [explorer.ts:194–198](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts#L194-L198).
Requirement: “Live updates preserve selection by record identity.”

All queues selects B1. Removing remembered initiative A forces the view to initiatives although B1 survives. Limit initiative-removal navigation to views that depend on that initiative. Keep the queue, selected record, and viewport.

### UX02-SPEC-003: Keep selection visible after layout changes

Location: [explorer.ts:800–807](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts#L800-L807).
Requirement: “Keep the selected row and essential navigation controls visible.”

At 40x12, expanding a preceding title hides selected B while actions still target B. Actual Pi also lost ticket02 visibility after resize. Reconcile layout changes with the viewport without breaking deliberate paging or canonical selection.

### UX02-SPEC-004: Preserve narrow count fields

Location: [explorer.ts:849](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-02-initiatives/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts#L849).
Requirement: “Status and count fields remain distinct. Narrow layouts move secondary information to another line.”

At 40x12, `awaiting-maintainer-review` clips `Items: 2` permanently. Paging does not recover the count. Wrap phase and count independently, or move Items to another line when necessary.

Reproduction commands: `NODE_PATH=/tmp/ux02-deps/node_modules mise exec -- bun --tsconfig-override /tmp/ux02-review-0014-tsconfig.json /tmp/ux02-review-0014-smoke.ts` and `NODE_PATH=/tmp/ux02-deps/node_modules mise exec -- bun --tsconfig-override /tmp/ux02-review-0014-tsconfig.json /tmp/ux02-review-0014-smoke.ts --narrow-only`. The temporary files were removed. [Reproduction recipe](../evidence/review-0014/modal-reproduction-recipe.json) preserves their exact script and compiler configuration. [Modal observations](../evidence/review-0014/modal-reproductions.json) prove findings 001–003. [Unique-count observation](../evidence/review-0014/narrow-phase-reproduction.json) proves finding 004. The initial count probe was inconclusive because another row shared the count; the refined probe isolates it.

## Validation

**Focused suite:** Ran once after both axes finished. Command: `NODE_PATH=/tmp/ux02-deps/node_modules mise exec -- bun --install=fallback test mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context`. Result: exit 1; 87 pass, 5 fail, 5 module-loader errors. Bun could not resolve `@earendil-works/pi-tui` from five test modules. [Full suite log](../evidence/review-0014/focused-tests.txt) records the errors. No source fix or suite rerun followed.

**VAL-001, P2 validation blocker:** Complete-suite coverage remains unavailable. The dependency boundary is `extensions/pi-shared-context/package.json:8`. Supply working temporary external ESM dependency resolution before validating a corrected revision. This is an environment gap, not proof of a source regression. NO ADR applies.

**Scoped TypeScript:** `NODE_PATH=/tmp/ux02-deps/node_modules mise exec -- bun /tmp/ux02-deps/node_modules/typescript/bin/tsc --project /tmp/ux02-review-0014-tsconfig.json --pretty false` exited 0. [Scoped configuration](../evidence/review-0014/scoped-tsconfig.json) keeps the implementation include boundary and adds only external dependency resolution. It covers the extension, affected tests, imported shared-context modules, and ambient types. No broad bundle check ran. The configured language server could not initialize without workspace TypeScript; no source dependency was installed.

**Exercised modal behavior:** The temporary script used real `GraphExplorer` and `SharedContextModal` with injected snapshots. Input and rendering used the public modal interface. All four Spec failures reproduced. These runs do not replace the incomplete affected suite.

**Actual Pi:** Pi v1.1.0 loaded the exact worktree extension with `--offline --no-session --no-extensions --no-mcp --no-skills --no-prompt-templates --no-context-files --no-tools --no-themes --use-theme dark -e <frozen-extension>`. The run used real source-worktree records, not fixture records. It exercised initiative-first entry, children, existing ticket detail, Esc return, keyboard ancestor activation, Files, and All queues. Captures cover 120x40, 80x24, and 40x12. The 40x12 resize exposed finding 003. [Runtime ledger](../evidence/review-0014/pi-runtime-ledger.json) records operations and clean exit 0. [Actual medium capture](../evidence/review-0014/pi-children-80x24.svg) retains terminal output; native SVG loses colour/alignment, so use the matching JSON and spans for exact fields. `pi-root-120x40.json` predates settled rendering; `pi-root-settled-120x40.json` is authoritative for that screen.

**Recorded implementation evidence:** Inspected wide colour rows, narrow monochrome rows and focus, medium mouse return, root counts, unreadable state, and refresh-failure state. These are prior implementation observations, not this reviewer’s runtime. Their PNGs reconstruct recorded text and RGB spans. Own runtime used the dark theme only. Historical ticket01 root-mismatch warnings remained visible and unchanged; this review did not repair historical receipts or weaken safety.

## Accounting

Standards session `01a17fc2-42df-72f0-aa0f-feffdad54f0b`, goal `15b73df12d7cc476`: native completion 116805/241808; full provider work tokens 117116.

Spec session `01a17fc2-42da-716f-a036-98944349d16e`, goal `15b73df12d799952`: native completion 128543/241808; full provider work tokens 128819.

Both helpers used zero model tokens before goal activation. Both received native budget 241808, completed normally, and ended with `goal.complete` as their last tool call. Their final responses are included in full-session totals. Both panes closed successfully. Provider work tokens equal input + output + cacheWrite, excluding cacheRead. Both sessions stayed below 250000.

Main session `01a17fbf-7c11-74bd-b026-a5fc13a2163e`, goal `15b73d332f4be716`: observed native snapshot 225033/241808 before artifact preparation. Provider work checkpoint: 230074. These are checkpoints, not final-session totals. The coordinator must audit through the final response. No goal reset or budget increase ran.

Goal run: `ux-rest-7ec8ff00-4758-43aa-94fb-7baf30d40135`. Main reservation: `dispatch-reserved-0014.yaml`; Standards: `dispatch-reserved-0015.yaml`; Spec: `dispatch-reserved-0016.yaml`, under `workflows/goal-pi-shared-context-tui-ux-spec/events/`.

## Next step

Run the approved fix phase against this frozen source. Resolve the four Spec blockers and the validation gap. Then obtain a fresh independent review of the new commit and tree. The parent owns tracker updates, projections, helper completion receipts, and merge decisions.

Axis totals: Standards 1 advisory, 0 blockers, worst P3; Spec 4 blockers, worst P2. Validation separately retains one P2 environment blocker. Overall verdict: FAILURE.
