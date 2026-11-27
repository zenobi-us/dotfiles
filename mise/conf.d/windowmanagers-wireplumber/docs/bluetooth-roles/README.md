# WirePlumber Bluetooth roles

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Enable the configured A2DP and HFP roles in WirePlumber.

For Dotfiles users. Updated 2026-11-27.

Linux copies a WirePlumber fragment into the user wireplumber.conf.d directory. The BlueZ roles are a2dp_sink, a2dp_source, hfp_hf, and hfp_ag. It does not install WirePlumber or pair devices.

## Complete a task

[Inspect Bluetooth audio role configuration](HOWTO.md)

## Source files

- **Source:** [mise.linux.toml](../../mise.linux.toml)
- **Source:** [wireplumber.conf.d/51-bluez-handsfree.conf](../../wireplumber.conf.d/51-bluez-handsfree.conf)

[Module overview](../../README.md)
