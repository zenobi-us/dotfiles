# WSLg clipboard image bridge

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Convert WSLg mirrored BMP images into PNG for Claude paste.

For Dotfiles users. Updated 2026-11-27.

The WSL2 systemd unit launches clip-bridge with WAYLAND_DISPLAY=wayland-0. The script converts the BMP variant Claude cannot decode. Outside WSL it is a no-op.

## Complete a task

[Inspect the WSL clipboard service](HOWTO.md)

## Source files

- **Source:** [clip-bridge](../../clip-bridge)
- **Source:** [mise.wsl2.toml](../../mise.wsl2.toml)

[Module overview](../../README.md)
