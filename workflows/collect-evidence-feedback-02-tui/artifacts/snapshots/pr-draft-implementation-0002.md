---
schema: worktree-artifact/v1
kind: pr-draft
---
# collect-evidence-feedback-02-tui

## Status

Blocked implementation result. The source is committed. Native image acceptance is not verified. Do not merge or mark the ticket completed.

## Ticket summary and problem

[Canonical ticket](../../../../tracker/tickets/collect-evidence-feedback-02-tui.md). Native TUI evidence must control and capture the same terminal, retain colour and spacing, and stop before unsafe input. A matching terminal buffer alone cannot prove a visible frame.

## Implementation

Added driver tui to the common Plan/Driver and public CLI boundary. The Linux path uses CPU foot, a private tmux server and pane, termscope interaction, private Cage/wlroots and grim native PNGs. Native expectations check visible OCR text, consecutive frame hashes, dimensions, RGB probes and text line positions. Approval binds the exact executable/arguments/directory and every input step. Credential prompts stop input. Records and reports retain terminal identities, hashes, limits and cleanup state. Native video is explicitly unavailable. Both existing web driver files are unchanged. Commit hooks regenerated the two plugin manifests.

Implementation commit: 8e8089f2032bceb03a182e262a1667f939e9d9b3. Implementation tree: 490bfcbc1dfa1cfa52c67a5b350653e3b285b330. The result receipt records the final committed HEAD after workflow artifacts.

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

## Validation

- **Public native CLI:** Help, version, init, render, compile and dry-run passed from an unrelated directory with a temporary resolved store. Dry-run left the store and workspace unchanged. Actual run returned exit 3 for missing foot, grim and tesseract. It created no sealed native run. The temporary smoke store was removed.
- **Regression suite:** 101 passed, three opt-in browser checks skipped, zero failed. An earlier browser-origin scoping regression was corrected; the affected public workflow file then passed 96 tests.
- **Live web checks:** Zero passed, three failed. Playwright could not find /opt/google/chrome/chrome. Surf approved-space.3 expected Submitted and observed Not submitted. No web driver source was changed.
- **Actual web image:** The preserved Surf PNG shows Confirm operation and Not submitted. The archived sealed web run validates. This diagnostic does not substitute for native TUI proof.
- **Native visual gap:** No native PNG was captured. Colour, spacing, delayed visible transition, live credential/unapproved-input stops and native owned cleanup remain unverified.
- **Static tooling gap:** TypeScript compiler and the LSP TypeScript installation are unavailable. No typecheck is claimed.

## Review history and findings

No review phase ran. No reviewer verdict exists. Resolved findings: none. Remaining acceptance blockers: native prerequisites and the required real-image/safety/cleanup exercise. Live browser failures are retained as validation gaps.

## Merge status

Not merged. Not pushed. Ticket remains claimed. Source worktree and child terminal remain available for the parent.

## Open questions

A prepared host must supply the missing native prerequisites through a separate setup operation. The parent must decide how to handle the live Surf confirmation failure and missing Playwright Chrome without treating these checks as passing.

## Provenance

Parent start receipt records scoped user approval after the inspector matched unrelated recovery commit 2e7974f. It found no existing TUI workspace, receipt or live owner. This child did not launch another implementation session. Child terminal: t4y. Assigned child session/run: 42341920-3bfa-4b64-bd59-9f7ea0cea44b. Parent terminal: t4t.

## Supporting records

- [Parent start](../../events/start-0001.yaml)
- [Implementation result](../../events/implementation-0002.yaml)
- [Public validation commands and outcomes](validation-implementation-0002.json)
- [Actual Surf diagnostic evidence](../evidence/controlled/run.json)
- [Initiative](../../../../tracker/initiatives/collect-evidence-feedback/index.md)
