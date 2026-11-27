# Project mise bootstrap copier

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Copy the bundled mise installer into the current project.

For Dotfiles users. Updated 2026-11-27.

`add-mise` copies `setup-mise.bash` to `./setup.sh` and marks it executable. This overwrites an existing setup.sh. The installer downloads mise, edits the shell rc file, and runs mise install.

## Complete a task

[Review a project bootstrap script](HOWTO.md)

## Source files

- **Source:** [add-mise](../../add-mise)
- **Source:** [setup-mise.bash](../../setup-mise.bash)

[Module overview](../../README.md)
