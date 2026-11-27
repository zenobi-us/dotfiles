# Review a project bootstrap script

For Dotfiles users. Updated 2026-11-27.

## Result

Copy the bundled mise installer into the current project.

## Prerequisites

Unix shell and the dependencies named in the overview. Commands are linked into ~/.local/bin by this module.

## Steps

1. Choose a disposable directory without a setup.sh.
2. Run `add-mise` there.
3. Review the generated setup.sh before executing it; it fetches and executes the mise installer.

## Verification

The generated setup.sh matches the module template and is executable.

## Recovery

Delete only the generated copy if unwanted; restore any overwritten setup.sh from your backup.

[Capability overview](README.md)
