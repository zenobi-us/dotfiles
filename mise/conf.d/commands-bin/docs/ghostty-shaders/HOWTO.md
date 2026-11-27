# List and clear shader selections

For Dotfiles users. Updated 2026-11-27.

## Result

Manage shader sources and apply Ghostty shader selections.

## Prerequisites

Unix shell and the dependencies named in the overview. Commands are linked into ~/.local/bin by this module.

## Steps

1. Back up your Ghostty config and confirm gum and ghostty are on PATH.
2. Run `ghostty-shaders list` to inspect available shaders.
3. Use `ghostty-shaders clear` to remove the current shader, or review `ghostty-shaders` interactively before applying one.

## Verification

Ghostty displays the expected effect after configuration reload.

## Recovery

Use clear or restore the backed-up config if a shader causes rendering problems. Reload manually when DBus or accessibility automation is unavailable.

[Capability overview](README.md)
