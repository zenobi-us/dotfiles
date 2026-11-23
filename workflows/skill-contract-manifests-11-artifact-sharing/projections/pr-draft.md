---
receipt_id: fix-result-0040
schemaVersion: worktree-pr-draft/v1
source_commit: 7eeefdfed44d18bc6bea9c482b438bf4e43f6ef8
source_tree: b70d4a21bb53f54c5c41a47e036842d192add4ca
title: Artifact-share contract fix 0040
type: Concept
workflow_id: skill-contract-manifests-11-artifact-sharing
---

# Artifact-share contracts — FIXED

Pending fresh independent review. Current review verdict: null. Earlier FAILURE verdicts are stale for the new source commit.

## Implementation

Share MDX ingestion now uses the same complete owned metadata interpreter as CLI generation, retrieval and repository checks. It validates all required fields after lossless historical hash interpretation. Ordinary non-share content keeps its page schema.

The replacement allowlist now declares artifact-share-consumer-history/v1. Its owner validates the complete asset, explicit identity, snapshot pins, file maps and duplicate keys before preview or mutation. One complete unversioned historical shape remains readable without rewriting evidence. The reviewed consumer snapshot enables the coordinated local code upgrade.

## Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/consumer-history.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/press.config.tsx`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/src/share-metadata.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/contracts.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/consumer-history-v1.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/share.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/consumers.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/consumers.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/site.test.ts`

## Validation

Affected suite: 37 pass, 0 fail, 801 assertions across four files. It exercises actual MDX builds and isolated installed upgrade CLIs, including supported current/historical assets, malformed structure, unknown identifiers, duplicate keys and clone byte preservation. Existing configuration, retrieval and repository scenarios also passed.

Separate smoke commands built and rendered a current share, rejected an invalid hash and missing source without rewriting pages, and exercised rejected unknown-history preview/confirmation plus supported preview/confirmation in a no-remote fixture. Site tsc --noEmit and owner manifest validate/resolve passed. The initial Node/Bun parser mismatch was corrected before the final passing suite. Language-server diagnostics were unavailable and are not counted as verification.

Full argv, cwd, exits and outputs: `artifacts/snapshots/validation-fix-0040.json`. Temporary fixtures were removed. No remote publication, merge, push or tracker mutation ran.

## Review history

- Review `review-result-0006`: historical FAILURE. Retained event: `events/review-result-0006.yaml`; artifact: `artifacts/reviews/review-review-result-0006.md`.
- Review `review-result-0014`: historical FAILURE. Retained event: `events/review-result-0014.yaml`; artifact: `artifacts/reviews/review-review-result-0014.md`.
- Review `review-result-0022`: historical FAILURE. Retained event: `events/review-result-0022.yaml`; artifact: `artifacts/reviews/review-review-result-0022.md`.
- Review `review-result-0032`: historical FAILURE. Retained event: `events/review-result-0032.yaml`; artifact: `artifacts/reviews/review-review-result-0032.md`.

## Provenance

Ticket: `tracker/tickets/skill-contract-manifests-11-artifact-sharing.md`. Initial implementation: `events/implementation-0002.yaml`. Prior fix: `events/fix-result-0026.yaml`. Consumed review: `review-result-0032`. Authorization: `fix-approval-0038`; start: `fix-start-0039`. Recovery retains `fix-approval-0034` and `fix-launch-failed-0037`. Coordination: `artifacts/snapshots/coordination-fix-0039.json`.

Source commit: `7eeefdfed44d18bc6bea9c482b438bf4e43f6ef8`; tree: `b70d4a21bb53f54c5c41a47e036842d192add4ca`. Result: `fix-result-0040`. Parent owns fresh review, workflow commits and graceful child shutdown.

## Open questions

None. STANDARDS-003 and SPEC-005 are resolved by observed behavior, not by a review verdict.



## Parent completion and merge status

