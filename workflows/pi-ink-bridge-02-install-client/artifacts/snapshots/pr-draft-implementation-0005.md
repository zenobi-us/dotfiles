---
title: Pi Ink cable preflight result
type: Report
---

# Install and launch the tablet client

## Ticket and problem

`tracker/tickets/pi-ink-bridge-02-install-client.md` remains claimed. The production install and launch acceptance remains blocked. The host implementation provides a persistent service and verified installation flow. This continuation covers read-only cable preflight only.

## Implementation and changed files

No source or tracker changes. The source implementation is `063298ca28c8e0c66d74f9bd35122d651df9dd36`. The inspected continuation target is `5a662108044deba17ed09e453be8e2b0e1c98ffb`, tree `34c20c0956c512abdeac946e7e44129f3533fe3d`. This phase adds only workflow evidence, this snapshot, the result receipt, and generated views. It preserves the parent start receipt.

## Validation

One cable SSH connection succeeded with the existing verified host key. Model: `reMarkable Ferrari`. Architecture: `aarch64`. Firmware metadata: `VERSION_ID=5.8.203`, `IMG_VERSION=3.28.0.172`. The installer firmware guard uses VERSION_ID and would reject these values. The preflight stopped before stock hash, dependency metadata, and target collision reads. No host tests or builds were repeated.

## Review history and findings

No independent review or reviewer verdict exists. No review findings were resolved. The firmware guard mismatch blocks the current installer. Native dependency compatibility, current stock identity, and target metadata remain unknown. Required native launch and repeat-install acceptance remain outstanding.

## Next approval

Authorize a separate host-only correction to use the actual firmware field IMG_VERSION, with a focused regression check and a new installer digest. This does not authorize device access. After review, obtain renewed bounded read-only cable preflight approval. A final payload manifest is not ready. Installation, activation, and repeat-install need separate later approvals.

## Merge and device state

Not merged or pushed. No device writes, helper transfer or execution, installation, restart, firmware, settings, pairing, notebook, or unrelated-extension changes occurred. The desktop protocol-1 service on port 47840 was not changed. The parent must validate this result and close pane w6P:p2.

## Supporting records

- [Initial start](../../events/start-0001.json)
- [Prior host implementation](../../events/implementation-0002.json)
- [Prior parent completion](../../events/start-complete-0003.json)
- [Preflight start](../../events/start-0004.json)
- [Blocked result](../../events/implementation-0005.json)
- [Prior host validation](../evidence/host-20261108-install-001/verification.json)
- [Prior approval boundaries](../evidence/host-20261108-install-001/device-approval-request.json)
- [Exact command and observed result](../evidence/device-preflight-0004/cable-preflight.json)
- [Compatibility analysis](../evidence/device-preflight-0004/compatibility-analysis.json)

