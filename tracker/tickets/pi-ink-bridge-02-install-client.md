---
schema: tracker-ticket/v1
id: pi-ink-bridge-02-install-client
title: "Install and launch the tablet client"
parent: pi-ink-bridge
sequence: 2
type: task
triage: ready-for-agent
work_status: claimed
blocked_by: ["pi-ink-bridge-01-pen-prototype"]
---

## What to build

Run /annotate add-device to start the shared annotation service and obtain trusted installation instructions. Install the production tablet client once and open its connection screen through Pi Annotations in the sidebar.

Follow the parent initiative specification. Keep its scope limits and approved integration seam. Hardware checks require a real Paper Pro and its owner for device-only actions.

## Acceptance criteria

1. Concurrent extension instances start one compatible service per desktop user. Use pinned mise dependencies and Pitchfork supervision. The service continues after an extension exits and does not follow directory entry or exit.
2. Report readiness failure without presenting a successful setup page. Provide a LAN-accessible setup URL when the service is ready.
3. Explain Developer Mode, its factory reset, and its security effects before installation. Do not enable Developer Mode or upgrade firmware automatically.
4. Provide a generated one-time SSH installation command. Download and verify both the installer and client ZIP before execution or extraction. Obtain expected digests through trusted extension output or the loopback management surface, not a checksum beside an HTTP download.
5. Provision the stable server identity and certificate fingerprint through the verified installation flow. Do not disable certificate verification.
6. Check model, tested firmware range, dependencies, and permissions before changes. Reject unsupported devices, unsupported firmware, and altered downloads before execution or installation.
7. Keep client data on the home partition where supported. Preserve unrelated files. Repeat installation without duplicate sidebar entries or loss of existing drafts and pairing records.
8. Keep the XOVI sidebar integration thin. Open the AppLoad client and show its connection state. Report the required application restart or device reboot, then observe launch after that restart.

## Comments

The user approved this ticket and its direct blockers during initiative decomposition.
