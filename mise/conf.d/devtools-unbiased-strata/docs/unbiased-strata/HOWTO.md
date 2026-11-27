# Prepare the Strata build environment

For Dotfiles users. Updated 2026-11-27.

## Result

Build and run the pinned UnbiasedStrata checkout inside the strata Distrobox.

## Prerequisites

Linux, Distrobox named strata, shared home paths, and supported NVIDIA hardware.

## Steps

1. Review the pinned repository revision in mise.linux.toml.
2. Confirm git, cmake, make, gcc, g++, and CUDA 12.x nvcc are available inside strata.
3. Use the normal repository bootstrap, then run `mise run unbiased-strata:build` when ready to compile.

## Verification

The build produces ~/.local/share/unbiased-strata/build/bin/unbiased-strata; the unbiased-strata launcher enters strata to run it.

## Recovery

Resolve missing compiler or container dependencies inside strata, not on the host. Check GPU architecture compatibility before changing CUDA_ARCHS.

[Capability overview](README.md)
