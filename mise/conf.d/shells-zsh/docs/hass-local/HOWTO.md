# Inspect the Home Assistant command

For Dotfiles users. Updated 2026-11-27.

## Result

Run Home Assistant CLI with a vault-selected fnox profile.

## Prerequisites

An approved protected HASS_SERVER endpoint, mise, uvx, and an authorised vault profile.

## Steps

1. Review the wrapper and ensure the endpoint uses validated HTTPS or an encrypted tunnel.
2. Set HASS_SERVER locally without placing credentials in shell history.
3. Run `hass_local --help` before choosing any read-only or mutating operation.

## Verification

CLI help is available through the selected profile. Help alone does not verify endpoint authentication.

## Recovery

Resolve missing profile credentials through the vault owner. Do not bypass missing-secret checks or print tokens.

[Capability overview](README.md)
