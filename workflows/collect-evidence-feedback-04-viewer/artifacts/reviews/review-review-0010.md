---
schema: worktree-artifact/v1
type: Concept
title: Independent viewer review attempt 2
---
# Viewer review

## Scope

Ticket: tracker/tickets/collect-evidence-feedback-04-viewer.md (local-markdown).
Branch: feature/collect-evidence-feedback-04-viewer. Base: master.
Frozen source commit: 035fdd61b454eb9b9aa8b0f20fdd3b2ee33ab476.
Frozen source tree: ae1abc62d14257777bb22a4b737add38a0903c71.
Timestamp: 2026-11-12T07:52:47.026Z.
Repository/store: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.
Source workspace: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-04-viewer.
Review command: git diff master...035fdd61b454eb9b9aa8b0f20fdd3b2ee33ab476.

Scope covers changed collect-feedback product files and both plugin registrations. Inherited collect-evidence validation and storage interfaces inform the review. Retained evidence and workflow records are provenance, not extra implementation scope. No source, tests, configuration, generated HTML or source-worktree workflow files changed.

Inputs include the full ticket, initiative, DESIGN.md, CONTEXT-MAP.md, CONTEXT.md, ADR index, implementation-0003, start-complete-0004, review-start-0009, approval-0005 and implementation PR draft. ADR 0001 concerns Pi Ink device cleanup and does not govern this viewer. This is a fresh review; the prior empty artifact and result were not used as proof.

## Standards

One documented-standard violation. DESIGN.md, Components / Cards & Containers, requires finder columns to restore focus to the originating selection when closing or backing out. The asset inspector instead sends focus to the case section. No additional consumer-visible smell findings. Static review only; tests, builds, formatters and browser checks were not run, as instructed. The two plugin registrations only update matching versions. The unrelated device-cleanup ADR does not govern this viewer.

### STD-01 — P2

**ADR:** NO ADR: keyboard focus is governed by DESIGN.md, not the unrelated Pi Ink cleanup decision.

**Location:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/main.tsx:133.

**Finding:** DESIGN.md, Components / Cards & Containers / finder-columns, requires: 'restore focus to the originating selection when closing/backing out.' Both the asset inspector's Back button and ArrowLeft handler call reveal(caseColumn.current, true). reveal focuses the section at line 91, not the asset button that opened the inspector. Keyboard users lose their list position and must traverse the case controls again to reach the next asset.

**Required change:** Retain a reference to the originating asset selection and restore focus to that button when backing out of the inspector. Preserve horizontal reveal of the case column.

**Validation command:** Serve a populated session with scripts/collect-feedback.ts serve <session> --port <port> --json. In the browser, select a non-first asset with the keyboard, activate Back and ArrowLeft separately, and verify document.activeElement is the originating asset button. Repeat at a narrow viewport.

**Blocking reason:** This documented contract is not met in the public viewer or CLI. The parent reproduced the consumer-visible result.

## Spec

One blocking specification finding. The viewer slice implements the read-only import, validation, service and inspector paths. Annotation and export work remain outside this ticket. Static review only; no tests, builds or runtime checks were run, as instructed.

### SPEC-01 — P2

**ADR:** NO ADR: this is the initiative command-output contract, not an architecture decision.

**Location:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/commands.ts:44.

**Finding:** The --plain flag has no effect. Every successful init, validate and serve result uses JSON.stringify, regardless of options.plain. Operators requesting plain output still receive JSON. The ticket requires the initiative common command rules. Initiative Commands and execution, decision 11: "Support help, version, machine-readable JSON, plain output, quiet output, no colour and non-interactive operation where applicable."

**Required change:** Implement a plain-text result formatter and select it for --plain. Retain versioned JSON for --json and quiet suppression for --quiet. Cover plain output through the public CLI.

**Validation command:** mise exec -- bun mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts validate "$SESSION" --plain; compare with the same command using --json and --quiet.

**Blocking reason:** This documented contract is not met in the public viewer or CLI. The parent reproduced the consumer-visible result.

## Validation

- **passed:** `mise exec -- env PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome bun test /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-04-viewer/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts` (cwd /tmp). 1 pass, 0 fail, 46 expect() calls; 8.79 seconds.

- **passed:** `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-04-viewer/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts init /tmp/review0010-T0RLr2/session/source --repository /tmp/review0010-T0RLr2/repo --workflow review0010 --session imported --json; collect-feedback.ts validate <imported> --json` (cwd /tmp). 12 cases imported into resolved temporary repository evidence store. Validate passed. Source manifest hash a6509bb52419d9aa52933113c14163ad7431fa0522abfb7dca5552305146d709.

- **passed:** `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-04-viewer/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts serve /tmp/review0010-T0RLr2/session --port 18810 --json; actual Chromium BrowserTab inspection` (cwd /tmp). Distributed 317992-byte HTML; no build. Desktop 1440x900 and narrow 390x844 screenshots inspected. Image decoded 1280x720 with filter none and object-fit contain. JetBrains Mono 400/500 loaded; 13px body; background rgb(25,21,33). ArrowDown selects next asset and retains button focus; 2px rgb(201,166,255) ring and 3px offset. Column scroll [0,100,0]. Narrow body width 390 and finder scrollLeft 780. No JS errors or external requests; favicon 404 only.

- **passed:** `HTTP GET /api/v1/assets/case-1.2.capture-001 and public HTTP refusal checks`. Source/HTTP bytes identical, 25111 bytes, SHA-256 9c3004a6ec3b9f0f72f4055016202e553c17d69ea5a60cbec6e0876839811449. Wrong Host/Origin 403; unregistered asset 404; encoded path 400; source file route 404. Second writer exit 3.

- **finding reproduced:** `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-04-viewer/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts validate /tmp/review0010-T0RLr2/repo/workflows/review0010/artifacts/evidence/imported --plain; same with --json and --quiet` (cwd /tmp). STD-independent SPEC-01: --plain exits 0 and emits full JSON object; --json emits versioned event; --quiet exits 0 with zero stdout bytes.

- **finding reproduced:** `Browser: select case-1.2.capture-002; activate ← Cases; repeat with ArrowLeft at 390px`. STD-01: both actions focus SECTION.column.case-column with aria-labelledby case-title, not originating asset button.

- **passed:** `SIGTERM owned viewer; close owned BrowserTabs; native child waits; acknowledge results; hc kill/rm t85 and t84`. Viewer exit 0; .writer.lock absent. Both axis native completions sequence 2 validated and acknowledged; only owned child terminals removed.

- **passed:** `git status --porcelain=v1; git rev-parse HEAD HEAD^{tree}; git branch --show-current` (cwd /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-04-viewer). Source clean; frozen commit/tree and branch unchanged.

## Limits

No frontend build ran. No new evidence run was created. Screenshots were temporary browser observations; no screenshot artifact is claimed. Native TUI/GUI collection, annotation editing, drafts, export and historical labelling belong to other tickets. The scoped regression passes but does not cover either finding.

## Verdict

FAILURE

Standards: 1 P2 finding (STD-01). Spec: 1 P2 finding (SPEC-01). Both findings were reproduced through the public surface. No fixes or merge are authorized by this review. Parent owns tracker updates, lifecycle, projections and publication.

## Independent reviewers

Standards run 94ff6bfa-5fa4-4f56-941f-c21792332ce0, terminal t85. Spec run 33e68700-ffd9-4c73-879a-84f09bb9f9d8, terminal t84. Both returned source-bound code-review-axis/v1 results, completed through native muxer signals, and were acknowledged before terminal cleanup.
