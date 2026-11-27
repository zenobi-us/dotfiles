# Herdr

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Manage Herdr configuration and local plugin registration.

For Dotfiles users. Updated 2026-11-27.

The module requests `herdr` through mise. The module links config.toml and local plugins on Unix and Windows. The configured prefix is Ctrl+/. Prefix+g opens a Lazygit popup; Lazygit must be installed separately. herdr.bootstrap installs local plugin dependencies with Bun and links plugins on Unix.

The declaration controls installation; it does not configure accounts or prove that the executable is installed.

## Complete a task

[Inspect Herdr installation](HOWTO.md)

## Source files

- **Source:** [mise.toml](../../mise.toml)
- **Source:** [config.toml](../../config.toml)
- **Source:** [mise.unix.toml](../../mise.unix.toml)
- **Source:** [mise.windows.toml](../../mise.windows.toml)

[Module overview](../../README.md)
