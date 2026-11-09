---
type: Review
title: Web evidence review review-0011
schema: worktree-review/v1
---
# Web evidence review review-0011

Review the frozen web cutover for the ticket owner and implementer.

Date: 2026-11-09T07:54:12.056978+00:00

## Overview

Verdict: FAILURE. Standards has one blocking judgment call and one advisory judgment call. Spec has three blocking findings. Fix the blocking findings before completion. The passing public suite does not cover these defects.

## Scope

- **Ticket:** `tracker/tickets/collect-evidence-feedback-01-web.md` in the canonical base checkout `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`.
- **Initiative:** `tracker/initiatives/collect-evidence-feedback/index.md`, read in full from that checkout.
- **Branches:** `feature/collect-evidence-feedback-01-web` against `master`.
- **Frozen commit:** `0acff3b4c45705336028263a0b20d41dbc1aee63`.
- **Frozen tree:** `9480fa07ed2783674efa8f0d3efc6bc7daa81047`.
- **Fixed point:** `7f981d2f47f24276159bec1719a50667a61494c6`.
- **Diff command:** `git diff 7f981d2f47f24276159bec1719a50667a61494c6...0acff3b4c45705336028263a0b20d41dbc1aee63`.
- **Commit list:** `0acff3b4 feat: implement tracker/tickets/collect-evidence-feedback-01-web.md`.
- **Review boundary:** All 60 changed files, active callers, old entrypoint removal, web acceptance criteria and initiative common contracts. Future TUI, GUI and feedback UI work is excluded.

Standards and Spec ran as independent parallel agents. Their reports remain separate and retain their own ordering. Two initial reviewer agents failed before review because their model endpoint refused connections. Two replacement general-purpose agents completed both axes. No source edits, builds, lint, tests or formatters ran in axis agents.

Required standards included canonical agent instructions, context map, domain rules, writing-skill anatomy, checklist and testing methodology. ADR (architecture decision record) 0001 applies only to Pi Ink cleanup; it does not govern these browser changes. `CONTEXT.md` is absent in the base checkout.

## Standards

Two findings: one blocking judgment call and one advisory judgment call. No hard documented-standard breach was established. The axis reviewed the full frozen diff, active source callers, required standards and ADR. It ran no runtime checks.

### STD-001

