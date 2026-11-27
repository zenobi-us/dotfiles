# Merge X resources into an X11 session

For Dotfiles users. Updated 2026-11-27.

## Result

Load terminal X resources and a selected bundled color theme.

## Prerequisites

Unix with an X server, DISPLAY, xrdb, and the linked theme directory.

## Steps

1. Review .Xresources and confirm its included theme file exists.
2. Run `mise run xresources.bootstrap` from the repository root.
3. Open a new XTerm or URxvt instance to inspect the resulting settings.

## Verification

Use `xrdb -query` locally to inspect loaded resource names; the terminal reflects supported settings.

## Recovery

Restore the previous resource file and re-merge it. A successful skipped task outside X11 does not prove resources were loaded.

[Capability overview](README.md)
