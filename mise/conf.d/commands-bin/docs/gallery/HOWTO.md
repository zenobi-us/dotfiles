# Preview a public sample directory

For Dotfiles users. Updated 2026-11-27.

## Result

Serve the current directory as an image gallery and file browser.

## Prerequisites

Unix shell and the dependencies named in the overview. Commands are linked into ~/.local/bin by this module.

## Steps

1. Create or choose a directory containing only files safe to expose.
2. Change into that directory and run `gallery 3000`.
3. Open the address printed by the command and use the image preview controls.

## Verification

Image cards open a lightbox, and non-image entries link to files. Check the listening interface before assuming access is local-only.

## Recovery

Stop the process with Ctrl+C. Use a different port if 3000 is occupied; do not serve private directories.

[Capability overview](README.md)
