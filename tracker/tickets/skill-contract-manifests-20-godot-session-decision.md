---
blocked_by: 
  - skill-contract-manifests-19-godot-preferences
id: skill-contract-manifests-20-godot-session-decision
parent: skill-contract-manifests
schemaVersion: tracker-ticket/v2
sequence: 20
title: Resolve the Godot mentor restoration mismatch
triage: ready-for-agent
type: research
work_status: unclaimed
---

## What to build

Decide whether session start restores mentor preferences or whether the guidance must stop claiming restoration.

Implement this owner-specific slice under the existing initiative. Preserve its scope limits and contract ownership.

## Acceptance criteria

- [ ] Compare the documented restoration promise with the actual hook and record the mismatch with executable evidence.
- [ ] Present the restoration and documentation-only choices, their host compatibility, privacy, permission, and fallback effects. Obtain the operator decision before changing behaviour.
- [ ] Record the approved decision and acceptance checks for implementation. If implementation needs separate work, publish its scoped follow-up through the ticket skill.
- [ ] Keep preference JSON ownership with godot-mentor. Do not change stored preferences or implement restoration as part of this decision ticket.

## Scope boundaries

This is a decision ticket. Do not choose or implement a restoration policy without the recorded operator decision.

## Verification

Run the actual session-start path against isolated fixtures and compare the observed output with the documented claim. Record evidence, the alternatives, and the approved answer. Do not change personal preference files.

## Evidence

Derived from approved group `godot-session-integration-question` in the [recovery owner assessment](../../workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/owner-requests.json). This assessment is bound to source commit `32f03b1de98d9a5de018ab21106e22fbc6395c65`. Verify the cited producer and consumer evidence before implementation.

Keep Cyberpunk/Cyberwise requests retired. Do not recreate their deleted skills.

## Comments

