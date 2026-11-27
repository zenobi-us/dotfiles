# Launch the supplied Windows configuration

For Dotfiles users. Updated 2026-11-27.

## Result

Manage the Windows Alacritty release and bundled terminal themes.

## Prerequisites

Windows, Alacritty installed through mise, and available configured fonts.

## Steps

1. Review alacritty.windows.toml and its theme imports.
2. Confirm the module link exists under AppData/Roaming/alacritty.
3. Launch Alacritty with `alacritty --config-file "$env:APPDATA/alacritty/alacritty.windows.toml"` from PowerShell.

## Verification

The terminal starts with the selected configuration and reports no missing import or font errors.

## Recovery

Restart without --config-file to return to the default. Review portable-release compatibility before changing the tool backend.

[Capability overview](README.md)
