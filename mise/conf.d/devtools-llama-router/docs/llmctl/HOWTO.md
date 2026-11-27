# Inspect llmctl installation

For Dotfiles users. Updated 2026-11-27.

## Result

Manage the pinned llmctl release.

## Prerequisites

Mise and an activated shell. Run commands from the Dotfiles repository root.

## Steps

1. Open `mise/conf.d/devtools-llama-router/mise.toml` and review the `github:sockheadrps/llmctl` tool declaration.
2. Run `mise ls` and locate the requested tool. Install missing tools through your normal Dotfiles bootstrap.
3. Run `llmctl --help` to inspect commands supported by your installed version.

## Verification

The tool appears in `mise ls`, and its help names the operations you need.

## Recovery

If the command is unavailable, check shell activation and platform support before changing the requested version.

[Capability overview](README.md)
