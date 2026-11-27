# Merge into a separate export

For Dotfiles users. Updated 2026-11-27.

## Result

Combine two Enpass exports while preserving the selected conflict winner.

## Prerequisites

Bun, the commands-bin enpass-merge entrypoint, backed-up exports, and a private directory.

## Steps

1. Keep originals unchanged and choose a new output filename.
2. Run `enpass-merge export-a.json export-b.json -o export-c.json --report merge-report.json`.
3. Review the private report and import export-c.json into a test vault.

## Verification

The test vault contains expected unique records and reviewed conflict winners. Never publish export or report contents.

## Recovery

Discard generated files if the result is wrong. Retain original exports and vault.

[Capability overview](README.md)
