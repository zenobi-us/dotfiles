# Inspect agent activity reporting

For Dotfiles users. Updated 2026-11-27.

## Result

Report root OMP session activity to its owning Herdr pane.

## Prerequisites

OMP launched as a root agent inside Herdr.

## Steps

1. Check the extension link exists under ~/.omp/agent/extensions.
2. Start an OMP session in a disposable Herdr pane.
3. Observe the pane status while a normal request starts and completes.

## Verification

Herdr shows activity for the owning root session, without a nested shell replacing that session.

## Recovery

Reinstall the Herdr integration if its generated source is stale. Put custom hooks beside it rather than editing this managed file.

[Capability overview](README.md)
