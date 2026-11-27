# Samba container launcher

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Provide a Docker-based directory-sharing launcher for inspection.

For Dotfiles users. Updated 2026-11-27.

The script invokes Docker and intends to share a target directory with dperson/samba. Its port and volume options occur after the image name, so they are passed as container arguments, not Docker options. Do not assume the current script publishes a working share.

## Complete a task

[Review Samba exposure before launch](HOWTO.md)

## Source files

- **Source:** [samba-here](../../samba-here)

[Module overview](../../README.md)
