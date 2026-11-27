# Mise configuration integration

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Link root and platform mise configuration into user configuration locations.

For Dotfiles users. Updated 2026-11-27.

The module maps repository root mise files into ~/.config/mise. Windows selects PowerShell for inline tasks because cmd.exe cannot handle the long tool PATH. It does not declare a mise tool install. The ~/.dotfiles mapping uses this module’s source directory; inspect its resolved target before treating it as repository root.

## Complete a task

[Inspect mise configuration origins](HOWTO.md)

## Source files

- **Source:** [mise.toml](../../mise.toml)
- **Source:** [mise.unix.toml](../../mise.unix.toml)
- **Source:** [mise.linux.toml](../../mise.linux.toml)
- **Source:** [mise.windows.toml](../../mise.windows.toml)

[Module overview](../../README.md)
