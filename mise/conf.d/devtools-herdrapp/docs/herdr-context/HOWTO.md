# Inspect the query helper

For Dotfiles users. Updated 2026-11-27.

## Result

Run target-side shared-context queries through a JSON protocol.

## Prerequisites

Bun, the linked herdr-context executable, and a GNU/Linux Core target.

## Steps

1. Run `herdr-context --help`.
2. Review the documented request envelope and your absolute repository path.
3. Use only a read operation supported by the help and protocol source; keep job UUIDs scoped to their owner.

## Verification

Help returns a protocol-1 envelope with ok=true. Query failures return an error envelope and a nonzero exit.

## Recovery

Inspect the envelope error instead of retrying mutations. If the executable is stale, use the module’s existing build workflow, not manual edits to generated code.

[Capability overview](README.md)
