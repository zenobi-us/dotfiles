# Document the evidence and feedback workflow

Ticket: [collect-evidence-feedback-11-docs](../../../../tracker/tickets/collect-evidence-feedback-11-docs.md).
Source: `d9740e9dac01adb6a7e5efba63f2427ff8458c11` (tree `dae2ac1c4aab5164a116de9946b13569f853b363`).

## Problem

Operators, reviewers, and agents need one documented path from capture to saved feedback and export.
The existing website did not discover the required canonical howto.md filename.

## Implementation

Added collector and feedback how-to guides, separate CLI and system references, driver links, README navigation, and existing website navigation.
The feedback guide includes two real viewer screenshots with alternative text and full-size links.
The website now discovers both guide filename forms and links skill sources on master.
The standard pre-commit hook updated the developer bundle version and marketplace entry.

## Changed files

- README.md
- docs/website/AGENTS.md
- docs/website/content-collections.ts
- docs/website/content/navigation.yaml
- docs/website/src/lib/skill-files.ts
- docs/website/src/lib/skill-metadata.ts
- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/SKILL.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/howto.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/SKILL.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/assets/howto/original-asset.webp
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/assets/howto/saved-box-note.png
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/how-to-browse-evidence.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/howto.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/cli.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/request.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/system.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md

## Validation

- Installed public Playwright capture produced a sealed PASS run of the controlled Evidence ready page.
- Browser box creation saved P3 feedback with original asset SHA-256 and pixel bounds.
- Restart preserved semantically identical saved JSON records. The export files use different whitespace, not identical bytes.
- Fresh request and explicit historical request served separate resolved session identities.
- Shared-context destinations matched saved run and session records.
- The built website rendered 282 pages. Browser navigation, local fragments, source branch links, and illustrated guide rendering were inspected.
- Typecheck, lint, final formatting, and 14 existing website tests passed.
- Surf, native TUI, and native GUI prerequisites were unavailable. No substitute native evidence was claimed.
- React Doctor returned 1 for the unchanged generated vite-flare-starter documentation artifact. This diagnostic remains outside scope.
- Public GitHub and Pages availability remains unverified until parent publication. Screenshot preview used identical local bytes for the two unpublished image requests.

## Review history

No formal worktree review has run. Read-only helper checks found no spec discrepancy and one guide-naming rule gap.
The naming rule gap is resolved in docs/website/AGENTS.md. The helper checks do not establish a formal reviewer verdict.

## Resolved findings

The website guide naming instructions now match both supported filename forms.

## Remaining findings

The React Doctor generated-documentation diagnostic remains explicit. No implementation blocker or open product question remains.

## Latest reviewer verdict

None. Parent phase completion and independent formal review remain pending.

## Merge status

Not merged or pushed. The ticket remains claimed. The source worktree is clean and committed.
All owned services and child self-check tabs stopped. The implementation pane remains for its parent to close.

## Supporting records

- [Phase start](../../events/start-0001.yaml).
- [Implementation result](../../events/implementation-0002.yaml).
- [Verification index](../evidence/docs-validation-0001/index.md).
- [Exact commands and outputs](../evidence/docs-validation-0001/commands.json).
- [Saved feedback](../evidence/docs-validation-0001/saved-export.json).
- [Restart feedback](../evidence/docs-validation-0001/restart-export.json).
- [Screenshot preview scope](../evidence/docs-validation-0001/screenshot-preview.json).
- [Standards self-check](../evidence/docs-validation-0001/self-check-standards.json).
- [Spec self-check](../evidence/docs-validation-0001/self-check-spec.json).
- [Final service shutdown](../evidence/docs-validation-0001/final-service-shutdown.json).
