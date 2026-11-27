# Inspect GitHub CLI installation

For Dotfiles users. Updated 2026-11-27.

## Result

Manage gh for GitHub workflows.

## Prerequisites

Mise and an activated shell. Run commands from the Dotfiles repository root.

## Steps

1. Open `mise/conf.d/devtools-git/mise.toml` and review the `github-cli` tool declaration.
2. Run `mise ls` and locate the requested tool. Install missing tools through your normal Dotfiles bootstrap.
3. Run `gh --help` to inspect commands supported by your installed version.

## Verification

The tool appears in `mise ls`, and its help names the operations you need.

## Recovery

If the command is unavailable, check shell activation and platform support before changing the requested version.

[Capability overview](README.md)
