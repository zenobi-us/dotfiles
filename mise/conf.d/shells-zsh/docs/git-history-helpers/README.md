# Git history rewrite helpers

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Provide explicit commit re-signing and author-rewrite functions.

For Dotfiles users. Updated 2026-11-27.

resign-commits and git_forge_all_commits invoke git filter-branch on HEAD. Both rewrite history and may require helper functions not defined here. The author rewrite currently derives both name and email from the first argument. Do not run these functions on shared history without reviewing their exact source.

## Complete a task

[Review rewrite helpers safely](HOWTO.md)

## Source files

- **Source:** [modules/git__aliases.zsh](../../modules/git__aliases.zsh)

[Module overview](../../README.md)
