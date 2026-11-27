# Review global Git installation

For Dotfiles users. Updated 2026-11-27.

## Result

Copy shared Git configuration and ignore rules into the home directory.

## Prerequisites

Git and backups of existing global Git files.

## Steps

1. Review this module’s dotfiles mappings and Git configuration locally.
2. Check machine-specific identity and signing requirements before replacing configuration.
3. Compare the copied files with their intended sources after normal bootstrap.

## Verification

Run `git config --show-origin --get core.excludesfile` locally and confirm its origin. Keep identity values out of reports.

## Recovery

Restore backed-up configuration if identity, signing, or includes change unexpectedly.

[Capability overview](README.md)
