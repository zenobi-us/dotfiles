# Inspect profile loading

For Dotfiles users. Updated 2026-11-27.

## Result

Load shared initialisers and command aliases from the managed PowerShell profile.

## Prerequisites

PowerShell on Windows, a backed-up existing profile, and the required environment configuration.

## Steps

1. Review Microsoft.PowerShell_profile.ps1 and relevant files under parts before copying.
2. Check that MISE_GLOBAL_CONFIG_ROOT points to the intended bootstrap context without publishing private values.
3. Start a new PowerShell session after the normal dotfiles bootstrap.

## Verification

Expected initialisers load without errors and aliases resolve to installed tools.

## Recovery

Use `pwsh -NoProfile` for a recovery shell. Restore the previous profile or disable only the failing part after inspecting its dependency.

[Capability overview](README.md)
