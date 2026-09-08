# My DotFiles

![](./banner.png)

- zsh
- powershell

## Install

### Linux and macOS

```bash
curl https://mise.run | sh
git clone git@github.com:zenobi-us/dotfiles.git ~/Projects/dotfiles
cd ~/Projects/dotfiles
./install.bash
```

### Windows

Open PowerShell as administrator.

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux,VirtualMachinePlatform -All -NoRestart
```

Restart Windows. Then run:

```powershell
git clone git@github.com:zenobi-us/dotfiles.git $HOME\Projects\dotfiles
cd $HOME\Projects\dotfiles
.\install.ps1
```

## Usage

Apply the full machine setup:

```bash
mise bootstrap --yes
```

Apply one bootstrap phase:

```bash
mise bootstrap --only dotfiles --yes
mise bootstrap --only tools --yes
mise bootstrap --only task --yes
```

Check state without changing the machine:

```bash
mise bootstrap status
mise bootstrap status --missing
mise bootstrap --dry-run
```

Use the legacy wrapper only as a shortcut:

```bash
./apply.sh
./apply.sh --only dotfiles
```

## Layout

| Path | Purpose |
| --- | --- |
| `mise.toml` | Common tools, bootstrap tasks, and common bootstrap roots |
| `mise.linux.toml` | Linux packages, repositories, and Linux bootstrap roots |
| `mise.wsl2.toml` | WSL2-only systemd user units. Loads only when `MISE_ENV=wsl2` (set by `files/shells/zsh/modules/wsl__env.zsh`) |
| `mise.macos.toml` | macOS packages and dotfiles |
| `mise.windows.toml` | Windows repositories and bootstrap roots |
| `files/devtools/mise/tasks/` | File tasks for Mise |
| `manifests/` | Composed declarative bootstrap roots for common, Unix, Linux, and Windows resources |
| `files/assets/`, `files/browsers/`, `files/commands/`, `files/devtools/`, `files/packagemanagers/`, `files/shells/`, `files/windowmanagers/` | Managed source files by domain |

## Notes

`mise bootstrap` replaces the old Comtrya manifests.

Windows package setup still runs through `tasks.bootstrap:windows`. Mise does not have native `winget` or `scoop` bootstrap managers yet.
