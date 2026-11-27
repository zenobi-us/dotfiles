# Review virtual machine access

For Dotfiles users. Updated 2026-11-27.

## Result

Launch the configured Sonoma Docker-OSX container.

## Prerequisites

Unix shell and the dependencies named in the overview. Commands are linked into ~/.local/bin by this module.

## Steps

1. Inspect the image, port mapping, serial configuration URL, and CPU settings in docker-osx.
2. Confirm Docker, KVM access, and an X11 session are available.
3. Approve the image and host-device exposure before running the launcher.

## Verification

The reviewed settings match your host and licensing constraints; no guest is started by this inspection.

## Recovery

Stop the container if access is broader than intended; the script does not set --rm, so inspect retained containers before removing them.

[Capability overview](README.md)
