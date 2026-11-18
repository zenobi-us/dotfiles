# Evidence and feedback documentation

Ticket: [collect-evidence-feedback-11-docs](../../../tracker/tickets/collect-evidence-feedback-11-docs.md).
Generated from authoritative events. Latest result: implementation-0002. Parent completion: [start-complete-0003](../events/start-complete-0003.yaml).

## Ticket summary

Document the evidence and feedback workflow for operators, reviewers, and agents.

## Problem

Readers need complete capture-to-export procedures and consistent storage and authority boundaries.

## Implementation

Added task-focused collect-feedback/howto.md and a runnable collector example, separate CLI and system references, real source-selection and saved-box screenshots, skill/evidence links, existing website navigation and canonical howto discovery, master source links, README links, and changelog. Public installed CLI smoke collected real Playwright evidence, saved a browser box note, restarted the server, and exported semantically identical saved records. Source is committed and clean. Bundle versions updated by the standard pre-commit hook.

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

## Validation results

Public installed Playwright capture, fresh/historical requests, browser box save, validation, report, restart, and export were exercised.
Saved feedback before and after restart is semantically identical JSON. Export files differ in whitespace.
Typecheck, lint, final formatting, build, and 14 existing website tests passed.
Exact commands and outputs are in [the verification record](../artifacts/evidence/docs-validation-0001/commands.json).
The screenshot-illustrated guide was inspected with identical local bytes for unpublished image requests.
[Preview scope](../artifacts/evidence/docs-validation-0001/screenshot-preview.json) distinguishes local rendering from remote publication.

## Review history

No formal worktree review. Read-only helper findings are retained in the evidence record.

## Resolved findings

The website guide-naming rule now names howto.md and how-to-*.md.

## Remaining findings

- Surf doctor blocked: /tmp/surf.sock unavailable.
- Native TUI doctor blocked: foot, grim, tesseract missing.
- Native GUI doctor blocked for explicitly unavailable display :65000; no user display captured.
- Playwright default Chrome absent; successful capture used the already installed Chromium via PLAYWRIGHT_MCP_EXECUTABLE_PATH. Video recorder doctor passed, but this evidence run captured images only.
- React Doctor exited 1 for react-doctor/artifact-env-leak in generated vite-flare-starter documentation artifact; unchanged skill source remains outside this change. Typecheck, lint, final formatting, build, and 14 existing website tests passed.
- New GitHub/Pages URLs cannot be verified remotely until parent publication. Illustrated website preview served identical local bytes for only the two unpublished screenshot requests, recorded in screenshot-preview.json.

## Latest reviewer verdict

None. Formal review remains pending.

## Merge status

Not merged or pushed. Ticket remains claimed. Source is clean and committed. Owned services stopped.

## Supporting records

- [start-0001](../events/start-0001.yaml): start, phase-start, started, source `dc2072ad0f90422ad9bb41c3258a2d0fc06cd135`.
- [implementation-0002](../events/implementation-0002.yaml): implementation, phase-result, completed, source `d9740e9dac01adb6a7e5efba63f2427ff8458c11`.
- [Immutable PR draft](../artifacts/snapshots/pr-draft-implementation-0002.md).
- [Verification index](../artifacts/evidence/docs-validation-0001/index.md).
- [Saved feedback](../artifacts/evidence/docs-validation-0001/saved-export.json).
- [Restart feedback](../artifacts/evidence/docs-validation-0001/restart-export.json).
- [Standards self-check](../artifacts/evidence/docs-validation-0001/self-check-standards.json).
- [Spec self-check](../artifacts/evidence/docs-validation-0001/self-check-spec.json).
- [Service shutdown](../artifacts/evidence/docs-validation-0001/final-service-shutdown.json).
