# Claude Code

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Manage Claude CLI tooling and shared bundle installation.

For Dotfiles users. Updated 2026-11-27.

The module requests `claude-code` through mise. The module also declares `claude = "latest"`. `claude.bootstrap` registers the local marketplace and installs all seven bundles. Unix settings use merge semantics.

The declaration controls installation; it does not configure accounts or prove that the executable is installed.

## Complete a task

[Inspect Claude Code installation](HOWTO.md)

## Source files

- **Source:** [mise.toml](../../mise.toml)

[Module overview](../../README.md)
