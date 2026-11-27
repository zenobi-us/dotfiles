# Font installer

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Install the curated Nerd Fonts archive list.

For Dotfiles users. Updated 2026-11-27.

The module requests `github:Crosse/font-install` through mise. `assets.bootstrap` runs `font-install -fromFile fonts.txt`. The list includes JetBrainsMono, FiraCode, Meslo, SourceCodePro, Ubuntu, GeistMono, and ZedMono at Nerd Fonts 3.5.1.

The declaration controls installation; it does not configure accounts or prove that the executable is installed.

## Complete a task

[Install the curated fonts](HOWTO.md)

## Source files

- **Source:** [mise.toml](../../mise.toml)
- **Source:** [fonts.txt](../../fonts.txt)

[Module overview](../../README.md)
