---
blocked_by: 
  - collect-evidence-feedback-01-web
id: collect-evidence-feedback-02-tui
parent: collect-evidence-feedback
schema: tracker-ticket/v1
sequence: 2
title: Collect accurate native TUI evidence
triage: ready-for-agent
type: enhancement
work_status: completed
---

# Collect accurate native TUI evidence

## What to build

Run a TUI case with termscope and save native terminal images with correct colour, spacing and screen identity.

Implement this complete slice. Follow the collect-evidence-feedback initiative and its common schema, command, storage, safety and testing rules.

## Acceptance criteria

- **Use the common** evidence commands, records, store routing, notes and reports. Select and control the exact terminal session that supplies the native capture.
- **Provide the Linux** CPU-rendered foot, private terminal session, Cage/wlroots and grim playbook. Record terminal and display identities. Keep borrowed terminal sessions intact.
- **Check required tools** and permissions through doctor. Block a missing prerequisite with exit code 3 and a useful reason. Do not install tools, force graphics versions or substitute SVG or text reconstructions.
- **Synchronize with the** visible screen. Exercise a screen transition and inspect the resulting native image. A matching terminal buffer alone cannot pass the visual check.
- **Check colour, line** spacing, dimensions, expected screen content and the source media hash through a real CLI workflow.
- **Before Enter or** a confirmation, check the screen and approved scope. Stop at a credential prompt or an unapproved action. Record limits, side effects and owned-resource cleanup.
- **Publish the TUI** driver playbook and update the common capability documentation without changing either existing web driver.

## Verification

Use the public workflow boundary approved in the initiative. Exercise the installed commands and the applicable HTTP, browser or native-driver surface. Use temporary resolved stores. Keep regression checks for consumer-visible failures. Do not prove behaviour from generated source text. Update affected documentation after verification.

## Specification coverage

This slice covers initiative user stories 7, 8, 9, 19, 21, 22. Keep the initiative as the complete specification.

## Comments

### Review — 2026-11-11T11:29:00.901Z

Verdict: FAILURE. Reviewed commit: 68acd4074c636933fdf5e8645a09d1acf6abdf67. Reviewed tree: 68589997ea8dafb4a336777829a0105806fa44d2. [Independent review](../../workflows/collect-evidence-feedback-02-tui/artifacts/reviews/review-review-0008.md).

### Review — 2026-11-11T12:24:14.748Z

Verdict: FAILURE. Reviewed commit: acca2d29294e8c60bf8a97d0b98dbdbb4bb095aa. Reviewed tree: 1c5b4864e098d70b53519051d2df6d05184f5729. [Independent review](../../workflows/collect-evidence-feedback-02-tui/artifacts/reviews/review-review-0014.md).



### Review — 2026-11-11T21:10:30.643Z

Verdict: FAILURE. Reviewed commit: a50eb7b56c79151c48abe4e5595b8da2b63eec98. Reviewed tree: 0aafea468291c367eac265ad883de220cd48b442. [Independent review](../../workflows/collect-evidence-feedback-02-tui/artifacts/reviews/review-review-0020.md).


### Review — 2026-11-11T22:06:50.866Z

Verdict: SUCCESS. Reviewed commit: 3d05a5611dae33c992d8bbd81ed265a27d23892c. Reviewed tree: e758e20e8bc45d732d01028960802390d347d11b. [Independent review](../../workflows/collect-evidence-feedback-02-tui/artifacts/reviews/review-review-0026.md).

### Review — 2026-11-11T22:23:09.012Z

Verdict: SUCCESS. Reviewed commit: de8615f5eb03069289e7d594872e5dc3dff5c325. [Independent review](../../workflows/collect-evidence-feedback-02-tui/artifacts/reviews/review-review-0031.md).

### Review — 2026-11-11T22:30:25.934Z

Verdict: SUCCESS. Reviewed commit: e9d1a62de21fc2b8ccff7940fa333f42a87e5e3d. Reviewed tree: d879ba9c67b26a573e1b5eebb1d5741e734c15c7. [Independent review](../../workflows/collect-evidence-feedback-02-tui/artifacts/reviews/review-review-0034.md).

### Completion — 2026-11-11T22:35:02.957006+00:00

Merged and pushed commit 50872fcdb85a85ef14256ae56c0c169a1f14aefe to origin/master after exact-source SUCCESS review. Integrated public CLI verification passed all 13 scenarios: native transition PASS; twelve credential cases BLOCKED without input. Source suites: 99 common tests and 28 native tests passed. [Published integration checkpoint](../../workflows/collect-evidence-feedback-02-tui/events/finish-0038.yaml); [integrated evidence](../../workflows/collect-evidence-feedback-02-tui/artifacts/evidence/finish-0038-integrated/validation.json). Two historical Low nonblocking findings remain recorded in the review.
