---
title: Evidence contract fix draft
type: Concept
---

# Evidence contract fix

## Ticket summary

[skill-contract-manifests-09-evidence](../../../tracker/tickets/skill-contract-manifests-09-evidence.md): adopt explicit evidence contracts without rewriting history.

## Problem statement

Current compilation metadata accepted mixed schemaVersion and schema fields.

## Implementation summary

The current guard now rejects schema presence and retains schemaVersion, kind and planHash checks. The public regression covers dry-run and actual run before driver startup or writes. Guidance documents rejection and historical immutability.

Current source: 62f26327084f0dca065ee8ec065c0437cdc54c7d; tree d802a953960f01c104a02959652453b55cc37201. Branch: feature/skill-contract-manifests-09-evidence; base: master. State: FIXED, pending fresh review.

## Changed files

- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/evidence-schema.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts

See [initial implementation snapshot](../artifacts/snapshots/pr-draft-implementation-0002.md) for the original implementation scope. Generated version output was restored in corrective source commit 62f26327; no earlier history was amended.

## Validation results

- Required public regression failed before the guard change: expected exit 2, received 0.
- Final focused regression: 1 pass, 13 assertions.
- Full integration suite: 112 pass, 33 skip, 0 fail.
- Separate public smoke: init, compile and valid dry-run exited 0. Mixed metadata exited 2 in dry-run and actual run. Input bytes, historical hashes, destination and staging stayed unchanged. The driver trap did not start.

Exact argv, exits and hashes: [immutable fix snapshot](../artifacts/snapshots/pr-draft-fix-0008.md).

## Review history

- [implementation-0002](../events/implementation-0002.yaml): initial implementation.
- [review-0005](../events/review-0005.yaml): FAILURE on dc75b3b33ab1f81c3c312cc38510dc3254ac2c5a. [Original immutable review](../artifacts/reviews/review-review-0005.md).
- [review-complete-0006](../events/review-complete-0006.yaml): parent recorded failure.
- [fix-start-0007](../events/fix-start-0007.yaml): authorization for EVIDENCE09-SPEC-001 only.
- [fix-0008](../events/fix-0008.yaml): new fix result, pending parent validation and fresh independent review.

## Resolved findings

EVIDENCE09-SPEC-001 is resolved by the fix, pending fresh review. ADR: NO ADR.

## Remaining findings

No unresolved assigned findings. No reviewer has covered the new source.

## Latest reviewer verdict

No current verdict. Prior FAILURE applies only to its recorded original commit. All review history and original artifacts remain unchanged.

## Merge status

Not merged. Ticket remains claimed. Parent owns review, phase completion and integration.


## Fix parent validation

[fix-complete-0009](../events/fix-complete-0009.yaml) validates the clean fixed source, delivered result and snapshot. The targeted public-command regression passed. The fixer pane is closed and owned process shutdown is confirmed after approved cleanup. Fresh independent review is required.
