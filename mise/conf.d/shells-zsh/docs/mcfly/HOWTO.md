# Inspect history integration

For Dotfiles users. Updated 2026-11-27.

## Result

Initialise McFly history search in interactive Zsh.

## Prerequisites

McFly installed through mise and the managed Zsh session.

## Steps

1. Run `command -v mcfly` and inspect `mcfly --help`.
2. Open a disposable interactive shell and invoke the history-search binding documented by the installed McFly version.
3. Search for a harmless command and cancel rather than executing a sensitive history entry.

## Verification

McFly search appears and respects the current shell context. Do not capture private history.

## Recovery

Disable the McFly loader in a recovery shell if its installed version fails. Preserve the history file before any migration.

[Capability overview](README.md)
