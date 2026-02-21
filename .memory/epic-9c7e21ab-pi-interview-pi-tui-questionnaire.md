---
id: 9c7e21ab
title: pi-interview pi-tui questionnaire UI
description: Evaluate and design a pi-tui-native questionnaire interface equivalent to pi-interview core behavior.
created_at: 2026-02-20T19:28:00+10:30
updated_at: 2026-02-20T19:39:55+10:30
status: planning
---

# Epic: pi-interview pi-tui questionnaire UI

## Vision/Goal
Create a pi-tui-native questionnaire experience in Pi that can present structured questions and return high-quality responses without launching an external browser flow.

## Success Criteria
- Source and behavior model for current `pi-interview` is verified from upstream source.
- A concrete implementation design exists for rendering, input handling, navigation, timeout/cancel semantics, and response output in pi-tui.
- A scoped MVP plan exists with clear deferred features and risks.

## Phases
- [Phase 1: Source Discovery & Feasibility](phase-3a5f1c8d-source-discovery-and-feasibility.md) ✅
- [Phase 2: Local extension MVP planning](phase-8b1e4d2f-local-extension-mvp-planning.md) 🟡

## Dependencies
- Confirm concrete extension directory/package path in this repository.
- Define migration behavior for existing `interview` consumers.
