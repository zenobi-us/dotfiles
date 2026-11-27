# Zsh phase loader

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Load explicitly registered shell modules through Zinit.

For Dotfiles users. Updated 2026-11-27.

The environment, profile, and interactive entrypoints call explicit loader functions. Files are not activated merely by existing under modules/. Zinit is cloned into the XDG data location when missing. The source also reads the fixed ~/.local/share location and ~/.cargo/env, which may need machine preparation.

## Complete a task

[Inspect shell module activation](HOWTO.md)

## Source files

- **Source:** [.zshenv](../../.zshenv)
- **Source:** [.zprofile](../../.zprofile)
- **Source:** [.zshrc](../../.zshrc)
- **Source:** [zinit.zsh](../../zinit.zsh)

[Module overview](../../README.md)
