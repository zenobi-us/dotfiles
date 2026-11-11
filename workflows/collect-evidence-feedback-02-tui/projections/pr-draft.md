---
schema: worktree-artifact/v1
kind: pr-draft
---
# collect-evidence-feedback-02-tui

## Ticket summary and problem

[Ticket](../../../tracker/tickets/collect-evidence-feedback-02-tui.md): collect native TUI images from the controlled terminal, with correct visible screen, colour and spacing. Text-buffer matches alone are insufficient.

## Implementation summary

Added the private Linux foot/termscope/tmux/Cage/wlroots/grim driver to common commands, records, routing, notes and reports. Approval binds command, directory and every input. Native checks compare OCR, stable frame hashes, dimensions, colour probes and line positions. Both web driver files remain unchanged. Native video is unavailable.

## Changed files

- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/SKILL.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/evidence-schema.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/tui.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/driver.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/tui-driver.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/load-plan.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/plan.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/render-plan.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/tui-plan.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts

Workflow outputs include the copied parent receipt, immutable draft, validation JSON, generated views and actual Surf diagnostic archive.

## Validation results

Public native help/version/init/render/compile/dry-run passed. Dry-run changed no files. Actual native run returned exit 3 and sealed nothing because foot, grim and tesseract are missing. Regression suite: 101 passed, three skipped. Live web suite: three failed (missing Playwright Chrome and Surf Space confirmation). The archived real Surf run validates. Its actual image shows Not submitted. No native image, transition, live native safety or cleanup proof exists. TypeScript/LSP checking is unavailable.

## Review history

No review phase ran. Latest reviewer verdict: none. Resolved findings: none. Remaining blockers: missing native prerequisites and real-image/safety/cleanup acceptance. The live web failures remain recorded validation gaps.

## Merge status

Blocked. Not merged or pushed. Ticket remains claimed. Parent owns acknowledgement and terminal close.

## Supporting records

- [Parent start](../events/start-0001.yaml)
- [Implementation result](../events/implementation-0002.yaml)
- [Immutable draft](../artifacts/snapshots/pr-draft-implementation-0002.md)
- [Commands and outcomes](../artifacts/snapshots/validation-implementation-0002.json)
- [Actual web diagnostic](../artifacts/evidence/controlled/run.json)
- [Implementation log](implementation-log.md)
- [Latest status](latest-status.yaml)

Recovery approval and child terminal identity are retained in the immutable draft and result receipt.
