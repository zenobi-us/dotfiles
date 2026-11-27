# Herdr context query helper

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Run target-side shared-context queries through a JSON protocol.

For Dotfiles users. Updated 2026-11-27.

The generated Bun executable accepts request, job-create, job-run, job-status, and job-remove. It returns one protocol-1 JSON envelope and supports GNU/Linux Core targets. Tracker and validation reads can use jobs. Source changes require rebuilding the generated helper through the module’s existing build process.

## Complete a task

[Inspect the query helper](HOWTO.md)

## Source files

- **Source:** [build/cli.ts](../../build/cli.ts)
- **Source:** [build/protocol.ts](../../build/protocol.ts)
- **Source:** [app/bin/herdr-context.mjs](../../app/bin/herdr-context.mjs)

[Module overview](../../README.md)
