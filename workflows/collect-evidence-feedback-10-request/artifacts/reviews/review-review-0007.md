---
description: Frozen-source Standards and Spec review
title: Independent review review-0007
type: Concept
---

# Review review-0007

Verdict: FAILURE. Both independent axes identify the same P2 blocked-result defect.

## Target

Ticket: tracker/tickets/collect-evidence-feedback-10-request.md. Initiative: tracker/initiatives/collect-evidence-feedback/index.md. Canonical context checkout: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles. Source workspace: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-10-request. Branch: feature/collect-evidence-feedback-10-request. Base branch: master. Source commit: a1bb88ca440543bce3b1db6d8539972f9f857cb0. Source tree: f9a88b8fa75e5d6a89727747912e5231f484a150. Review base commit: 512e2ec7eb0709365f76ba460b8336d8d33bf5eb.

Review used the exact two-SHA diff, not current master or moving HEAD. Metadata differences outside the supplied product scope are not product deletions. The source remains frozen and read-only. No integration or remote Git operation ran.

## Scope and contracts

- **Scope:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback
- **Scope:** mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- **Scope:** mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json

- **Contract:** collect-feedback request CLI
- **Contract:** collect-evidence sealed run provenance
- **Contract:** existing feedback import and server lifecycle
- **Contract:** plugin bundle version manifests

Integration check:

```sh
mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/request-workflow.test.ts
```

## Standards

Standards: FAILURE. One concrete control-flow defect bypasses the documented blocked-before-import boundary when a run contains both FAIL and BLOCKED cases. No actionable baseline smell was found. No ADR applies; the canonical ADR index contains only the Pi Ink cleanup boundary. Review used the exact assigned diff and local dependencies. Tests, builds, linters, formatters, capture, serving, and remote Git operations were not run. The parent owns public smoke verification. Shared manifest version changes were read but not treated as code findings.

## Spec

One blocking spec defect: mixed FAIL/BLOCKED runs can create a feedback session despite the documented blocked-request stop. Versioned user-invocable frontmatter, installed collector invocation, immutable-source validation, historical selection, importer/server reuse, actual readiness references, and signal forwarding are present. Read the canonical native smoke receipts; they record real TUI/GUI capture, saved pins, export, historical reuse, blocked prerequisites, and shutdown. This review ran no tests or browser workflows, as assigned. Missing Chrome is a coverage limit, not a product defect. No ADR applies.

## Blocking findings

### R-001: Mixed FAIL/BLOCKED results bypass the request stop

Severity: P2. ADR: NO ADR. Axis IDs: standards-1 and SPEC-001. File: mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/request.ts. Line: 35.

The request procedure states: “A blocked collector or operation without a sealed result stops before import and returns exit 3 or 1.” The ticket requires prerequisite and credential stops. The collector gives FAIL precedence over BLOCKED when selecting its exit code at collect-evidence.ts:69–70. A sealed run with one FAIL and one BLOCKED therefore returns success:true and exit 1. The request exception checks only for any FAIL. It accepts this blocked result and calls importSession and serveSession.

This is a static producer/consumer proof, not a claimed mixed-run runtime reproduction. The passing regression covers a single BLOCKED case only. The native collector still stops the affected action; this defect does not submit credentials. It violates the request-level stop and can present an incomplete collection as a completed feedback request.

Required change: Check for BLOCKED before accepting assertion-only failure. Retain the diagnostic source reference, return exit 3, and do not import or serve. Keep assertion-only FAIL results reviewable. Add a public-command regression with both FAIL and BLOCKED cases.

Validation command:

```sh
"$FEEDBACK_SKILL_ROOT/scripts/collect-feedback.ts" request "$MIXED_FAIL_BLOCKED_WORKSPACE" --repository "$REPOSITORY" --workflow "$WORKFLOW" --session mixed-verdict-review --port 8091 --json
```

Use a real approved compiled workspace with one assertion failure and one blocked prerequisite or safe credential stop. Verify exit 3, retained sealed diagnostics, no session.json, and no listening server. Then run the integration check above.

## Validation

- **Scoped public regression:** Ran the exact integration check from the frozen source workspace. Exit 0; 1 pass, 0 fail, 25 expectations. It exercises installed copies from an unrelated directory, historical dry-run, actual HTTP session identity, export, a real unavailable X11 prerequisite, no blocked import, and shutdown.
- **Independent public smoke:** Ran `mise exec -- bun /tmp/review-0007-smoke.ts` from /tmp. The temporary script invoked the frozen absolute collect-feedback.ts request entrypoint against the retained real fresh-gui sealed run, with --historical, a temporary repository-backed route, workflow review, session historical, port 36691 and --json. No fake evidence run was created.
- **Observed HTTP result:** Actual URL http://127.0.0.1:36691. GET /api/v1/session retained historical:true and runId fresh-gui. GET /api/v1/cases returned the original registered asset. POST /api/v1/annotations returned 201. GET /api/v1/export retained saved pin 55ed70ab-38b9-48e1-b69e-09ba7ff2c611 and source SHA-256 998769a24674e637d4d2d6819a9492728cc0239c4f760bfd61cfaf12fca67b19.
- **Smoke shutdown:** SIGTERM returned server exit 0. The writer lock disappeared and the port refused connections. The wrapper then exited 1 because rm encountered immutable imported directories. Scoped chmod -R u+w and rm removed only /tmp/review-0007-FO8T0V; cleanup exit 0. All temporary review scripts were removed. The wrapper cleanup error is not a request failure.
- **Prior native evidence:** Consumed implementation-0003, start-complete-0005 and the draft snapshot. They record real fresh TUI/GUI requests, viewer-created saved pins, export, historical labeling, credential/confirmation stops, assertion-only FAIL review and owned shutdown. These are prior observations, not rerun claims.
- **Coverage limits:** This reviewer did not rerun fresh native captures, actual browser UI interaction, real recording or the full suite. The retained full suite reports 103 pass, 32 skipped and two known missing /opt/google/chrome/chrome failures. They were not rerun. Missing browser prerequisites and the earlier failed language-server startup remain limits, not passing checks.

## Coordination

Ran the canonical inspector and coordination.ts with all three scope paths. The inspector has no receipt diagnostics and sees this current phase-start without its result. Its retry classification does not launch another review; this child completes the assigned attempt. Coordination inventory remains incomplete due to stale linked ticket copies, an absent unrelated checkout and malformed unrelated goal journals. No repair was attempted. The known shared plugin-manifest overlap remains an integration risk. This read-only review does not certify current-base compatibility. Recheck the manifest versions and affected contracts against current master before integration.

## Independent sessions and resources

Standards run: 3217e363-dc46-4942-bac7-8e391ad5620e. Spec run: d89967c3-a4d0-482e-a33b-90fe6bc253db. Both ran in fresh tabs in the source workspace. Their code-review-axis/v1 deliveries passed schema, run, operation and hash verification and were acknowledged. Both subordinate tabs were closed and removed. Resource observations are recorded in the result receipt. The active reviewer remains for parent-controlled closure. No user window, terminal or evidence was changed.

## Verdict

FAILURE. Standards: 1 P2 finding. Spec: 1 P2 finding. They describe one unique defect, R-001. Fix it and obtain a fresh exact-source review.

Timestamp: 2026-11-17T20:50:45.697Z.

