# Neovim

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Manage Neovim and platform-specific editor profiles.

For Dotfiles users. Updated 2026-11-27.

The module requests `neovim` through mise. EDITOR and VISUAL are nvim. Unix clones lazyvim.profile into ~/.config/nvim; Windows clones astronvim.profile under AppData/Local/nvim. The SSH Git URLs require repository access. The profile repositories remain external owners.

The declaration controls installation; it does not configure accounts or prove that the executable is installed.

## Complete a task

[Inspect Neovim installation](HOWTO.md)

## Source files

- **Source:** [mise.toml](../../mise.toml)
- **Source:** [mise.unix.toml](../../mise.unix.toml)
- **Source:** [mise.windows.toml](../../mise.windows.toml)

[Module overview](../../README.md)
