# Mise shell integration

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Activate mise for environment, login, and interactive Zsh phases.

For Dotfiles users. Updated 2026-11-27.

The environment module sets MISE_ACTIVATED and initialises shims. Profile and interactive modules initialise mise again, selecting shims for VS Code environment resolution and non-interactive contexts. All phases expect ~/.local/bin/mise.

## Complete a task

[Inspect mise activation](HOWTO.md)

## Source files

- **Source:** [modules/mise__env.zsh](../../modules/mise__env.zsh)
- **Source:** [modules/mise__profile.zsh](../../modules/mise__profile.zsh)
- **Source:** [modules/mise__config.zsh](../../modules/mise__config.zsh)
- **Source:** [zinit.zsh](../../zinit.zsh)

[Module overview](../../README.md)
