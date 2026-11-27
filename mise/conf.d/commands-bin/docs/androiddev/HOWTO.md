# Inspect Android helper compatibility

For Dotfiles users. Updated 2026-11-27.

## Result

Provide legacy Android SDK installation and AVD creation routines.

## Prerequisites

Unix shell and the dependencies named in the overview. Commands are linked into ~/.local/bin by this module.

## Steps

1. Review the install and create branches in androiddev.sh.
2. Compare the hard-coded command-line tools, SDK, NDK, and system-image versions with your installed Android tools.
3. Choose an isolated SDK directory and a backed-up profile before authorising an installation.

## Verification

The selected tool versions and image package names exist; the legacy android executable requirement is resolved before running install.

## Recovery

Do not use reset on an existing SDK without inspecting its removal routine. Restore your profile from backup.

[Capability overview](README.md)
