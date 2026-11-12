---
blocked_by: 
  - collect-evidence-feedback-01-web
id: collect-evidence-feedback-03-gui
parent: collect-evidence-feedback
schema: tracker-ticket/v1
sequence: 3
title: Collect scoped native GUI evidence
triage: ready-for-agent
type: enhancement
work_status: completed
---

# Collect scoped native GUI evidence

## What to build

Capture an approved GUI window or display and produce a valid evidence case without unsafe input or permission fallbacks.

Implement this complete slice. Follow the collect-evidence-feedback initiative and its common schema, command, storage, safety and testing rules.

## Acceptance criteria

- **Use the common** evidence commands, records, notes, store routing and report model. Record the selected window or display identity, capture method, actual dimensions and source hash.
- **Check platform-native capture** tools and permissions before collection. Capture a real supported GUI surface when access is available. Record an unavailable required capture as blocked, not passed.
- **Keep capture within** the approved window or display scope. Check that the native image shows the expected visible state.
- **Stop before an** unapproved confirmation or credential entry. Do not install tools, request sudo, execute device-side operations or start remote Git work.
- **Preserve borrowed windows** and sessions. Close only collector-owned resources and record any unintended side effect.
- **Deliver the GUI** driver playbook and capability limits. Exercise the public CLI with a real GUI case and a blocked-permission case.

## Verification

Use the public workflow boundary approved in the initiative. Exercise the installed commands and the applicable HTTP, browser or native-driver surface. Use temporary resolved stores. Keep regression checks for consumer-visible failures. Do not prove behaviour from generated source text. Update affected documentation after verification.

## Specification coverage

This slice covers initiative user stories 3, 11, 19, 21. Keep the initiative as the complete specification.

## Comments

### Independent review review-0006

- Verdict: FAILURE.
- Reviewed commit: `4e5def3a26cf0ac700ee29b3c1f92e8a7704ca71`.
- Reviewed tree: `36f17fc4bb60031eedb54d69a88b2a1c3ef93d74`.
- Timestamp: `2026-11-12T00:30:08.023Z`.
- Artifact: [Immutable review](../../workflows/collect-evidence-feedback-03-gui/artifacts/reviews/review-review-0006.md).



### Independent review review-0017

- Verdict: SUCCESS.
- Reviewed commit: `4e5def3a26cf0ac700ee29b3c1f92e8a7704ca71`.
- Reviewed tree: `36f17fc4bb60031eedb54d69a88b2a1c3ef93d74`.
- Timestamp: `2026-11-12T01:48:12.451Z`.
- Artifact: [Immutable review](../../workflows/collect-evidence-feedback-03-gui/artifacts/reviews/review-review-0017.md).


### Independent review review-0024

- Verdict: FAILURE.
- Reviewed commit: `c224ea08907df7d2dc2a12d297bbd107fb1597af`.
- Reviewed tree: `2f409d6d19cfc5bcd56cd824f74410b58aa2ed1c`.
- Timestamp: `2026-11-12T02:54:06.991951+00:00`.
- Artifact: [Immutable review](../../workflows/collect-evidence-feedback-03-gui/artifacts/reviews/review-review-0024.md).


### Independent review review-0030

- Verdict: SUCCESS.
- Reviewed commit: `4a938e995dd0802734a90cc52d58d53fe9d4da71`.
- Reviewed tree: `24e210d91d87828411ef0d0146d938f6934e66b7`.
- Timestamp: `2026-11-12T04:37:54.436Z`.
- Artifact: [Immutable review](../../workflows/collect-evidence-feedback-03-gui/artifacts/reviews/review-review-0030.md).


### Independent review review-0037

- Verdict: SUCCESS.
- Reviewed commit: `d70fe7e463638f134d6226397ca38724492deca4`.
- Reviewed tree: `1cfddc006ae099564cbef521b2cea8384c8c461d`.
- Timestamp: `2026-11-12T04:48:49.502322+00:00`.
- Artifact: [Immutable review](../../workflows/collect-evidence-feedback-03-gui/artifacts/reviews/review-review-0037.md).


### Verified completion

Merged as `4441b5c0aacecbb6620b1696a5b3c483e5733fb7` and published on `origin/master`; remote observed `aa49cf43a254a091b85506eab3e8378bfc841414`. Current SUCCESS review and exact integration mapping: [finish-0043](../../workflows/collect-evidence-feedback-03-gui/events/finish-0043.yaml). Integrated public native workflow passed60 assertions; verdict/workflow checks passed99 tests and892 assertions. [Successful sealed runs](../../workflows/collect-evidence-feedback-03-gui/artifacts/evidence/integrated-native-0042/native/run.json) and [retained fixture-size failure](../../workflows/collect-evidence-feedback-03-gui/artifacts/evidence/integrated-fixture-size-0041/run.json) remain immutable.

Known Surf failure and unavailable Playwright/TUI/typecheck remain documented. No passing cross-driver baseline, generalized dialog detection or occlusion isolation is claimed.
