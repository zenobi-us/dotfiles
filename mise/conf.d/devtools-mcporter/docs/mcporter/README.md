# MCPorter

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Manage MCPorter and its platform-specific configuration location.

For Dotfiles users. Updated 2026-11-27.

The module requests `npm:mcporter` through mise. Unix links the module to both ~/.config/mcporter and ~/.mcporter; Windows links it under AppData/Local/mcporter. Configuration and daemon state can contain secrets: inspect only through approved local workflows. No server or credential values are documented.

The declaration controls installation; it does not configure accounts or prove that the executable is installed.

## Complete a task

[Inspect MCPorter installation](HOWTO.md)

## Source files

- **Source:** [mise.toml](../../mise.toml)

[Module overview](../../README.md)
