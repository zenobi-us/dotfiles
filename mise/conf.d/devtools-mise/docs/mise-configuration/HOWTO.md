# Inspect mise configuration origins

For Dotfiles users. Updated 2026-11-27.

## Result

Link root and platform mise configuration into user configuration locations.

## Prerequisites

An installed mise binary and the Dotfiles checkout.

## Steps

1. Review all four module mappings for the current platform.
2. Check the resolved ~/.config/mise links without printing environment values.
3. Run `mise config ls` from the repository root and inspect configuration origins.

## Verification

The expected root and platform files appear as configuration sources.

## Recovery

Restore a previous user configuration link if mise reads another checkout; do not fix an origin mismatch by duplicating settings.

[Capability overview](README.md)
