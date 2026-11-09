---
title: Collect-evidence web implementation draft
type: Implementation
ticket: tracker/tickets/collect-evidence-feedback-01-web.md
receipt: implementation-0005
attempt: 2
---

# Preserve Surf and Playwright in collect-evidence

## Problem

Browser-only collection lacked the initiative’s common versioned records, routed immutable storage and command contracts. A clean cutover must retain both real drivers and existing verdict/comment behavior rather than replace them with mocks or another browser API.

## Implementation

Create collect-evidence as the canonical skill with pinned CrustJS/mise Bun command contracts, versioned sealed records, actual asset metadata, shared-context routing and immutable publication. Preserve both typed Surf and Playwright drivers, attended stops, preconditions, cleanup, verdicts, read-only reports and generated comments. After both real driver checks passed, migrate active callers and skill-authoring rules and remove obsolete active browser-only entrypoints.

Capture status is independent of assertion results. Plans require explicit approval, allowed origins and click/Enter scope; live credential prompts and unapproved actions block. Reports consume recorded assertions; screenshots alone do not create passing assertions. Missing/changed assets and unsupported versions fail validation. Interrupted driver work cleans owned resources without publishing a successful run.

## Source and tracker

- Feature branch: `feature/collect-evidence-feedback-01-web`.
- Source commit: `0acff3b4c45705336028263a0b20d41dbc1aee63`.
- Source tree: `9480fa07ed2783674efa8f0d3efc6bc7daa81047`.
- Source worktree: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web`; clean after the source commit.
- Tracker-only commit: `e089ab179408aef2f9ed335bcc4f128e950db508`; canonical work_status is `implemented`, not completed.
- Source, tracker and workflow publication use separate scoped commits. Existing hook checks ran with `--stash none`; no stash recovery operation was issued.

## Real validation

- Installed CLI entrypoints ran from `/tmp` and a temporary resolved test store.
- Real controlled-page Surf and Playwright workflows both passed fill/click/assert/capture checks. Actual images and visible selected-project state were inspected.
- Final public suite: **11 passed, 0 failed, 70 expectations**. Scoped TypeScript compilation passed.
- Consumer-visible failure/blocked checks covered failed assertions, capture without assertions, unapproved actions, credential prompts, missing/changed assets, unsupported versions, dry-run without prerequisites and SIGTERM during real navigation.
- Both borrowed-resource sentinels survived; only owned resources were closed. The original user Chrome tab stayed open.
- A real WebM was decoded and played in the real report to its end: 800×450, 1640 ms. HTML images decoded at their recorded sizes.
- Four sealed runs passed validation after byte-preserving transfer to the resolved evidence store. Generated-comment custom headings remained supported.

[Exact commands, directories, results, native logs and media](../evidence/implementation-0005/index.md).

## Changed paths

The list includes old and new paths for renames.

- `mise/conf.d/devtools-agent/bundles/agent-core/skills/writing-skills/references/skill-anatomy.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/writing-skills/references/skill-checklist.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/writing-skills/references/testing-methodology.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/references/drivers/playwright-cli.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/references/drivers/surf-cli.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/references/evidence-schema.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/references/playbooks/1-context.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/references/playbooks/2-test-plan.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/references/playbooks/3-confirm.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/references/playbooks/4-collect-evidence.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/references/playbooks/5-publish-evidence.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/acceptance.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/commands/comment.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/commands/compile.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/commands/init.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/commands/render.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/commands/report.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/commands/run.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/commands/verdicts.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/drivers/driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/drivers/playwright-driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/drivers/surf-driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/evidence.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/load-plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/render-plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/report-dir.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/report.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/results.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/sh.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/test/fixture.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/test/playwright-driver.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/test/results.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/test/surf-driver.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/test/verdict.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/verdict.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/drivers/playwright-cli.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/drivers/surf-cli.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/evidence-schema.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/web.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/surf-driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/evidence.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/load-plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/render-plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/results.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/sh.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/fixture.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/playwright-driver.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/verdict.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/verdict.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/developer/types/versioned-imports.d.ts`

## Review and merge status

No formal review ran; latest reviewer verdict is null. No review findings were fabricated or resolved. Independent review and integration remain parent-owned. No remote Git operation, merge, push or ticket completion ran. The feature worktree and workspace remain available.

## Limits and open questions

- Independent review, submit, merge, push and ticket completion were not performed. The feature worktree remains available.
- The default Playwright Chrome path is absent on this host. Real runs used the existing cached Chromium executable through PLAYWRIGHT_MCP_EXECUTABLE_PATH; no browser installation was performed.
- One owned preview tab was invalidated before its first navigation. A fresh owned preview, real playback and both borrowed-resource sentinel checks succeeded. The invalidation cause is unknown; no collector-caused defect or fix is claimed.
- The tracker graph displays implemented as COMPLETED, while its canonical work_status remains implemented. This existing tracker presentation mismatch was reported, not changed in this web ticket.
- The report screenshots have actual PNG dimensions 1984×1068. Native Surf output reported a narrower width. Their exact capture instants were not supplied; command start/end intervals are retained instead of invented timestamps.
- TUI, GUI and the feedback viewer/UI tickets remain out of scope. The HTML report is read-only.

## Supporting records

- [start-0001](../../events/start-0001.yaml) — started.
- [implementation-0002](../../events/implementation-0002.yaml) — blocked.
- [start-complete-0003](../../events/start-complete-0003.yaml) — blocked.
- [start-0004](../../events/start-0004.yaml) — started.
- [Implementation result](../../events/implementation-0005.yaml).
- [Attempt 1 immutable draft](pr-draft-implementation-0002.md).
- [Attempt 1 diagnostics](surf-preflight-implementation-0002.txt).
- [Attempt 2 start inspection](inspection-start-0004.json).
- [Evidence index](../evidence/implementation-0005/index.md).
