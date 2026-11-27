# Inspect font-picker compatibility

For Dotfiles users. Updated 2026-11-27.

## Result

Choose an installed font and update a supported terminal configuration.

## Prerequisites

Managed Zsh, fzf, fontconfig, and a backup of terminal configuration.

## Steps

1. Review helper_config_path and both terminal handlers in the source.
2. Check the resolved repository paths before accepting a font selection.
3. Use the picker only after confirming the chosen terminal file exists; Escape cancels selection.

## Verification

The intended terminal file, not another checkout, is selected for editing. No supported target should be inferred from a handler name alone.

## Recovery

Cancel if the path is missing. Restore your backed-up file after an unwanted change and reload the terminal.

[Capability overview](README.md)
