# Inspect interactive completion

For Dotfiles users. Updated 2026-11-27.

## Result

Choose completion candidates through the fzf-tab plugin.

## Prerequisites

Zsh, Zinit, fzf, and the managed completion module.

## Steps

1. Open a new interactive Zsh session.
2. At a disposable directory prompt, type a path prefix and press Tab.
3. Select a candidate or cancel without executing a command.

## Verification

Candidates use the configured completion behavior and the chosen text is inserted into the command line.

## Recovery

Check compinit and plugin loading if completion fails. Retain the existing shell before changing completion caches.

[Capability overview](README.md)
