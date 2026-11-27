# Docker-OSX launcher

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Launch the configured Sonoma Docker-OSX container.

For Dotfiles users. Updated 2026-11-27.

The script explicitly invokes Docker, exposes /dev/kvm and the X11 socket, and maps host port 50922 to guest port 10022. It downloads a latest-tagged image and an external serial configuration. No Podman compatibility is established.

## Complete a task

[Review virtual machine access](HOWTO.md)

## Source files

- **Source:** [docker-osx](../../docker-osx)

[Module overview](../../README.md)
