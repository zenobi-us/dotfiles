# Pi host configuration

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Configure Pi settings, keybindings, packages, and shared bundle links.

For Dotfiles users. Updated 2026-11-27.

The module links Pi’s agent settings and seven shared bundle packages. pi.bootstrap installs dependencies in ~/.pi/agent and each bundle with Bun. Shell commands initialise mise through the configured shellCommandPrefix. Pi itself is not installed by this module.

## Complete a task

[Install configured Pi dependencies](HOWTO.md)

## Source files

- **Source:** [mise.unix.toml](../../mise.unix.toml)
- **Source:** [agent/package.json](../../agent/package.json)
- **Source:** [agent/settings.json](../../agent/settings.json)
- **Source:** [agent/keybindings.json](../../agent/keybindings.json)

[Module overview](../../README.md)
