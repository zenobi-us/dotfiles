# Review focus tracking in dry-run mode

For Dotfiles users. Updated 2026-11-27.

## Result

Map focused Herdr panes to Tempo issue trackers through local rules.

## Prerequisites

Herdr, Bun 1.3+, configured tempo setup, and approved issue-matching rules.

## Steps

1. Run `mise run herdr.bootstrap` from the repository root after dotfiles links exist. The task installs dependencies before linking.
2. Run `herdr plugin config-dir tempomat`; copy rules.example.toml into that configuration directory as rules.toml and keep live=false.
3. Focus matching and unmatched sample panes; inspect plugin status with `herdr plugin action invoke tempomat.status` and review the private dry-run log.

## Verification

The reported issue and planned transitions match the rules without writing real worklogs.

## Recovery

Keep live=false if matches are wrong. Review the existing README before enabling live mode or invoking tempomat.stop, which finalises tracking.

[Capability overview](README.md)
