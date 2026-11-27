# Inspect the desktop launcher

For Dotfiles users. Updated 2026-11-27.

## Result

Open text files in a terminal-backed Neovim desktop entry.

## Prerequisites

A Linux desktop session, Neovim on PATH, and a terminal handler.

## Steps

1. Review `nvim.desktop`, especially its MIME types and executable.
2. Compare it with `~/.local/share/applications/nvim.desktop` after your normal dotfiles bootstrap.
3. Use your desktop file manager to choose Neovim when opening a disposable text file.

## Verification

A terminal opens the selected file in Neovim. Desktop menu discovery depends on the desktop environment.

## Recovery

Restore a backed-up desktop entry if launch fails; check that the desktop session can resolve nvim.

[Capability overview](README.md)
