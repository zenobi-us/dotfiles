# Inspect OMP host links

For Dotfiles users. Updated 2026-11-27.

## Result

Link OMP configuration and shared bundles into the user agent directory.

## Prerequisites

OMP installed separately and the shared devtools-agent bundle directories.

## Steps

1. Review destination paths in mise.unix.toml without opening credential-bearing provider files.
2. Check that ~/.omp/agent/bundles entries resolve to the intended shared bundle directories.
3. Start OMP and inspect its loaded extension/bundle list through host controls.

## Verification

OMP discovers the intended bundles and extensions. Filesystem links alone do not prove activation.

## Recovery

Restore previous link targets if OMP loads another checkout. Keep provider configuration private.

[Capability overview](README.md)
