# Annotate a non-sensitive image

For Dotfiles users. Updated 2026-11-27.

## Result

Draw or annotate images manually and return the completed PNG to OMP.

## Prerequisites

Interactive OMP, the extension’s installed dependencies and built frontend, and a browser. Tablet use requires separate trusted-device setup.

## Steps

1. Start OMP with this extension loaded.
2. Enter `/image annotate /absolute/path/to/sample.png`.
3. Draw a mark in the browser and choose Done, or choose Cancel to discard the edit.

## Verification

Done attaches the edited PNG to the session. Cancel produces no edited image.

## Recovery

If assets are missing, follow the extension package’s build workflow before retrying. Use /annotate add-device only when setting up a trusted tablet.

[Capability overview](README.md)
