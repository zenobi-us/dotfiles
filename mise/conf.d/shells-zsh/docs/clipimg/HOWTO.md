# Save a sample clipboard image

For Dotfiles users. Updated 2026-11-27.

## Result

Save a Wayland clipboard image as a temporary PNG for terminal tools.

## Prerequisites

Wayland or WSLg, wl-paste, optional wl-copy, and ImageMagick for non-PNG images.

## Steps

1. Copy a non-sensitive image to the clipboard.
2. Run `clipimg` in the managed interactive shell.
3. Open the printed temporary PNG path locally before pasting the path into another tool.

## Verification

The PNG contains the copied image; when wl-copy exists, the clipboard contains the file path as text.

## Recovery

Copy the image again if the clipboard now holds text. Remove only the temporary image you created when no longer needed.

[Capability overview](README.md)
