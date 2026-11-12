---
schema: worktree-artifact/v1
type: Concept
title: Read-only evidence viewer implementation
---
# Read-only evidence viewer

## Ticket and problem

[collect-evidence-feedback-04-viewer](../../../../tracker/tickets/collect-evidence-feedback-04-viewer.md) implements the viewer-only slice of [collect-evidence-feedback](../../../../tracker/initiatives/collect-evidence-feedback/index.md). Reviewers need a local inspector for immutable captures, case results and provenance. No annotation controls or write API are part of this slice.

## Source

Branch: `feature/collect-evidence-feedback-04-viewer`. Base: `master`.

Exact source commit: `035fdd61b454eb9b9aa8b0f20fdd3b2ee33ab476`. Exact source tree: `ae1abc62d14257777bb22a4b737add38a0903c71`. The source worktree is clean. Feature commit: `c4b48e60`. Evidence commit: `035fdd61`.

## Implementation

Added collect-feedback init, validate and serve with pinned CrustJS and mise Bun entrypoints. The direct serve path shares one command and Bun server. Imports preserve a complete sealed source snapshot, original asset IDs, capture times, SHA-256 and immutable case media. The server binds to an explicit loopback port, validates source and session records, holds an exclusive writer lock and serves registered bytes only. Host, Origin, Fetch Metadata, path, symlink and request bounds protect the read API. Owned-resource cleanup preserves all session data.

The distributed HTML embeds React, actual upstream shadcn Base Nova components, CSS and JetBrains Mono 400/500. Finder columns scroll independently and retain horizontal drill-down at narrow widths. The page uses original img elements and no reconstruction. Skill, manual guide, record contract and changelog state the supported read-only capability. The commit hook updated developer bundle metadata to 0.2.22.

## Changed files

The [complete changed-file inventory](changed-files-implementation-0003.json) contains 208 files, including retained capture records and unchanged parent provenance copies. Product files:

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

## Validation

| Check | Observed result |
|---|---|
| Tracker schema preflight | Passed; claimed tracker-ticket/v1 and normal graph/explorer discovery |
| Real public collection and import from /tmp | 12 cases, original Playwright PNGs, validated sealed run and session |
| Focused public workflow before review | 1 pass, 38 assertions |
| Final affected Bun suite | 102 pass, 32 opt-in skips, 0 fail; 940 assertions; 134 tests, 7 files |
| Frontend typecheck and build | Passed; 317992-byte single HTML |
| Real browser | Original 1280×720 PNG; independent scrolling; 390px drill-down; repeated arrows and exact focus style; no external requests or JS errors |
| Byte comparison | HTTP and copied media equal original 25111-byte PNG and SHA-256 |
| Safety and cleanup | Public regressions cover unsafe paths, Host/Origin, bounds, invalid assets/schemas, busy port, second writer, SIGINT/SIGTERM, same-port restart and lock cleanup |
| Durable parent-store session | Public validate passed from /tmp after byte-identical evidence copy |

[Actual commands and limits](../evidence/viewer-smoke-20261112-6f1739/validation.json) and [visual evidence](../evidence/viewer-smoke-20261112-6f1739/index.md) remain separate. The first default-browser attempt blocked because Chrome was absent; selecting an existing Chromium executable resolved setup. The configured LSP could not find workspace TypeScript. Explicit frontend tsc passed. Native and GUI driver opt-ins and new recording were not exercised by this viewer work.

## Review history and findings

Implementation self-review used separate Standards and Spec readers. [Findings and resolutions](../evidence/viewer-smoke-20261112-6f1739/implementation-review.json) retain both reports. The dangling event reference, repeated-key focus loss, duplicate concurrent metadata validation and incorrect focus styling were resolved before final checks. Remaining findings: none identified. Latest formal reviewer verdict: none; parent review remains required. This is not a review phase-result.

## Merge and publication

Not merged, pushed or submitted. The ticket remains claimed. Parent owns phase completion, formal review and any later integration. Source code and evidence are committed. Parent will commit the base-store workflow artifacts without changing source identities. No remote Git command ran during capture or serving.

## Supporting records

- [Start receipt](../../events/start-0001.yaml)
- [Launch provenance](../../events/launch-0002.yaml)
- [Implementation result](../../events/implementation-0003.yaml)
- [Complete changed files](changed-files-implementation-0003.json)
- [Evidence copy checksums](evidence-copy-implementation-0003.json)
- [Retained feedback session](../evidence/viewer-smoke-20261112-6f1739/session/session.json)

## Open questions

No unresolved implementation questions. Parent must perform the formal review phase. Annotation editing, drafts, export and historical labels remain outside this ticket.

