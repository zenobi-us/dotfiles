# Select an existing session

For Dotfiles users. Updated 2026-11-27.

## Result

Select a Zellij session or reload the configured agent-thread plugin.

## Prerequisites

Zellij, fzf, and at least one disposable existing session.

## Steps

1. Run `zellij list-sessions --short` to review session names.
2. Run `zellij-attach` and choose the intended session, or cancel with Escape.
3. Inspect the plugin path before separately using zellij-agent-threads-reload.

## Verification

The chosen session opens; cancellation leaves the current shell unattached.

## Recovery

Detach through Zellij’s configured controls. Check the plugin file exists before reloading it.

[Capability overview](README.md)
