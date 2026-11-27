# Inspect Bun scope mapping

For Dotfiles users. Updated 2026-11-27.

## Result

Resolve @jsr packages through the npm-compatible JSR registry.

## Prerequisites

Bun and a backup of existing ~/.bunfig.toml.

## Steps

1. Review this module’s bunfig.toml.
2. Check that ~/.bunfig.toml points to the intended source after bootstrap.
3. Confirm the @jsr scope maps to https://npm.jsr.io.

## Verification

The effective user configuration contains the intended @jsr mapping.

## Recovery

Restore the previous bunfig if unrelated scopes were replaced.

[Capability overview](README.md)
