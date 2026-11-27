# dotfiles bootstrap command

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Forward bootstrap options to the detected Dotfiles repository.

For Dotfiles users. Updated 2026-11-27.

dotfiles uses DOTFILE_REPO_ROOT when it names a directory, otherwise Git root discovery. It runs mise -C <root> bootstrap --yes and forwards arguments. Completion offers bootstrap part names. It does not implement the historical fzf selector described in the preserved README.

## Complete a task

[Preview bootstrap through the wrapper](HOWTO.md)

## Source files

- **Source:** [modules/dotfiles__aliases.zsh](../../modules/dotfiles__aliases.zsh)

[Module overview](../../README.md)