- **Severity:** P2
- **ADR reference:** NO ADR — ADR 0001 governs Pi Ink device cleanup, not plan validation.
- **File:** [mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts#L350)
- **Changed line:** 350
- **Description:** Possible Duplicated Code. load-plan.ts:38–54 and records.ts:334–358 independently validate the same plan with different rules. The loader accepts _case, but finalization rejects it after browser execution. The loader also accepts undeclared preconditions that finalization rejects.
- **Required change:** Share structural plan validation between the loader and record reader. Reject invalid IDs and precondition references before driver execution. Keep authoring-only checks separate.
- **Validation command:** `MISE_AUTO_INSTALL=false PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome mise x -- bun /tmp/ce-review-0011-case.ts`
- **Completion impact:** A plan can pass compilation and perform browser actions before finalization rejects it.

### STD-002

- **Severity:** P3
- **ADR reference:** NO ADR — no applicable architecture decision.
- **File:** [mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts#L330)
- **Changed line:** 330
- **Description:** Possible Speculative Generality. The cutover removes the only cleanupRow consumer but retains the interface requirement, both implementations and HTML-specific CleanupRow type. Active source searches found no calls.
- **Required change:** Remove the unused report hook and type from the driver interface and both drivers.
- **Validation command:** `mise x -- bun test /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test`
- **Completion impact:** Not blocking. This is obsolete report coupling left by the cutover.

## Spec

Three blocking findings. The axis read the complete canonical ticket and initiative. It found no additional confirmed scope expansion. Existing implementation records were inputs, not correctness proof. The parent independently exercised all three findings below.

### SPEC-001

Requirement: “Before Enter or a confirmation action, check the current screen and the approved action scope.”

- **Severity:** P1
- **ADR reference:** NO ADR — initiative decision 38 governs confirmation safety.
- **File:** [mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts#L47)
- **Changed line:** 47
- **Description:** The confirmation guard covers click and Enter but excludes Space. An owned public workflow with approval.confirmations=[] activated a focused confirmation button, submitted one HTTP request and returned PASS. Surf has the same static guard omission at line 127; the Surf keyboard effect was not exercised.
- **Required change:** Check keyboard activation actions against approved scope in both drivers before dispatch. Add public workflow regression coverage for unapproved Space activation.
- **Validation command:** `MISE_AUTO_INSTALL=false PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome mise x -- bun /tmp/ce-review-0011-space.ts`
- **Completion impact:** Collection performs an unapproved operation.

### SPEC-002

Requirement: “Collect temporary media outside an active watched source tree.”

- **Severity:** P2
- **ADR reference:** NO ADR — initiative decision 18 governs temporary storage.
- **File:** [mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts#L45)
- **Changed line:** 45
- **Description:** The relative-path prefix test treats ..captures as parent traversal. Public init returned 0 and wrote plan.ts inside /tmp/ce-review-watched-eaegbZ/repo/..captures, which is still under the repository.
- **Required change:** Check exact .. or a parent-directory separator prefix. Reject repository descendants whose names start with two dots.
- **Validation command:** `MISE_AUTO_INSTALL=false mise x -- bun /tmp/ce-review-0011-watched.ts`
- **Completion impact:** The workspace boundary permits writes inside the watched source tree.

### SPEC-003

Requirement: “Reject invalid records, missing media and unsupported explicit schemas without a valid-looking partial run.”

- **Severity:** P2
- **ADR reference:** NO ADR — the ticket missing-media criterion and initiative testing decision 14 apply.
- **File:** [mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/surf-driver.ts](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/surf-driver.ts#L304)
- **Changed line:** 304
- **Description:** Successful screenshot results with missing files are silently filtered out. An owned real-Surf public workflow with post-driver file deletion returned 0, sealed a run with zero assets and no errors, and reported PARTIAL.
- **Required change:** Reject missing expected screenshots before finalization. Preserve native failure diagnostics and add a public workflow missing-media regression.
- **Validation command:** `MISE_AUTO_INSTALL=false mise x -- bun /tmp/ce-review-0011-media.ts`
- **Completion impact:** Missing required evidence becomes a completed, sealed collection instead of a rejected run.

## Validation

All commands below ran from `/tmp`. `MISE_AUTO_INSTALL=false` and `GIT_TERMINAL_PROMPT=0` applied. Real-driver checks used `COLLECT_EVIDENCE_REAL_DRIVERS=1` and `PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`. No tools were installed. No remote Git operation ran. Fixture repositories used only local Git initialization and origin configuration.

### keyboard-confirmation-reproduction

Command: `mise x -- bun /tmp/ce-review-0011-space.ts`

Started: 2026-11-09T07:49:48.783884+00:00. Finished: 2026-11-09T07:49:54.175463+00:00.

Fixture process exit 0. Public init and compile returned 0. Public run returned 0 and PASS. The owned HTTP server received one submission without confirmation approval. The actual PNG visibly shows Submitted. Surf keyboard activation remains a static finding, not a claimed runtime result.

### watched-tree-reproduction

Command: `mise x -- bun /tmp/ce-review-0011-watched.ts`

Started: 2026-11-09T07:49:54.175758+00:00. Finished: 2026-11-09T07:49:54.463318+00:00.

Fixture process exit 0. Public init returned 0 and created plan.ts under the repository directory named ..captures. This disproves the workspace exclusion boundary.

### scoped-public-workflow

Command: `mise x -- bun test /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test`

Started: 2026-11-09T07:51:07.302495+00:00. Finished: 2026-11-09T07:51:40.571684+00:00.

Exit 0. 11 tests passed, 0 failed, 70 expectations. Both real Surf and Playwright controlled-page workflows ran. This was the one scoped public suite run after both axes returned.

### retained-run-validation

Command: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts validate /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/collect-evidence-feedback-01-web/artifacts/evidence/implementation-0005/surf-controlled --json`

Started: 2026-11-09T07:51:40.571849+00:00. Finished: 2026-11-09T07:51:40.716797+00:00.

Exit 0. The installed validator accepted the retained Surf controlled run without changing it.

### plan-validation-reproduction

Command: `mise x -- bun /tmp/ce-review-0011-case.ts`

Started: 2026-11-09T07:51:40.717110+00:00. Finished: 2026-11-09T07:51:45.453644+00:00.

Fixture process exit 0. Public init and compile accepted case ID _case. Public run executed the owned page and then returned 2 during finalization: ID must use 1–160 safe letters, digits, dots, underscores or hyphens. Incomplete capture remained at /tmp/collect-evidence-BuD9JC. No sealed destination was reported.

### missing-media-reproduction

Command: `mise x -- bun /tmp/ce-review-0011-media.ts`

Started: 2026-11-09T07:52:45.840974+00:00. Finished: 2026-11-09T07:52:50.834162+00:00.

Fixture process exit 0. A temporary PATH wrapper invoked the real Surf executable and removed only owned /tmp/collect-evidence-* screenshot files after successful native execution. Public run returned 0, PARTIAL, status sealed, zero assets and no errors. This is controlled fault injection, not a simulated successful driver.

The parent inspected retained Surf and Playwright selected-project PNGs. Both show Project selected: Aurora. These historical images support the recorded evidence but do not prove the frozen code correct. Fresh public workflows exercised collection, assertion outcomes, safety stops, read-only consumers, interruption and sealing checks. No new durable evidence run is claimed.

Temporary reproduction scripts and diagnostic runs remain outside the source worktree. Their paths are reproduction aids, not authoritative workflow outputs. No borrowed tab or session was closed by the reviewer. Borrowed-resource sentinel claims in the implementation receipt remain historical inputs; this review did not independently repeat sentinel checks.

Existing durable inputs: `workflows/collect-evidence-feedback-01-web/events/implementation-0005.yaml`, `workflows/collect-evidence-feedback-01-web/artifacts/snapshots/pr-draft-implementation-0005.md`, and `workflows/collect-evidence-feedback-01-web/artifacts/evidence/implementation-0005/index.md`.

Standards total: 2 findings; worst within Standards: P2 STD-001. Spec total: 3 findings; worst within Spec: P1 SPEC-001. Verdict: FAILURE.

Before result delivery, `git rev-parse HEAD HEAD^{tree}` matched the frozen commit and tree. `git status --porcelain=v1` produced no output. The source worktree remains clean.
