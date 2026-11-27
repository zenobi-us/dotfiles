# Install the curated fonts

For Dotfiles users. Updated 2026-11-27.

## Result

Install the curated Nerd Fonts archive list.

## Prerequisites

Mise, the configured font-install tool, network access, and permission to install user fonts.

## Steps

1. Review `fonts.txt` in this module before downloading the archives.
2. From the repository root, run `mise run assets.bootstrap`.
3. Choose an installed Nerd Font family in your terminal configuration.

## Verification

Open a new terminal and confirm the chosen family and icon glyphs render. On fontconfig systems, inspect `fc-list`.

## Recovery

If an archive download fails, check the pinned URL before retrying. Restore the previous terminal font if glyphs are missing.

[Capability overview](README.md)
