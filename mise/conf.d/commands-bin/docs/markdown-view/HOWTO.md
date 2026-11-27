# Preview a trusted Markdown document

For Dotfiles users. Updated 2026-11-27.

## Result

Serve one Markdown document on a loopback HTTP listener.

## Prerequisites

Unix shell and the dependencies named in the overview. Commands are linked into ~/.local/bin by this module.

## Steps

1. Confirm mise and Bun are available; initial dependency loading needs network access.
2. Run `markdown-view /path/to/trusted.md`.
3. Open the printed loopback URL. Save edits to the source document and refresh the page.

## Verification

The page renders the document and allowed relative images. Files outside the document directory are not served by image requests.

## Recovery

Stop with Ctrl+C. Remove untrusted plugin declarations before reopening a document; choose a different --port if needed.

[Capability overview](README.md)
