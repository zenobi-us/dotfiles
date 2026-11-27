# Inspect mise activation

For Dotfiles users. Updated 2026-11-27.

## Result

Activate mise for environment, login, and interactive Zsh phases.

## Prerequisites

Zsh with mise installed at ~/.local/bin/mise.

## Steps

1. Review all three mise modules together rather than enabling only one filename.
2. Open a new interactive shell and run `command -v mise`.
3. Use `mise config ls` to inspect origins from a known project.

## Verification

Mise resolves correctly and reports the intended project/user configuration origins. The marker alone does not prove correct activation.

## Recovery

Use a recovery shell and restore previous startup links if activation fails. Check the expected binary path before adding another activation snippet.

[Capability overview](README.md)
