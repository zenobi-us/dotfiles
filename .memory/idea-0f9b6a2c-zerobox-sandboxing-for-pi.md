---
id: 0f9b6a2c
type: idea
title: Zerobox sandboxing for Pi tool-calling security
created_at: 2026-05-01T02:59:54Z
updated_at: 2026-05-01T03:00:38Z
status: incubating
horizon: next
promote_criteria:
  - All tool-calling execution paths in Pi are identified and sandbox coverage is verified end-to-end.
  - Deny-by-default execution policy is implemented and tested for unmanaged calls.
  - Secret access is host-scoped with least privilege and auditable boundaries.
  - Failure-mode tests confirm fail-closed behavior when policy or sandbox checks fail.
related_epic_id:
---

# Zerobox sandboxing for Pi tool-calling security

## Problem/Opportunity
Pi can only claim strong tool-calling security if every execution path is governed by sandbox controls. Any bypass path weakens the overall security claim.

## Expected Impact
- Aligns security messaging with implementation reality.
- Reduces blast radius through deny-by-default policy and host-scoped secrets.
- Improves resilience by requiring fail-closed behavior on control-plane failures.

## Unknowns
- Complete inventory of all direct and indirect tool-calling paths in Pi.
- Whether plugin/extension hooks introduce unsandboxed escape routes.
- Operational trade-offs (latency, compatibility, DX) under strict default-deny.
- How to communicate caveats: absolute guarantees are not realistic; guarantees are conditional on full-path coverage and correct configuration.

## Promotion Decision
- **Outcome**: incubating
- **Rationale**: Direction is high-value, but should only be promoted after path inventory + coverage tests validate no unsandboxed execution route remains.
