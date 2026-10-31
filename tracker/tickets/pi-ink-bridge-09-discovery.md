---
schema: tracker-ticket/v1
id: pi-ink-bridge-09-discovery
title: "Discover servers and reconnect after network changes"
parent: pi-ink-bridge
sequence: 9
type: task
triage: ready-for-agent
work_status: unclaimed
blocked_by: ["pi-ink-bridge-03-pair-device"]
---

## What to build

Discover local annotation servers from the tablet and reconnect after address changes. Keep manual address entry available when multicast is blocked.

Follow the parent initiative specification. Keep its scope limits and approved integration seam. Hardware checks require a real Paper Pro and its owner for device-only actions.

## Acceptance criteria

1. Advertise _pi-annotate._tcp with server ID, display name, port, protocol version, and pairing availability. Do not publish credentials, job details, conversation content, or image names.
2. Show recognizable server choices. Discovery does not grant access or bypass local pairing approval.
3. Update a saved server address only when stable server identity and certificate trust still match. Reject an identity or trust mismatch.
4. Provide manual address entry and explicit fingerprint verification when multicast discovery fails.
5. Explain client isolation, firewall restrictions, and unreachable-server errors. Do not silently modify firewall rules.
6. Observe real mDNS discovery on the supported LAN and desktop firewall configuration. Block multicast and verify manual connection.
7. Observe tablet sleep and wake. Report offline status until the authenticated connection and client readiness return. Do not treat a protocol simulation as proof of discovery or readiness.

## Comments

The user approved this ticket and its direct blockers during initiative decomposition.
