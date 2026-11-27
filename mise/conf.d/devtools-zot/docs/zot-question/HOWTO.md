# Inspect extension registration

For Dotfiles users. Updated 2026-11-27.

## Result

Register the external question extension.

## Prerequisites

Zot, repository bootstrap access, and a backup of existing extension configuration.

## Steps

1. Review the bootstrap.repos entry ending in /zot-question in mise.toml.
2. After normal repository bootstrap, inspect ~/.local/state/zot/extensions/zot-question and its upstream instructions.
3. Restart Zot and inspect its extension discovery output.

## Verification

Zot reports the extension loaded, or gives an actionable compatibility error. Do not infer activation from a directory alone.

## Recovery

Keep the previous checkout revision before updating. Disable the extension through Zot’s supported controls if it fails.

[Capability overview](README.md)
