# Inspect prompt and terminal assumptions

For Dotfiles users. Updated 2026-11-27.

## Result

Initialise Starship and set terminal capability environment in Zsh.

## Prerequisites

Starship installed, the managed Zsh session, and a terminal with matching capabilities.

## Steps

1. Review the two terminal modules and Starship initialiser.
2. Inspect TERM locally and compare it with the actual terminal and available terminfo.
3. Open a new shell and check prompt rendering with the current Starship configuration.

## Verification

The prompt is readable and full-screen applications use correct terminal capabilities.

## Recovery

Use a recovery shell if TERM=alacritty is inappropriate. Restore your prior terminal environment rather than suppressing application errors.

[Capability overview](README.md)
