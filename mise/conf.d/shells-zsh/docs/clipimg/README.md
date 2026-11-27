# Clipboard image path helper

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Save a Wayland clipboard image as a temporary PNG for terminal tools.

For Dotfiles users. Updated 2026-11-27.

The interactive clipimg function supports PNG, JPEG, WebP, GIF, and BMP. It uses wl-paste, needs ImageMagick for conversion, and optionally copies the PNG path as text with wl-copy. This interactive definition supersedes the narrower WSL environment-phase helper.

## Complete a task

[Save a sample clipboard image](HOWTO.md)

## Source files

- **Source:** [modules/clipboard__aliases.zsh](../../modules/clipboard__aliases.zsh)
- **Source:** [modules/wsl__aliases.zsh](../../modules/wsl__aliases.zsh)
- **Source:** [zinit.zsh](../../zinit.zsh)

[Module overview](../../README.md)
