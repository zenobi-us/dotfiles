---
schema: tracker-ticket/v1
id: pi-ink-bridge-03-pair-device
title: "Pair and revoke a tablet"
parent: pi-ink-bridge
sequence: 3
type: task
triage: ready-for-agent
work_status: claimed
blocked_by: ["pi-ink-bridge-02-install-client"]
---

## What to build

Connect to a server by address, verify its identity, and approve pairing from the local desktop. Retain pairing across restarts and revoke a device without leaving active image access.

Follow the parent initiative specification. Keep its scope limits and approved integration seam. Hardware checks require a real Paper Pro and its owner for device-only actions.

## Acceptance criteria

1. Manual server entry requires an explicit trusted fingerprint check. Use encrypted connections with verified certificate trust for pairing and credentials.
2. Open pairing for a bounded onboarding window. Show a matching code on the tablet and local management page. Require explicit desktop approval before issuing a credential.
3. Pending, expired, denied, unpaired, and wrong-server clients cannot obtain image access. Limit failed pairing attempts. Installation and discovery do not grant access.
4. Give the server and device stable identities. Save revocable device credentials with restricted permissions. Keep credentials out of URLs and logs. Pairing survives client and service restarts.
5. Revocation closes active connections and rejects later authenticated requests from the device.
6. Negotiate supported protocol versions for extension and tablet connections. Reject incompatible versions without discarding credentials or stored work.
7. Keep approval and revocation on a loopback management surface. Reject unexpected hosts, origins, and cross-site browser mutations. The LAN setup page exposes no unauthenticated administrative actions.
8. Exercise the real service and tablet protocol over HTTPS and WebSocket connections. Prove denied access through protected operations, not only through displayed status.

## Comments

The user approved this ticket and its direct blockers during initiative decomposition.
