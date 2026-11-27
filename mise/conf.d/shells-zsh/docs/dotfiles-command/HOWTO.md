# Preview bootstrap through the wrapper

For Dotfiles users. Updated 2026-11-27.

## Result

Forward bootstrap options to the detected Dotfiles repository.

## Prerequisites

The managed interactive Zsh session, mise bootstrap support, and the intended repository root.

## Steps

1. Run `type dotfiles` and review the function definition.
2. Check DOTFILE_REPO_ROOT locally before authorising any bootstrap work.
3. Run `dotfiles --dry-run` to preview the detected repository’s changes.

## Verification

The preview targets the intended checkout and forwards the requested bootstrap options.

## Recovery

Cancel if the root is wrong. Set the intended repository context before retrying; omit destructive or broad bootstrap actions during inspection.

[Capability overview](README.md)
