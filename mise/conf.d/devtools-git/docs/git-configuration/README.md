# Global Git configuration

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Copy shared Git configuration and ignore rules into the home directory.

For Dotfiles users. Updated 2026-11-27.

The module copies .gitconfig and .gitignore_global, rather than symlinking them. Review locally before applying: global Git configuration can contain account-specific identity and signing choices. Account values are not reproduced here.

## Complete a task

[Review global Git installation](HOWTO.md)

## Source files

- **Source:** [mise.toml](../../mise.toml)
- **Source:** [.gitconfig](../../.gitconfig)
- **Source:** [.gitignore_global](../../.gitignore_global)

[Module overview](../../README.md)
