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
work_status: claimed
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

