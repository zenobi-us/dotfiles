# Review Samba exposure before launch

For Dotfiles users. Updated 2026-11-27.

## Result

Provide a Docker-based directory-sharing launcher for inspection.

## Prerequisites

Unix shell and the dependencies named in the overview. Commands are linked into ~/.local/bin by this module.

## Steps

1. Inspect samba-here without running it.
2. Check the dperson/samba command syntax for the installed image version.
3. Resolve the current argument-order problem and define authentication before sharing any directory.

## Verification

The intended runtime options and container arguments are distinguishable; no private directory has been exposed.

## Recovery

Do not retry by adding privileges. Stop any unintended container and review host firewall and authentication settings.

[Capability overview](README.md)
