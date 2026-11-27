# UnbiasedStrata container workflow

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Build and run the pinned UnbiasedStrata checkout inside the strata Distrobox.

For Dotfiles users. Updated 2026-11-27.

Linux clones a pinned upstream revision into ~/.local/share/unbiased-strata. Build and runtime enter the strata Distrobox. Builds require CUDA 12.x and use CUDA_ARCHS=86. The launcher refuses to run before build/bin/unbiased-strata exists.

## Complete a task

[Prepare the Strata build environment](HOWTO.md)

## Source files

- **Source:** [mise.linux.toml](../../mise.linux.toml)
- **Source:** [scripts/build](../../scripts/build)
- **Source:** [scripts/unbiased-strata](../../scripts/unbiased-strata)

[Module overview](../../README.md)
