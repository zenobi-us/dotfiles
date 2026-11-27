# Inspect Worktrunk shell initialisation

For Dotfiles users. Updated 2026-11-27.

## Result

Initialise Worktrunk shell support when wt is available.

## Prerequisites

The managed interactive Zsh session and Worktrunk installed from its owning module.

## Steps

1. Run `command -v wt` to confirm availability.
2. Review the guarded module and open a new interactive shell.
3. Run `wt --help` before choosing a worktree operation.

## Verification

The installed wt help is available and the shell initialiser loads without errors.

## Recovery

Inspect the owning Worktrunk configuration before using start/remove operations; its hooks trust mise files and stop a branch-port listener.

[Capability overview](README.md)
