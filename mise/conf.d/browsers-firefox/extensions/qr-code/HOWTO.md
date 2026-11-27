# Load the QR code extension

For Dotfiles users. Updated 2026-11-27.

## Result

Turn the active Firefox tab URL into a QR code.

## Prerequisites

Firefox on Unix and the copied extension directory.

## Steps

1. Open Firefox and navigate to `about:debugging`.
2. Choose **This Firefox**, then **Load Temporary Add-on**. Select `~/.config/firefox-extensions/qr-code/manifest.json`.
3. Open a normal web page and click the QR Code Generator toolbar button.

## Verification

The popup shows the current URL and its QR code. Temporary loading ends when Firefox restarts.

## Recovery

Remove the temporary add-on from about:debugging if it fails. The optional loader needs `web-ext` and assumes a `default-release` profile.

[Capability overview](README.md)
