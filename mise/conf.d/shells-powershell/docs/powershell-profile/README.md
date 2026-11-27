# PowerShell profile

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Load shared initialisers and command aliases from the managed PowerShell profile.

For Dotfiles users. Updated 2026-11-27.

Windows copies the module into ~/Documents/PowerShell. The profile loads common.ps1, then matching init*, commands*, and alias* parts. It warns when MISE_GLOBAL_CONFIG_ROOT is unset and also attempts local secrets parts. Individual initialisers depend on separately installed tools.

## Complete a task

[Inspect profile loading](HOWTO.md)

## Source files

- **Source:** [mise.windows.toml](../../mise.windows.toml)
- **Source:** [Microsoft.PowerShell_profile.ps1](../../Microsoft.PowerShell_profile.ps1)
- **Source:** [common.ps1](../../common.ps1)
- **Source:** [parts](../../parts)

[Module overview](../../README.md)
