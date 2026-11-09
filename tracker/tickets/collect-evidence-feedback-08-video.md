---
blocked_by: 
  - collect-evidence-feedback-02-tui
  - collect-evidence-feedback-03-gui
  - collect-evidence-feedback-05-pins
id: collect-evidence-feedback-08-video
parent: collect-evidence-feedback
schema: tracker-ticket/v1
sequence: 8
title: Record supported video and attach timestamped feedback
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

# Record supported video and attach timestamped feedback

## What to build

Record real video where the selected driver supports it, then review a paused timestamp and save a bound feedback pin.

Implement this complete slice. Follow the collect-evidence-feedback initiative and its common schema, command, storage, safety and testing rules.

## Acceptance criteria

- **Preserve any web** recording capability already retained by the web cutover. Add native recording only where the TUI or GUI driver has a supported recorder and permission.
- **Report actual video** capabilities through doctor. Store real playable media with its format, timing, dimensions, driver provenance and source hash. Do not create empty, reconstructed or simulated recordings.
- **When optional video** is unavailable, record the reason and keep valid image evidence. A missing required image prerequisite remains blocked.
- **Play registered video** in the feedback viewer. Attach a comment and geometry to a paused timestamp and displayed frame dimensions. Keep the source video immutable.
- **Preserve timestamps and** source identities through save, reload, restart and export. Do not claim object tracking or exact frame accuracy without measured support.
- **Exercise a real** available recorder and the actual browser player. Verify decoded content, the intended sequence and timestamped notes. Verify the explicit unsupported-video path for other drivers.

## Verification

Use the public workflow boundary approved in the initiative. Exercise the installed commands and the applicable HTTP, browser or native-driver surface. Use temporary resolved stores. Keep regression checks for consumer-visible failures. Do not prove behaviour from generated source text. Update affected documentation after verification.

## Specification coverage

This slice covers initiative user stories 12, 13, 40. Keep the initiative as the complete specification.

## Comments

No discussion has been recorded.

