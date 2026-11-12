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
work_status: claimed
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

Review 2026-11-12T07:52:47.026Z: **FAILURE**. Reviewed commit `035fdd61b454eb9b9aa8b0f20fdd3b2ee33ab476`, tree `ae1abc62d14257777bb22a4b737add38a0903c71`. [Review artifact](../../workflows/collect-evidence-feedback-04-viewer/artifacts/reviews/review-review-0010.md).


Review 2026-11-12T09:15:29.799685+00:00: **FAILURE**. Reviewed commit `9f9834003647d29efbc0ac19b49fd310ae1a1758`, tree `431e49b346e6db78658a5a74cd85a76c2a77234f`. [Review artifact](../../workflows/collect-evidence-feedback-04-viewer/artifacts/reviews/review-review-0021.md).

Review 2026-11-12T09:56:22.748Z: **FAILURE**. Reviewed commit `86535914fad9d152835049a5374284a772449281`, tree `ce207d4d61add19ebb49181932bfa769a184672a`. [Review artifact](../../workflows/collect-evidence-feedback-04-viewer/artifacts/reviews/review-review-0032.md).

- **Review 2026-11-12T11:03:25.514Z: SUCCESS.** Commit `2f0018b9a37eb6ea2c6795d6779213bdbbdb95f3`; tree `a0ceb121c1e9d04d3e18709c62d3260d075ece18`. [Review artifact](../../workflows/collect-evidence-feedback-04-viewer/artifacts/reviews/review-review-0042.md).

- **Review 2026-11-12T11:41:07.936006+00:00: SUCCESS.** Commit `b1afc2020aa293f242aab79e2d10434a24e93a87`; tree `5a72d914baa4c687af82e846efb5dc0ca55d33d1`. [Review artifact](../../workflows/collect-evidence-feedback-04-viewer/artifacts/reviews/review-review-0049.md).