[Ticket](../../../tracker/tickets/skill-contract-manifests-11-artifact-sharing.md) remains claimed. [Parent completion](../events/fix-complete-0041.yaml) records verified typed delivery, clean source, [actual upgrade rejection proof](../artifacts/snapshots/validation-parent-fix-0041.json) and [confirmed shutdown](../artifacts/snapshots/resources-fix-complete-0041.json). Both current findings are resolved. This is FIXED, not review SUCCESS. No source change, merge or push ran in the parent.

All historical reviews remain accessible: [0006](../artifacts/reviews/review-review-result-0006.md), [0014](../artifacts/reviews/review-review-result-0014.md), [0022](../artifacts/reviews/review-review-result-0022.md) and [0032](../artifacts/reviews/review-review-result-0032.md). The [initial implementation](../events/implementation-0002.yaml), [prior fix](../events/fix-result-0026.yaml), [current fix](../events/fix-result-0040.yaml), [current immutable draft](../artifacts/snapshots/pr-draft-fix-0040.md) and [validation](../artifacts/snapshots/validation-fix-0040.json) retain their separate provenance.

Next: fresh independent review of `7eeefdfed44d18bc6bea9c482b438bf4e43f6ef8`. The previous FAILURE is historical and stale. There is no current-source reviewer verdict. Unmerged and not pushed.


## Retained review and resolution history

- [Review 0006](../events/review-result-0006.yaml): FAILURE with SPEC-001. [Fix 0010](../events/fix-result-0010.yaml) resolved SPEC-001. [Draft](../artifacts/snapshots/pr-draft-fix-0010.md); [completion](../events/fix-complete-0011.yaml).
- [Review 0014](../events/review-result-0014.yaml): FAILURE at `2b9160cdac8a7c413944876c87292d0d023eeaf1`. STANDARDS-001 and SPEC-002 described existing consumer incompatibility. STANDARDS-002 and SPEC-003 described historical site ingestion. [Approval 0016](../events/fix-approval-0016.yaml) and [start 0017](../events/fix-start-0017.yaml) authorized [fix 0018](../events/fix-result-0018.yaml), which resolved those four findings. [Draft](../artifacts/snapshots/pr-draft-fix-0018.md); [completion](../events/fix-complete-0019.yaml).
- [Review 0022](../events/review-result-0022.yaml): FAILURE at `3378f0d89811c8ce67feadcc0326f8c86764a0ae` with SPEC-004. Standards had no actionable finding. The existing 36-test suite passed, but actual retrieval exposed the historical exponent-hash failure. [Approval 0024](../events/fix-approval-0024.yaml) and [start 0025](../events/fix-start-0025.yaml) authorized [fix 0026](../events/fix-result-0026.yaml). [Draft](../artifacts/snapshots/pr-draft-fix-0026.md); [completion](../events/fix-complete-0027.yaml); [confirmed cleanup](../events/fix-cleanup-observed-0029.yaml).
- [Review 0032](../events/review-result-0032.yaml): FAILURE at `8b616592357dd7c5c7472b54d3e946029bd2d2a9` with STANDARDS-003 and SPEC-005. The existing suite passed 36 tests and 275 assertions. Both contract defects were reproduced through actual consumers. [Review completion](../events/review-complete-0033.yaml) preserves its validation, verdict-only ticket comment and confirmed reviewer shutdown. [Approval 0034](../events/fix-approval-0034.yaml) and [failed attempt](../events/fix-launch-failed-0037.yaml) remain history. [Recovery approval 0038](../events/fix-approval-0038.yaml) and [start 0039](../events/fix-start-0039.yaml) authorized [fix 0040](../events/fix-result-0040.yaml). [Completion](../events/fix-complete-0041.yaml).

## Resolved and remaining findings

Resolved: SPEC-001, STANDARDS-001, STANDARDS-002, SPEC-002, SPEC-003, SPEC-004, STANDARDS-003 and SPEC-005. No unresolved implementation finding. Latest reviewer verdict remains historical FAILURE, stale after the fix. Current-source verdict is null. Fresh independent review is required.

