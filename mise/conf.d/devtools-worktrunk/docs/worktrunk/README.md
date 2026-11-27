# Worktrunk

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Manage worktrees with the shared Worktrunk policy.

For Dotfiles users. Updated 2026-11-27.

The module requests `github:max-sixty/worktrunk` through mise. The canonical module pins 0.52.0. Configured worktrees live in a sibling <repo>.worktrees directory. Post-start runs mise trust -y and mise setup; pre-remove kills a listening process on the branch-derived port. Review these hooks before use. devtools-git separately requests latest, so effective version precedence needs local inspection.

The declaration controls installation; it does not configure accounts or prove that the executable is installed.

## Complete a task

[Inspect Worktrunk installation](HOWTO.md)

## Source files

- **Source:** [mise.toml](../../mise.toml)
- **Source:** [config.toml](../../config.toml)

[Module overview](../../README.md)
