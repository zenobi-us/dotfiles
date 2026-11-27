# Inspect the WSL clipboard service

For Dotfiles users. Updated 2026-11-27.

## Result

Convert WSLg mirrored BMP images into PNG for Claude paste.

## Prerequisites

WSL2, WSLg, the dependencies checked in clip-bridge, and a user systemd session.

## Steps

1. Review the script’s dependency checks and the unit in mise.wsl2.toml.
2. After normal WSL bootstrap, inspect the user clip-bridge service and its log under ~/.local/state.
3. Copy a non-sensitive Windows screenshot and paste it into Claude.

## Verification

Claude accepts the image as PNG; inspect service logs for conversion failures.

## Recovery

Stop the user service if clipboard feedback occurs. Restore previous unit settings before restarting.

[Capability overview](README.md)
