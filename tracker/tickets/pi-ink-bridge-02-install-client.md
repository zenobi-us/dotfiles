---
blocked_by: 
  - pi-ink-bridge-01-pen-prototype
id: pi-ink-bridge-02-install-client
parent: pi-ink-bridge
schema: tracker-ticket/v1
sequence: 2
title: Install and launch the tablet client
triage: ready-for-agent
type: task
work_status: implemented
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


### Independent review 0063 — 2026-11-09T02:09:59.396087+00:00

Verdict: **FAILURE**. Reviewed commit: `e7f90b0b5b6233c3fb21b33b3924633115d32d6c`; tree: `c1526ae02dc828ab1a75ac479e7a4c3b782edc21`. [Immutable review artifact](../../workflows/pi-ink-bridge-02-install-client/artifacts/reviews/review-review-0063.md).


### Independent review 0069 — 2026-11-09T04:25:30.549733Z

Verdict: **SUCCESS**. Reviewed commit: `b6f4c7af4da729d1dfb175855247b74dc3d106d3`; tree: `2c63ba1d51dd94de767f0d688719f938a0a97031`. [Immutable review artifact](../../workflows/pi-ink-bridge-02-install-client/artifacts/reviews/review-review-0069.md).

### Preserved implementation history

The following dated records are preserved from reviewed source `b6f4c7af`; their earlier blocked-state instructions are historical. Independent review records above remain unchanged.

### Host implementation; device acceptance blocked — 2026-11-08

Source commit: `063298ca28c8e0c66d74f9bd35122d651df9dd36`. The persistent per-user service, trusted ZIP installation flow, thin sidebar launcher, and AppLoad connection screen are implemented. Typecheck, build, 24 Bun tests, Go race checks, and real host service/UI smoke checks passed.

[Host evidence](../../workflows/pi-ink-bridge-02-install-client/artifacts/evidence/host-20261108-install-001/verification.json) records the commands, limits, screenshots, and negative download checks. The AppLoad host transport emulator does not prove tablet readiness. No tablet connection or installation occurred. The default host port has an existing protocol-1 listener; setup rejected it without stopping it. Isolated ports proved successful startup.

Keep this ticket claimed. Owner approval is still required for cable-connected SSH preflight, exact-payload installation, one Xochitl restart after saving documents, post-restart sidebar launch, and repeat-install data-preservation checks. Record model, firmware, stock hash, and XOVI/AppLoad/qt-resource-rebuilder versions before changes. No Developer Mode change, firmware change, firewall change, pairing action, or unrelated extension change is authorized.

[Implementation result](../../workflows/pi-ink-bridge-02-install-client/events/implementation-0002.json) records the blocked acceptance boundary. No independent review, merge, or push occurred.

### Implementation accepted — 2026-11-09

Native launch and the available connection screen passed in [parent receipt 0057](../../workflows/pi-ink-bridge-02-install-client/events/start-complete-0057.json). The identical pinned production installer ran once (exit 0); all 29 public hashes, 42 protected metadata records, both link inodes/targets, private metadata, and 13 QMD names were preserved. The three verified public downloads and their empty owned stage were removed. [Committed repeat evidence](../../workflows/pi-ink-bridge-02-install-client/artifacts/evidence/repeat-install-0058/acceptance-summary.json) at `f1936b8c125dc3c5ae60c4435304f96400acf708` records the final gate. No restart, reboot, native launch, pairing, retry, or source change occurred in this attempt. Implementation is ready for fresh independent review; no merge or push.

