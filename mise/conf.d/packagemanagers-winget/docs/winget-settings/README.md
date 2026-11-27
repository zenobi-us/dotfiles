# WinGet user settings

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Copy the supplied WinGet settings into App Installer local state.

For Dotfiles users. Updated 2026-11-27.

The Windows module copies winget.json to App Installer’s LocalState/settings.json. The file requests user-scope installs. Telemetry and downloader fields are nested under installBehavior in this source; their validity must be checked against the installed WinGet schema rather than assumed.

## Complete a task

[Review WinGet settings](HOWTO.md)

## Source files

- **Source:** [mise.windows.toml](../../mise.windows.toml)
- **Source:** [winget.json](../../winget.json)

[Module overview](../../README.md)
