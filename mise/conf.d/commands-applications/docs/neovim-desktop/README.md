# Neovim desktop launcher

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Open text files in a terminal-backed Neovim desktop entry.

For Dotfiles users. Updated 2026-11-27.

The Linux module copies desktop integration files into `~/.local/share/applications`. `nvim.desktop` uses `TryExec=nvim`, `Exec=nvim %f`, and `Terminal=true`. An empty mimeapps.list does not select a default editor.

## Complete a task

[Inspect the desktop launcher](HOWTO.md)

## Source files

- **Source:** [nvim.desktop](../../nvim.desktop)
- **Source:** [mise.linux.toml](../../mise.linux.toml)
- **Source:** [defaults.list](../../defaults.list)
- **Source:** [mimeapps.list](../../mimeapps.list)

[Module overview](../../README.md)
