# WSL environment integration

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Select the WSL2 mise environment and add limited Windows interop paths.

For Dotfiles users. Updated 2026-11-27.

When WSL_DISTRO_NAME is set, the environment module exports MISE_ENV=wsl2 and appends existing Windows System32 and PowerShell paths. Non-WSL shells skip that branch. This does not enable WSL or change /etc/wsl.conf. The separately loaded wslview module sets BROWSER and AWS_BROWSER to /usr/bin/wslview without a WSL guard; check that path outside WSL.

## Complete a task

[Inspect WSL environment selection](HOWTO.md)

## Source files

- **Source:** [modules/wsl__env.zsh](../../modules/wsl__env.zsh)
- **Source:** [modules/wslview__env.zsh](../../modules/wslview__env.zsh)
- **Source:** [zinit.zsh](../../zinit.zsh)

[Module overview](../../README.md)
