# Directory gallery

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Serve the current directory as an image gallery and file browser.

For Dotfiles users. Updated 2026-11-27.

The Bun command uses the working directory as its root and selects a port from PORT, its first argument, or 3000. Its page loads Vue and Tailwind from external CDNs. The server does not set a hostname, and lexical path checks do not exclude symlinks to files outside the root. Use only a trusted sample directory with no private symlink targets.

## Complete a task

[Preview a public sample directory](HOWTO.md)

## Source files

- **Source:** [gallery](../../gallery)

[Module overview](../../README.md)
