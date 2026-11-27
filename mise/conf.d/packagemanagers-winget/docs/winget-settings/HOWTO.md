# Review WinGet settings

For Dotfiles users. Updated 2026-11-27.

## Result

Copy the supplied WinGet settings into App Installer local state.

## Prerequisites

Windows with App Installer/WinGet and a backup of existing settings.

## Steps

1. Open WinGet settings using `winget settings`.
2. Compare the destination with this module’s winget.json and its $schema.
3. Apply only schema-supported fields, preserving any existing source or policy requirements.

## Verification

The settings editor reports no schema errors and the intended install scope is effective.

## Recovery

Restore the previous settings file if WinGet rejects the supplied nesting. Do not assume telemetry is disabled solely from this file.

[Capability overview](README.md)
