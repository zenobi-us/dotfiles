---
title: Pi Ink installation implementation result
type: Report
---

# Install and launch the tablet client

## Ticket summary

tracker/tickets/pi-ink-bridge-02-install-client.md remains claimed. Host implementation passed; required device acceptance is blocked.

## Problem statement

The old coordinator ended with its extension and supplied no production installation trust path.

## Implementation summary

Implemented one per-user Pitchfork-managed installation service with pinned mise tools, trusted loopback/extension digests, verified SSH bootstrap, persistent server TLS identity, preflight and data-preserving tablet installation, and a thin sidebar launcher for an AppLoad connection screen. Browser and completed PNG contracts remain unchanged. Required native device acceptance is blocked by missing scoped owner approval.

Source implementation: `063298ca28c8e0c66d74f9bd35122d651df9dd36`. Receipt target after the separate tracker commit: `82edbf73a1cc78d61079be62fa97d98eff445ecd`; tree `9824944411da9971edcb5d12a98b24f67064bd67`.

## Changed files

- `README.md`
- `bun.lock`
- `mise/conf.d/devtools-omp/extensions/image-annotator/coordinator-discovery.ts`
- `mise/conf.d/devtools-omp/extensions/image-annotator/index.ts`
- `mise/conf.d/devtools-omp/extensions/image-annotator/installation-client.ts`
- `mise/conf.d/devtools-omp/extensions/image-annotator/installation-service.ts`
- `mise/conf.d/devtools-omp/extensions/image-annotator/mise.toml`
- `mise/conf.d/devtools-omp/extensions/image-annotator/package.json`
- `mise/conf.d/devtools-omp/extensions/image-annotator/scripts/provision-tablet.sh`
- `mise/conf.d/devtools-omp/extensions/image-annotator/server-identity.ts`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-appload/Connections.qml`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-appload/application.qrc`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-appload/entry`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-appload/manifest.json`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-appload/sidebar.qmd`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/appload.go`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/build.sh`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/installation.go`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/installation_test.go`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/main.go`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/production-install.sh`
- `mise/conf.d/devtools-omp/extensions/image-annotator/test/coordinator-identity.test.ts`
- `mise/conf.d/devtools-omp/extensions/image-annotator/test/installation-service.test.ts`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tsconfig.json`
- `tracker/tickets/pi-ink-bridge-02-install-client.md`

## Validation results

- `MISE_AUTO_INSTALL=0 mise exec -- bun run typecheck`: passed.
- `MISE_AUTO_INSTALL=0 mise exec -- bun run build`: passed; Vite emitted existing third-party use-client and chunk-size warnings.
- `MISE_AUTO_INSTALL=0 mise exec -- bun test test`: 24 passed, 0 failed, 195 assertions.
- `MISE_AUTO_INSTALL=0 mise exec go@1.25.0 -- go test -race ./...`: passed; image-annotator-tablet, 22.430s.
- `sh scripts/provision-tablet.sh --dry-run`: passed; printed local ZIP and installer digests; no service or device connection.
- `sh -n scripts/provision-tablet.sh tablet-client/production-install.sh tablet-client/build.sh tablet-appload/entry`: passed.
- `MISE_AUTO_INSTALL=0 mise exec -- bun run build:tablet`: repeat build passed; identical ZIP SHA-256 03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629.

Real host smoke proved concurrent startup, persistence after extension exit, verified TLS availability, offline state, download tamper rejection, permission preflight rejection, and setup-page rendering. The Qt host emulator is not native tablet acceptance.

## Review history

No independent review has run. The only consumed phase is [start-0001](../../events/start-0001.json).

## Resolved findings

No independent findings exist. Host smoke defects were corrected before this result; diagnostics remain in the verification record.

## Remaining findings

Device acceptance is blocked. See the [bounded approval request](../evidence/host-20261108-install-001/device-approval-request.json). Dependency compatibility, native QMD/AppLoad launch after an approved restart, and tablet repeat installation remain unverified.

## Latest reviewer verdict

None.

## Merge status

Not merged or pushed. The worktree and pane remain for the parent.

## Supporting records

- [Implementation result](../../events/implementation-0002.json)
- [Host validation](../evidence/host-20261108-install-001/verification.json)
- [Final concurrent startup](../evidence/host-20261108-install-001/final-concurrent-start.json)
- [Altered-download rejection](../evidence/host-20261108-install-001/altered-downloads.json)
- [Permission preflight](../evidence/host-20261108-install-001/permission-preflight.json)
- [Trusted setup screenshot](../evidence/host-20261108-install-001/final-trusted-setup.webp)
- [Host QML screenshot](../evidence/host-20261108-install-001/connection-screen-host.png)
- [Host QML limits](../evidence/host-20261108-install-001/qml-host-smoke.json)
- [Offline host QML](../evidence/host-20261108-install-001/qml-offline-smoke.json)
- [Repeat build](../evidence/host-20261108-install-001/repeat-build.json)
- [Provisioning CLI](../evidence/host-20261108-install-001/provision-cli.json)
- [Cleanup](../evidence/host-20261108-install-001/cleanup.json)

