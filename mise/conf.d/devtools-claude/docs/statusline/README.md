# Claude status line

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Render model, directory, and context usage from Claude session JSON.

For Dotfiles users. Updated 2026-11-27.

The Bash script consumes JSON on stdin and uses jq. Shared-context enrichment uses a hard-coded CLI location and a per-session temporary cache. That location may not match this checkout.

## Complete a task

[Inspect status-line prerequisites](HOWTO.md)

## Source files

- **Source:** [statusline.sh](../../statusline.sh)
- **Source:** [mise.unix.toml](../../mise.unix.toml)

[Module overview](../../README.md)
