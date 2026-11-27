# QR Code Generator

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Turn the active Firefox tab URL into a QR code.

For Dotfiles users. Updated 2026-11-27.

The Manifest V2 extension uses `activeTab` and a toolbar popup. It generates a QR code from the active URL. The module copies the extension and loader into `~/.config/firefox-extensions/`; it does not install Firefox.

## Complete a task

[Load the QR code extension](HOWTO.md)

## Source files

- **Source:** [extensions/qr-code/manifest.json](manifest.json)
- **Source:** [extensions/qr-code/popup/popup.js](popup/popup.js)
- **Source:** [load-extensions.sh](../../load-extensions.sh)

[Module overview](../../README.md)
