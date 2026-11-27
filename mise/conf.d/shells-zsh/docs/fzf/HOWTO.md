# Inspect the fzf command

For Dotfiles users. Updated 2026-11-27.

## Result

Acquire the fzf command through Zinit GitHub releases.

## Prerequisites

An activated Zsh session with the configured Zinit loader.

## Steps

1. Run `command -v fzf` in the new shell.
2. Run `fzf --help` to inspect the installed version.
3. Try `printf "first\nsecond\n" | fzf` and select a sample line.

## Verification

The selected sample is printed; Escape cancels without a selection.

## Recovery

If fzf is missing, inspect Zinit’s release download before modifying helpers or installing a second competing version.

[Capability overview](README.md)
