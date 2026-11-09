---
title: Pi Ink host firmware correction result
type: Report
---

# Install and launch the tablet client

## Ticket summary

`tracker/tickets/pi-ink-bridge-02-install-client.md` stays claimed. The host-only firmware correction passed. Native acceptance remains blocked.

## Problem statement

The installer compared VERSION_ID with the supported firmware label. Captured tablet metadata stores that label in quoted IMG_VERSION instead.

## Implementation summary

Corrected the exact supported firmware comparison to IMG_VERSION=3.28.0.172 with no VERSION_ID fallback. The actual installer entry point passes focused host regression and smoke checks. README explains the field, sandbox test requirements and invalidation of old trusted instructions. Whole-ticket native acceptance remains blocked.

Exact result target: `42a23605724aff8da6238f4b28af15780e15527b`; tree `a85126303434b449f2f986d5a2ddf95c5bc357d0`.

## Changed files

- `README.md`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/production-install.sh`
- `mise/conf.d/devtools-omp/extensions/image-annotator/test/production-install.test.ts`

## Validation results

- Focused command: `MISE_AUTO_INSTALL=0 mise exec -- bun test test/production-install.test.ts && sh scripts/provision-tablet.sh --dry-run` in `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-ink-bridge-02-install-client/mise/conf.d/devtools-omp/extensions/image-annotator`.
- Before correction: 0 pass, 3 fail at the real firmware boundary.
- After correction: 3 pass, 0 fail, 10 assertions. The accepted firmware reaches the deliberately failing stock guard. Unsupported and missing IMG_VERSION stop before it.
- The harness runs the actual installer in temporary host fixtures under Bubblewrap. The host root is read-only and the network is isolated. All fixtures were removed.
- Dry-run regenerated installer SHA-256: `765593a9a36fdbf097d67bb3a41d613038150268636616447b9244b87c17578f`.
- Unchanged client ZIP SHA-256: `03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629`. No payload rebuild was needed.
- Old trusted installer instructions are invalid. Generate new instructions before any separately approved installation.
- No device access, SSH, install, restart or desktop listener access occurred. Native compatibility and installation acceptance are untested. Earlier broad host checks were not rerun.

## Review history

No independent review has run. This phase is an implementation takeover, not a review.

## Resolved findings

The host firmware-field defect is corrected. No independent review findings exist.

## Remaining findings

- Renewed separately approved read-only cable preflight must establish current stock Xochitl hash, native dependency versions/hashes and compatibility, and exact named installation target metadata.
- Installation requires separate final hash-pinned payload approval. Activation, post-restart launch and repeat-install acceptance remain untested and require separate approval.
- The protocol-1 desktop listener on port 47840 remains untouched; any operator decision is separate.

## Latest reviewer verdict

None.

## Merge status

Not merged or pushed. Pane w6P:p3 remains open for parent validation and closure.

## Receipt history

- [start-0001](../../events/start-0001.json): start / phase-start / started; source `155e01d9a88d0b2a4bff539d1685f637a4ccc3ad`, tree `74872d499498a25af7a95b67d849d2acec021216`.
- [implementation-0002](../../events/implementation-0002.json): implementation / phase-result / blocked; source `82edbf73a1cc78d61079be62fa97d98eff445ecd`, tree `9824944411da9971edcb5d12a98b24f67064bd67`.
- [start-complete-0003](../../events/start-complete-0003.json): start / phase-complete / blocked; source `6d45cd8c4d63c394a1f0cbacec62a1a67e0d235d`, tree `af615daebe9c5d603e5400098ad20dd83b7e5e67`.
- [start-0004](../../events/start-0004.json): start / phase-start / started; source `5a662108044deba17ed09e453be8e2b0e1c98ffb`, tree `34c20c0956c512abdeac946e7e44129f3533fe3d`.
- [implementation-0005](../../events/implementation-0005.json): implementation / phase-result / blocked; source `5a662108044deba17ed09e453be8e2b0e1c98ffb`, tree `34c20c0956c512abdeac946e7e44129f3533fe3d`.
- [start-complete-0006](../../events/start-complete-0006.json): start / phase-complete / blocked; source `bad0a4b9878c4f3466920daa472e26a9c7cfe1a7`, tree `8827f5180c73f1465154de736c27d35e802f9ed8`.
- [start-0007](../../events/start-0007.json): start / phase-start / started; source `d6e7fb74c5de6f5bc5383b9651b730ab60159952`, tree `0e65b383eeec0a3483a18d6167c965038d0a9ff6`.
- [implementation-0008](../../events/implementation-0008.json): implementation / phase-result / blocked; source `42a23605724aff8da6238f4b28af15780e15527b`, tree `a85126303434b449f2f986d5a2ddf95c5bc357d0`.

## Supporting records

- [Focused host regression and digests](../evidence/firmware-field-0007/verification.json)
- [Retained cable metadata; not rerun](../evidence/device-preflight-0004/cable-preflight.json)
- [Retained compatibility limits](../evidence/device-preflight-0004/compatibility-analysis.json)
- [Earlier broad host validation; not rerun](../evidence/host-20261108-install-001/verification.json)
- [First immutable implementation snapshot](./pr-draft-implementation-0002.md)
- [Immutable preflight snapshot](./pr-draft-implementation-0005.md)
- [Current immutable snapshot](./pr-draft-implementation-0008.md)

## Next required approval

Obtain separate approval for renewed read-only cable preflight of current stock hash, native dependencies and exact named installation target metadata. This is not installation approval.

