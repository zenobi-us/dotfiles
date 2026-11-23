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

