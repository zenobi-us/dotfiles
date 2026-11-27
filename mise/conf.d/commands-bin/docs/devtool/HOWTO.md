# Inspect a local browser bridge

For Dotfiles users. Updated 2026-11-27.

## Result

Pass the first local Chrome debug target to bdg.

## Prerequisites

Unix shell and the dependencies named in the overview. Commands are linked into ~/.local/bin by this module.

## Steps

1. Keep Chrome remote debugging bound to loopback on port 9222.
2. Check `command -v bdg`, `command -v curl`, and `command -v jq`.
3. Inspect the target list locally before using `devtool --help`; the wrapper always queries the endpoint first.

## Verification

The selected target is the intended browser tab; bdg help is available for the installed version.

## Recovery

Close remote debugging when finished. If no target exists, start a debugging browser instead of exposing the port publicly.

[Capability overview](README.md)
