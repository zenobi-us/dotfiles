# Herdr OMP agent-state integration

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Report root OMP session activity to its owning Herdr pane.

For Dotfiles users. Updated 2026-11-27.

The Herdr-managed extension reports working, blocked, and idle state over the Herdr socket. It activates only with Herdr environment, socket, and pane identifiers, and skips nested OMP shells marked OMPCODE=1. Reinstallation can overwrite this generated integration.

## Complete a task

[Inspect agent activity reporting](HOWTO.md)

## Source files

- **Source:** [extensions/herdr-omp-agent-state.ts](../../extensions/herdr-omp-agent-state.ts)

[Module overview](../../README.md)
