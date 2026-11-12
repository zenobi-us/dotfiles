---
schema: worktree-artifact/v1
type: Concept
title: Viewer PR draft
---
# Read-only evidence viewer

## Ticket and problem

[collect-evidence-feedback-04-viewer](../../../tracker/tickets/collect-evidence-feedback-04-viewer.md) lets reviewers inspect original evidence locally, without modifying captures or exposing an arbitrary file server. [The initiative](../../../tracker/initiatives/collect-evidence-feedback/index.md) owns the complete specification.

## Implementation summary

The collect-feedback skill adds public init, validate and serve commands, collect-feedback/v1 records, immutable source/media copies, a bounded loopback read API and one shared direct/subcommand server. The prebuilt Base Nova interface embeds React, styles and JetBrains Mono. Session, case and asset columns scroll independently and retain horizontal narrow-screen drill-down. Images remain original. No annotation controls, mutations, export or unfinished handlers were added.

Source commit: 035fdd61b454eb9b9aa8b0f20fdd3b2ee33ab476. Source tree: ae1abc62d14257777bb22a4b737add38a0903c71. Branch: feature/collect-evidence-feedback-04-viewer. Base: master. Worktree clean.

## Changed files

[The exact 208-file inventory](../artifacts/snapshots/changed-files-implementation-0003.json) contains 31 product files plus retained evidence and original parent provenance. Product files:

- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/SKILL.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/how-to-browse-evidence.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/commands.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/records.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/serve.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/server.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/.gitignore
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/build.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/bun.lock
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/package.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/ui/badge.tsx
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/ui/button.tsx
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/ui/separator.tsx
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/lib/utils.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/main.tsx
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/styles.css
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/types.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/tsconfig.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/upstream/LICENSE-JetBrains-Mono.txt
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/upstream/LICENSE-shadcn.txt
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/upstream/badge.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/upstream/button.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/upstream/provenance.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/upstream/separator.json

## Validation results

The final affected suite passed 102 tests, skipped 32 existing opt-in cases and failed none. It made 940 assertions across 134 tests and 7 files. Frontend typecheck/build passed; HTML is 317992 bytes. Real public collection created 12 cases. Actual browser checks proved original 1280×720 media, byte equality, independent column scrolling, 390px horizontal drill-down, repeated keyboard selection and exact focus styling. Requests used no CDN.

Public command regressions exercised invalid/missing/changed assets, unsupported schemas, Host/Origin/Fetch Metadata, unsafe paths, body bounds, busy ports, second writers, signals, locks and same-port restart. [Commands and limits](../artifacts/evidence/viewer-smoke-20261112-6f1739/validation.json) preserve actual outcomes. [Visual proof](../artifacts/evidence/viewer-smoke-20261112-6f1739/index.md) is separate from test output. The default Chrome path was unavailable; an existing Chromium binary completed real collection. LSP setup failed; explicit frontend tsc passed.

## Review history

Separate Standards and Spec implementation readers reported concrete findings. [Their reports and resolutions](../artifacts/evidence/viewer-smoke-20261112-6f1739/implementation-review.json) remain available. Resolved: dangling events reference, repeated-key focus loss, duplicated concurrent validation and incorrect focus styling. Remaining findings: none identified. Latest formal reviewer verdict: none. Parent formal review is required.

## Merge status

Not merged, pushed or submitted. Ticket remains claimed. Parent owns phase completion and later review/integration. Source feature and evidence commits are c4b48e60 and 035fdd61. Parent will commit the authoritative base-store workflow artifacts.

## Supporting receipts and artifacts

- [Start receipt](../events/start-0001.yaml)
- [Launch provenance](../events/launch-0002.yaml)
- [Implementation result](../events/implementation-0003.yaml)
- [Immutable draft snapshot](../artifacts/snapshots/pr-draft-implementation-0003.md)
- [Complete changed files](../artifacts/snapshots/changed-files-implementation-0003.json)
- [Evidence copy checksums](../artifacts/snapshots/evidence-copy-implementation-0003.json)
- [Retained session](../artifacts/evidence/viewer-smoke-20261112-6f1739/session/session.json)

Open questions: none. Native/GUI capture and new recording were not verified by this viewer slice. Annotation editing, drafts, export and historical labels remain outside scope.


## Formal review outcome

Attempt 1 produced an unusable empty artifact. [Failed parent completion](../events/review-complete-0008.yaml) preserves that attempt; its SUCCESS claim is not valid.

Attempt 2: **FAILURE** for commit `035fdd61b454eb9b9aa8b0f20fdd3b2ee33ab476`, tree `ae1abc62d14257777bb22a4b737add38a0903c71`. [Review artifact](../artifacts/reviews/review-review-0010.md), [review result](../events/review-0010.yaml), and [parent completion](../events/review-complete-0011.yaml) record the independent axes and fresh public verification. The scoped regression passed (1 test, 46 assertions); actual browser and byte-identity checks passed. Both P2 findings were reproduced.

Resolved findings: none. Open findings: STD-01 and SPEC-01. See the immutable artifact for required changes. Next phase: fix in a fresh session. No source edits, merge, push or ticket completion occurred. Review terminals and owned services were released; the source workspace remains intact.

[Authorized approval-envelope repair](../artifacts/snapshots/review-approval-0005-repair.json) retains the original bytes and checksums. The user authorized only the pane_id correction.
