# Inspect Bluetooth audio role configuration

For Dotfiles users. Updated 2026-11-27.

## Result

Enable the configured A2DP and HFP roles in WirePlumber.

## Prerequisites

Linux with a compatible WirePlumber/PipeWire stack and a non-sensitive audio device.

## Steps

1. Review the fragment and back up any same-named user override.
2. After normal dotfiles bootstrap, confirm the file is under ~/.config/wireplumber/wireplumber.conf.d.
3. Restart the user WirePlumber service when no active call depends on audio, then inspect Bluetooth profiles in the audio controls.

## Verification

WirePlumber starts without fragment errors and supported device profiles are available. Device capabilities still limit selectable profiles.

## Recovery

Restore the previous fragment and restart WirePlumber if audio regresses. A service restart interrupts active audio.

[Capability overview](README.md)
