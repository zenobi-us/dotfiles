---
blocked_by: 
  - collect-evidence-feedback-04-viewer
id: collect-evidence-feedback-05-pins
parent: collect-evidence-feedback
schema: tracker-ticket/v1
sequence: 5
title: Create and save screenshot feedback pins
triage: ready-for-agent
type: enhancement
work_status: completed
---

# Create and save screenshot feedback pins

## What to build

Draw a box or point pin, write a near-pin comment, select a priority badge and retain the saved note after restart.

Implement this complete slice. Follow the collect-evidence-feedback initiative and its common schema, command, storage, safety and testing rules.

## Acceptance criteria

- **Implement Option A** with pointer and keyboard creation. Support forward and reverse box drags, point pins, arrow movement, Shift plus arrow resizing, Escape cancellation and Ctrl or Meta plus Enter to save.
- **Use a floating** near-pin editor and labelled P1 Blocker, P2 Friction and P3 Polish badges. Start new drafts at P2. Require comment text. Provide visible focus and accessible controls without a severity dropdown.
- **Bind each annotation** to its session, case, asset ID, source SHA-256, original dimensions and stable annotation ID. Store normalized top-left geometry. Round original-pixel edges once and derive width and height from the rounded edges.
- **Keep pins attached** through zoom, pan and viewport changes. Keep the selected pin visible and clamp the comment editor. Check odd-width edge cases without changing source image bytes.
- **Create and list** annotations through the specified JSON API. Use atomic durable writes, stable IDs on save retry, returned revisions and ETags. Show Saved only after the server acknowledges the durable write.
- **Check source hashes** before saves and export. Reject a changed source rather than retargeting feedback. Apply write-token, Origin, Host, payload, size and registered-asset checks before a mutation.
- **Export saved annotations** and their source references through the CLI and API. Preserve priorities, comments, timestamps and normalized and original-pixel geometry. Read-only export must not change the session.
- **Exercise the actual** browser, HTTP service and stored files. Save a real note, reload the browser, restart the server and compare the exported identity, hash and geometry. Finish or fail pending saves explicitly on shutdown.

## Verification

Use the public workflow boundary approved in the initiative. Exercise the installed commands and the applicable HTTP, browser or native-driver surface. Use temporary resolved stores. Keep regression checks for consumer-visible failures. Do not prove behaviour from generated source text. Update affected documentation after verification.

## Specification coverage

This slice covers initiative user stories 26, 27, 28, 29, 30, 31, 33, 38, 39, 41, 44. Keep the initiative as the complete specification.

## Comments

Review FAILURE — 2026-11-12T22:32:49.855Z. Reviewed commit `10f8f120cd4b796354984a9c561117ad4701dfb5`, tree `32b3e835e04439239c5afae56d664b72ec44e8ff`. [Immutable review](../../workflows/collect-evidence-feedback-05-pins/artifacts/reviews/review-review-0007.md).



Review SUCCESS — 2026-11-13T00:39:56.862Z. Reviewed commit `0fcfd5dd0c3f03d7ed65dffd3127aa3883da6de2`, tree `3f4145d7c9d7da7239f02a61a9d0a73b57aee5a8`. [Immutable review](../../workflows/collect-evidence-feedback-05-pins/artifacts/reviews/review-review-0019.md).


Review FAILURE — 2026-11-13T02:20:31.416Z. Reviewed resolution commit `06e09dfcc624a6edd651668b6358c11ed63be985`. [Immutable resolution review](../../workflows/collect-evidence-feedback-05-pins/artifacts/reviews/review-resolution-review-0024.md). RES-01 and RES-02 were repaired by `368cd426b55d756bd88cf13badf31b1f6a8cf553`.

Review SUCCESS — 2026-11-13T02:32:42.970Z. Reviewed resolution commit `368cd426b55d756bd88cf13badf31b1f6a8cf553`, tree `2539bfae850205e2516c236b372634e4cbb8af37`. [Immutable resolution review](../../workflows/collect-evidence-feedback-05-pins/artifacts/reviews/review-resolution-review-0030.md). No remaining findings.

Completed — 2026-11-13. Squash integration `32ceb6fdb6daee017802f6ddfe939b4df90bc37a` is published on `origin/master`. Candidate-bound viewer typecheck, public installed workflow, and standalone Chromium capture/import/HTTP save/offline export smoke passed. [Integration and publication receipt](../../workflows/collect-evidence-feedback-05-pins/events/finish-pushed-0035.yaml). Resource cleanup is recorded separately in the finish workflow.



