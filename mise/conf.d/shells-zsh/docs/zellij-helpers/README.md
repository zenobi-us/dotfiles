# Zellij helper commands

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Select a Zellij session or reload the configured agent-thread plugin.

For Dotfiles users. Updated 2026-11-27.

zellij-attach selects a session through fzf and attaches it; cancellation returns 130. zellij-agent-threads-reload reloads a local WASM plugin, optionally overridden by ZELLIJ_AGENT_THREADS_PLUGIN. The module does not install that plugin.

## Complete a task

[Select an existing session](HOWTO.md)

## Source files

- **Source:** [modules/zellij__aliases.zsh](../../modules/zellij__aliases.zsh)

[Module overview](../../README.md)
