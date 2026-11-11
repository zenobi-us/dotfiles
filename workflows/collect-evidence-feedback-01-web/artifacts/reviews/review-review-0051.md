---
schema: worktree-review/v1
title: Independent web review review-0051
type: Review
---

# Independent web review review-0051

This review lets the parent assess the complete frozen web-evidence cutover. Reader: parent reviewer and maintainer. Timestamp: 2026-11-11T03:25:40.663Z.

## Overview

FAILURE for commit `4c0b7737acddf17e3a44b865fddb1fd0e0b2fc23`, tree `97fa1a4794c2ab10d4676993de8414890c525134`. Standards SUCCESS; Spec FAILURE. Fix SPEC-R8-001 before a new independent review. The finding is a static lifecycle inference, not a reproduced browser leak.

Current retained Surf and Playwright workflows satisfy the previous two-driver evidence gate. Earlier browser failures remain historical facts. This review neither repeats them nor claims their causes.

## Scope

- **Ticket:** `tracker/tickets/collect-evidence-feedback-01-web.md`, backend local-markdown; canonical status implemented.
- **Complete specification:** `tracker/initiatives/collect-evidence-feedback/index.md`, resolved from BASE.
- **Repository and workflow:** `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`; repository store; `workflows/collect-evidence-feedback-01-web`.
- **Source:** `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web`; branch `feature/collect-evidence-feedback-01-web`; base `master`.
- **Frozen comparison:** `git diff master...4c0b7737acddf17e3a44b865fddb1fd0e0b2fc23`; full 60-file cutover, not only the last fix. Initial master: `3fdabf2f7009c700c5c698fea9e185288975eda3`. Merge base: `859341b01ef7be474a3128b7f94772aab731c2f7`.
- **Base movement:** The axes and final check observed master `e7d5058f0a597b551aac1ce7bd152fe1a1bd4309`. The merge base stayed unchanged. The retained full diff and pinned initial-base diff match SHA-256 `7d606248cdbef13fe66faa8e5fba7fd1954fcf06fe68b5a3d3c699227013f124`.
- **Actual commit list:**

```text
4c0b7737 fix: guard checks collect-evidence-feedback-01-web
6923f54f fix: repair fixture collect-evidence-feedback-01-web
35b4bbe9 fix: check optionals collect-evidence-feedback-01-web
3dbab24c fix: validate steps collect-evidence-feedback-01-web
8c401541 fix: isolate surf maps tracker/tickets/collect-evidence-feedback-01-web.md
b711ef1b fix: allow empty slug tracker/tickets/collect-evidence-feedback-01-web.md
12b6345a fix: encode ids tracker/tickets/collect-evidence-feedback-01-web.md
3d1b2825 fix: guard tracker/tickets/collect-evidence-feedback-01-web.md
0acff3b4 feat: implement tracker/tickets/collect-evidence-feedback-01-web.md
```

- **Context:** Read CONTEXT-MAP.md, docs/agents/domain.md, docs/agents/issue-tracker.md, docs/adr/index.md and ADR 0001. CONTEXT.md and ALIGNMENT-ROOT.md are absent. ADR 0001 governs Pi Ink, not this web slice.
- **Canonical inputs:** review-start-0050, fix-complete-0049, fix-0048, review-0045, pr-draft-fix-0048, prior review artifact and retained fix-0048 evidence from BASE. Stale source-worktree workflow copies were not used as authority.
- **Independent sessions:** Standards t3d / 13d2ac02-e01d-4591-8264-9a3e277aa63c; Spec t3c / 63812aab-d493-416b-8da3-9ad160031ffb. Both were fresh depth2 read-only OMP sessions. Both used code-review-axis/v1. Their native done signals, result identities and hashes were verified before acknowledgement. Only these two terminals were killed and removed.

## Standards

Standards SUCCESS: no blocking documented-standard breach found in the complete frozen diff. Two existing P3 smell advisories remain unselected: duplicated Markdown writers and duplicated confirmation classification. Neither advisory establishes a hard requirement. STD-R7-001 is resolved: the Surf workflow excludes the authored identity alias from generated-key uniqueness and still checks its observed value. The required precondition fields now receive structural validation before dispatch. Current retained acceptance establishes both-driver coverage; historical browser failures do not override that evidence. ADR 0001 applies to Pi Ink device cleanup, not this web collector. Repository authoring rules explicitly permit schema and user-invocable frontmatter. The review covered the skill cutover, driver implementations, common records, CLI, public workflow checks, removed paths and migrated writing-reports caller. Source HEAD and tree match the assignment, and the initial source status was clean. Local master moved since launch; the pinned base produces exactly the retained diff. This result approves only the Standards axis, not merge, publication or ticket completion.

### STD-R6-002

