# Terminal font picker

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Choose an installed font and update a supported terminal configuration.

For Dotfiles users. Updated 2026-11-27.

shellfont uses fzf and fontconfig, with optional pango-view/chafa/Kitty previews. It has Ghostty and Alacritty handlers that edit repository files under .mise/conf.d. Those literal paths do not match this checkout’s mise/conf.d layout unless a compatibility path exists. The Alacritty handler expects alacritty.toml, which this module does not supply.

## Complete a task

[Inspect font-picker compatibility](HOWTO.md)

## Source files

- **Source:** [modules/shellfont__aliases.zsh](../../modules/shellfont__aliases.zsh)

[Module overview](../../README.md)
