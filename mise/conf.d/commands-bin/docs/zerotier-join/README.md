# ZeroTier DNS join helper

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Join a ZeroTier network and configure its split DNS with systemd-resolved.

For Dotfiles users. Updated 2026-11-27.

The Bun command validates a 16-digit hexadecimal network ID, uses sudo to join and allow DNS, and configures resolvectl from network-provided DNS metadata. Missing metadata fails after the join; it does not roll back membership.

## Complete a task

[Join an authorised network](HOWTO.md)

## Source files

- **Source:** [zerotier-join](../../zerotier-join)

[Module overview](../../README.md)
