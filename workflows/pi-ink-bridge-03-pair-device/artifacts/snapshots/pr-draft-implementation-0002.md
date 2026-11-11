---
title: Pairing implementation acceptance snapshot
type: Report
---

# Pair and revoke a tablet

## Ticket summary

[pi-ink-bridge-03-pair-device](../../../../tracker/tickets/pi-ink-bridge-03-pair-device.md): implement approved, persistent, revocable tablet pairing. The ticket remains claimed.

## Problem statement

The persistent service exposed TLS health only. The production AppLoad screen could not request pairing, verify a manual address, receive a credential, or prove protected image access.

## Implementation summary

Host implementation is complete. Native Paper Pro acceptance is blocked. State remains IMPLEMENTING, with phase status blocked; this is not IMPLEMENTED or a completed ticket.

The real service now owns a two-minute onboarding window, ten-attempt limit, matching comparison codes, explicit local approval, hashed device credentials, revocation, and protocol negotiation. Management checks remote address, Host, Origin, browser site metadata, and CSRF. The LAN setup surface remains admin-free.

The actual AppLoad backend and Connections.qml support manual address verification against installed CA trust and an explicitly entered trusted fingerprint. Approved credentials survive backend and service restarts. An authenticated outbound WebSocket reports readiness. A protected HTTPS operation transfers a real checkerboard PNG that the client fully decodes, privately saves, and displays. It is an onboarding access check, not inbox dispatch.

Code-bearing commit: `c8684bc956cc99896884fe1c05dcb97f4ba7f97e`; tree: `8898c39e90234d5b3134f32b8fb41e9198ab9c10`. A later workflow-only metadata commit does not change this implementation identity. The authoritative phase result records its exact delivery HEAD and tree separately.

## Changed files

- `README.md`
- `mise/conf.d/devtools-omp/extensions/image-annotator/device-pairing.ts`
- `mise/conf.d/devtools-omp/extensions/image-annotator/installation-client.ts`
- `mise/conf.d/devtools-omp/extensions/image-annotator/installation-service.ts`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-appload/Connections.qml`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/appload.go`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/appload_pairing.go`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/appload_pairing_test.go`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/appload_test.go`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/build.sh`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/state.go`
- `mise/conf.d/devtools-omp/extensions/image-annotator/test/device-pairing.test.ts`

## Validation results

- **mise exec -- bun test** (mise/conf.d/devtools-omp/extensions/image-annotator): passed: 34 tests, 284 assertions, zero failures.
- **mise exec -- go test -race ./...** (mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client): passed; production AppLoad backend exercised against real Bun service, HTTPS and WebSockets.
- **mise exec -- bun run typecheck** (mise/conf.d/devtools-omp/extensions/image-annotator): passed.
- **mise exec -- bun run build** (mise/conf.d/devtools-omp/extensions/image-annotator): passed; ARM64 client ZIP and browser bundle built; existing dependency directive/chunk warnings remain.
- **mise exec -- go test -race -run TestProductionAppLoadPairing -v** (mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client): passed; protected PNG SHA-256 8fc5a10f2a577810e1552a07c378954d6be3a11b20d33b669d70c2e96963aeaa.
- **host compiled pi-ink-client appload + Qt 6.8.3 Connections.qml + browser management forms** (/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-ink-bridge-03-pair-device): passed: manual fingerprint/address verification; matching code 219590; approval; real PNG display; active WebSocket revocation observed; native AppLoad transport host-emulated only.

All eight criteria have host security/transport coverage in [verification.json](../evidence/host-pairing-0002/verification.json). Native firmware, input controls, upgrade/restart behavior, and real-LAN acceptance remain unverified. Initial fixture/PNG/viewport failures and their corrections are retained in that record.

## Review history

No review attempt exists for this ticket. The parent owns independent review and phase orchestration.

## Resolved findings

No independent reviewer findings exist. Host smoke found and corrected QML horizontal clipping and an invalid initial diagnostic PNG.

## Remaining findings

No persisted reviewer findings exist. The acceptance boundary remains open:

- No Paper Pro access, SSH, installation, restart, hardware mutation, or old experiment cleanup was performed.
- Owner must approve a scoped repair/upgrade plan from the installed release to 0.5.0. The existing installer intentionally rejects a different release at occupied launcher links.
- After approved installation and any separately approved restart, observe the actual Paper Pro screen, matching-code approval, restart persistence, protected image download, and active/subsequent rejection after revocation on the real LAN.
- No independent review, merge, push, ticket completion, mDNS, image dispatch, inbox, or drawing acceptance is claimed.

## Latest reviewer verdict

None. No SUCCESS verdict is claimed.

## Merge status

Not merged or pushed. This worktree and all historical records are retained.

## Supporting records

- [Authoritative parent start-0001](../../events/start-0001.json)
- [Implementation phase result implementation-0002](../../events/implementation-0002.yaml)
- [Immutable implementation snapshot](pr-draft-implementation-0002.md)
- [Host verification and acceptance limits](../evidence/host-pairing-0002/verification.json)
- [Actual QML transport observations](../evidence/host-pairing-0002/qml-smoke-fixed.json)
- [Corrected QML protected image screenshot](../evidence/host-pairing-0002/qml-approved-image-fixed.png)
- [QML revocation observations](../evidence/host-pairing-0002/qml-revocation.json)
- [QML revoked screenshot](../evidence/host-pairing-0002/qml-revoked.png)
- [Desktop approval screenshot](../evidence/host-pairing-0002/desktop-approved.webp)
- [Desktop revocation screenshot](../evidence/host-pairing-0002/desktop-revoked.webp)

