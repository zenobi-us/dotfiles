# Join an authorised network

For Dotfiles users. Updated 2026-11-27.

## Result

Join a ZeroTier network and configure its split DNS with systemd-resolved.

## Prerequisites

Unix shell and the dependencies named in the overview. Commands are linked into ~/.local/bin by this module.

## Steps

1. Confirm Bun, sudo, zerotier-cli, systemd-resolved, and an authorised network ID are available.
2. Run `zerotier-join NETWORK_ID`, replacing NETWORK_ID with the approved ID.
3. If required, authorise the device in the network controller, then retry once DNS metadata is available.

## Verification

Use `resolvectl query` for a known hostname in the supplied DNS domain and inspect the interface DNS settings.

## Recovery

Use `sudo zerotier-cli leave NETWORK_ID` for unintended membership. Revert interface DNS with resolvectl after identifying the interface.

[Capability overview](README.md)
