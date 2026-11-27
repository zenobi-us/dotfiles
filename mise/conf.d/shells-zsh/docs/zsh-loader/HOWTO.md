# Inspect shell module activation

For Dotfiles users. Updated 2026-11-27.

## Result

Load explicitly registered shell modules through Zinit.

## Prerequisites

Zsh, Git, network access for first Zinit clone, mise at ~/.local/bin/mise, and the Rust environment file expected by .zshenv.

## Steps

1. Review the entrypoints and active calls in zinit.zsh before replacing a working shell.
2. Compare module names with existing files; the requested moonrepo__completions.zsh differs from the supplied moonrepo_completions.zsh and is silently skipped.
3. Open a separate Zsh session after normal dotfiles bootstrap while retaining the current shell for recovery.

## Verification

The new shell loads the expected modules without startup errors. Existing files not named by the loader remain inactive.

## Recovery

Use `zsh -f` or another shell to restore previous startup files. Keep the working shell open until the new session is usable.

[Capability overview](README.md)
