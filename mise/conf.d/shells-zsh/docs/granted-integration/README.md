# Granted AWS profile integration

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Source assume and add Granted completion directories to Zsh.

For Dotfiles users. Updated 2026-11-27.

The active alias is assume=". assume", allowing profile changes to affect the current shell. The environment adds ~/.granted completion paths. Granted and AWS accounts are managed separately; this module does not provide credentials.

## Complete a task

[Inspect the assume alias](HOWTO.md)

## Source files

- **Source:** [modules/granted__aliases.zsh](../../modules/granted__aliases.zsh)
- **Source:** [modules/granted__env.zsh](../../modules/granted__env.zsh)
- **Source:** [zinit.zsh](../../zinit.zsh)

[Module overview](../../README.md)