- **Severity:** P3, advisory and unchanged; unselected.
- **Axis:** standards.
- **ADR or rule:** NO ADR. Code-review baseline: Duplicated Code. Advisory judgement call, not a documented-standard breach.
- **File and line:** [mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts:48](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts#L48).
- **Description:** Possible Duplicated Code. pipeline.ts:48-55 and records.ts:490-493 each create schema/kind Markdown frontmatter and invoke mise/mq. Their output format, lock and overwrite policies differ. This remains an unchanged, unselected advisory.
- **Required change:** Optional: share a leaf Markdown writer with explicit caller policies. Avoid a pipeline/records dependency cycle. No change is required for this review.
- **Validation command:** `git show 4c0b7737acddf17e3a44b865fddb1fd0e0b2fc23:mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts`

### STD-R6-003

- **Severity:** P3, advisory and unchanged; unselected.
- **Axis:** standards.
- **ADR or rule:** NO ADR. Code-review baseline: Duplicated Code and Shotgun Surgery. Advisory judgement call, not a documented-standard breach.
- **File and line:** [mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts:47](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts#L47).
- **Description:** Possible Duplicated Code. The click/Enter/Space approval predicate also appears at surf-driver.ts:127. A future activation-key change must update both compilers despite their shared safetyCode owner. This remains an unchanged, unselected advisory.
- **Required change:** Optional: define confirmation classification once beside safetyCode and use it in both compilers. No change is required for this review.
- **Validation command:** `git show 4c0b7737acddf17e3a44b865fddb1fd0e0b2fc23:mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts`

## Spec

One P2 spec gap remains: interruption handling starts after the prerequisite doctor has already opened and closed a browser. The standalone doctor path has the same gap. The source does not guarantee owned-resource cleanup when SIGTERM arrives in this phase. This is a static inference, not a reproduced browser leak. The latest precondition-field validation resolves SPEC-R7-001. Retained current Surf and Playwright workflows, their inspection record, and both selected-project screenshots satisfy the prior two-driver evidence gate; SPEC-R7-002 is resolved. The screenshots show Project selected: Aurora. The full ticket slice otherwise retains typed plans, both drivers, common records, separate capture/assertion outcomes, sealed media, reports, generated comments and explicit publication boundaries. No missing TUI, GUI or feedback implementation is charged to this web ticket. Unselected standards advisories remain unchanged.

### SPEC-R8-001

- **Severity:** P2, blocking.
- **Axis:** spec.
- **ADR or rule:** NO ADR; tracker/initiatives/collect-evidence-feedback/index.md:108, Implementation Decisions 15, interruption and owned-resource cleanup.
- **File and line:** [mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts:146](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts#L146).
- **Description:** Spec line 108: "On Ctrl-C or SIGTERM, stop new work, finish or fail pending saves explicitly, and release owned resources. Do not claim that an interrupted operation completed." collect calls doctor at line 146 before installing signal handlers at lines 159–160 or entering its cleanup try/finally. Playwright doctor opens a real owned browser session at lines 69–76. The standalone doctor command also has no signal handler. [INFERENCE] SIGTERM during that launch/close window terminates the collector instead of awaiting browser.close; an owned daemon browser session can remain open. The retained interruption workflow sends SIGTERM only after the later /interrupt navigation, so its pass does not cover this earlier lifecycle window.
- **Required change:** Put signal handling and owned-resource cleanup around the complete resource-owning command lifecycle, including doctor and its invocation from run. Preserve cancellation state through prerequisite checks, stop before subsequent driver work, and finish owned-session cleanup before exit. Add a public process-level regression for interruption during the prerequisite browser session, while preserving a borrowed session.
- **Validation command:** `COLLECT_EVIDENCE_REAL_DRIVERS=1 mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts --test-name-pattern 'playwright:' (extend with the prerequisite-phase SIGTERM regression before running)`

## Validation

- **Fresh scoped suite:** `mise exec -- bun test <test>/workflow.test.ts <test>/verdict.test.ts <test>/playwright-driver.test.ts` passed: 95 tests, 871 assertions, zero failures. Exact argv and output: [scoped suite](../evidence/review-0051/scoped-suite.json). Here `<test>` is `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test` under SOURCE.
- **Public CLI smoke:** From /tmp, the executable `collect-evidence.ts validate <retained-run> --json` returned 0 for both sealed runs. It did not start a browser. Exact commands: [Surf validation](../evidence/review-0051/validate-retained-surf.json) and [Playwright validation](../evidence/review-0051/validate-retained-playwright.json).
- **Retained browser proof:** Current fix-0048 logs record Playwright 28 assertions and Surf 86 assertions, both passing. Strict tsc also passed in that retained evidence; this review did not rerun it.
- **Actual image inspection:** Four retained PNGs show Project selected: Aurora and Submitted for both drivers. [Image inspection](../evidence/review-0051/image-inspection.json) names the exact files. Common records retain timestamps, hashes, dimensions and driver provenance.
- **Retained safety and cleanup:** Inspected current credential/confirmation stops, punctuation identity, missing-media, interruption, tamper and borrowed-resource observations. They prove those exercised paths, not the earlier doctor interruption window.
- **Source identity:** Beginning and final checks matched the assigned commit/tree with empty git status. [Final source](../evidence/review-0051/source-final.json), [clean status](../evidence/review-0051/source-clean-final.json), [merge base](../evidence/review-0051/merge-base-final.json).
- **Limits:** No new browser authorization was used. No source/tests/configuration changes, installations, credential entry, service/browser restart, remote Git, commit, merge, push or borrowed-resource closure. No historical issue was claimed as newly reproduced. Parent owns tracker, projections, artifact commits, phase completion and this review terminal.

Standards: 2 advisory findings, worst P3. Spec: 1 blocking finding, worst P2. No cross-axis reranking.

