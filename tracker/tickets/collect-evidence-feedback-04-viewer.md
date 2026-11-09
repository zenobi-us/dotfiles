---
blocked_by: 
  - collect-evidence-feedback-01-web
id: collect-evidence-feedback-04-viewer
parent: collect-evidence-feedback
schema: tracker-ticket/v1
sequence: 4
title: Browse immutable evidence in a local feedback session
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

# Browse immutable evidence in a local feedback session

## What to build

Create a feedback session from a sealed run and browse its cases and original images in a local single-HTML viewer.

Implement this complete slice. Follow the collect-evidence-feedback initiative and its common schema, command, storage, safety and testing rules.

## Acceptance criteria

- **Initialize and validate** collect-feedback/v1 sessions and cases through mise Bun CrustJS commands. Resolve their store through the existing evidence route. Copy immutable media and preserve the source evidence identity, capture times and hashes.
- **Serve session, case** and registered asset data through the specified read API. Validate the run and copied assets before serving. Reject changed or missing assets and unsupported schemas.
- **Use one Bun** server implementation for the serve subcommand and direct serve entrypoint. Bind to loopback on an explicit port. Reject a busy port and a second session writer without selecting a fallback.
- **Use the DESIGN.md** colours, typography, spacing, square controls and real shadcn Base Nova components. Build scripts, styles and JetBrains Mono into one HTML interface before distribution.
- **Browse session, case** and asset inspector columns with independent vertical scrolling. Preserve horizontal drill-down on narrow screens. Show original images without recolouring, cropping or reconstruction.
- **Serve only registered** assets. Enforce Host and Origin checks, path and symlink boundaries and request limits. Do not expose an arbitrary file server or log secrets.
- **Run from an** unrelated directory without a frontend build or CDN at server startup. Check the real browser surface and source image bytes. Check blocked assets, unsafe paths, port conflicts and owned-resource cleanup through public commands and HTTP.
- **Describe the current** viewer capability accurately. Do not add fake annotation handlers or unfinished feedback controls.

## Verification

Use the public workflow boundary approved in the initiative. Exercise the installed commands and the applicable HTTP, browser or native-driver surface. Use temporary resolved stores. Keep regression checks for consumer-visible failures. Do not prove behaviour from generated source text. Update affected documentation after verification.

## Specification coverage

This slice covers initiative user stories 25, 44, 45, 46, 47, 48, 49, 50, 51. Keep the initiative as the complete specification.

## Comments

No discussion has been recorded.

