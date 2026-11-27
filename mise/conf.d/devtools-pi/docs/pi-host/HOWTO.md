# Install configured Pi dependencies

For Dotfiles users. Updated 2026-11-27.

## Result

Configure Pi settings, keybindings, packages, and shared bundle links.

## Prerequisites

Pi installed separately, Bun, network access, and shared bundle sources.

## Steps

1. Review the linked destinations in mise.unix.toml.
2. After dotfiles links exist, run `mise run pi.bootstrap` from the repository root.
3. Restart Pi and inspect the loaded packages.

## Verification

All seven configured bundle packages load, and the host uses the intended settings.

## Recovery

Inspect the failing package install before retrying. Restore previous settings if a host version rejects a key.

[Capability overview](README.md)
