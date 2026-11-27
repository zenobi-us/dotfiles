# Inspect WSL environment selection

For Dotfiles users. Updated 2026-11-27.

## Result

Select the WSL2 mise environment and add limited Windows interop paths.

## Prerequisites

Zsh running inside a configured WSL distribution.

## Steps

1. Review wsl__env.zsh and the entrypoint loader.
2. In a new WSL shell, inspect `print -r -- "$MISE_ENV"`.
3. Check `command -v cmd.exe` and `command -v powershell.exe` if interop is needed.

## Verification

The environment is wsl2 and only the configured existing interop directories are appended.

## Recovery

Use a fresh shell after correcting WSL environment detection. Do not add the entire Windows PATH merely to fix one missing binary.

[Capability overview](README.md)
