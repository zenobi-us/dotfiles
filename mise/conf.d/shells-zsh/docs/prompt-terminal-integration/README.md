# Prompt and terminal environment

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Initialise Starship and set terminal capability environment in Zsh.

For Dotfiles users. Updated 2026-11-27.

The interactive loader evaluates starship init zsh and loads the Alacritty module unconditionally. That module exports TERM=alacritty and COLORTERM=truecolor, even in another terminal. Starship configuration is owned by shells-starship.

## Complete a task

[Inspect prompt and terminal assumptions](HOWTO.md)

## Source files

- **Source:** [modules/starship__config.zsh](../../modules/starship__config.zsh)
- **Source:** [modules/alacritty__config.zsh](../../modules/alacritty__config.zsh)
- **Source:** [modules/alacritty__profile.zsh](../../modules/alacritty__profile.zsh)
- **Source:** [zinit.zsh](../../zinit.zsh)

[Module overview](../../README.md)
