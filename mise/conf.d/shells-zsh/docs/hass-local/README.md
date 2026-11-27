# Home Assistant vault command

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Run Home Assistant CLI with a vault-selected fnox profile.

For Dotfiles users. Updated 2026-11-27.

hass_local requires HASS_SERVER and launches pinned fnox 1.47.0 with the homeassistant profile from ~/.vaultfiles/fnox.toml. It disables defaults and the daemon, errors on missing secrets, and runs homeassistant-cli 1.0.0 through uvx. Tokens stay in the vault workflow.

## Complete a task

[Inspect the Home Assistant command](HOWTO.md)

## Source files

- **Source:** [modules/homeassistant__aliases.zsh](../../modules/homeassistant__aliases.zsh)

[Module overview](../../README.md)
