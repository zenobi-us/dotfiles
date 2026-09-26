# My Dotfiles

Cross-platform configuration for:

- Zsh on Linux and macOS
- PowerShell on Windows
- Development tools managed by mise

## Getting started

Setup has two steps:

1. Install mise.
2. Bootstrap this repository.

## Install mise

### Linux and macOS

Run:

```bash
curl https://mise.run | sh
```

Open a new shell, then verify the installation:

```bash
mise --version
```

### Windows

Open PowerShell as an administrator. Enable the required Windows features:

```powershell
Enable-WindowsOptionalFeature `
  -Online `
  -FeatureName Microsoft-Windows-Subsystem-Linux,VirtualMachinePlatform `
  -All `
  -NoRestart
```

Restart Windows. Then open PowerShell and install mise:

```powershell
winget install --exact --id mise.run
```

Open a new PowerShell window, then verify the installation:

```powershell
mise --version
```

## Bootstrap the dotfiles

The first bootstrap clones this repository to a stable local path. It then applies the platform-specific packages, tools, and dotfiles.

### Linux and macOS

Run:

```bash
mise bootstrap \
  --from https://github.com/zenobi-us/dotfiles.git \
  --from-dir "$HOME/.local/share/dotfiles" \
  --yes
```

Open a new Zsh process after bootstrap changes the shell files:

```bash
exec zsh
```

The managed `.zshenv` sets `MISE_GLOBAL_CONFIG_ROOT` to the repository root. Future bootstrap runs do not need `--from` or `--from-dir`:

```bash
mise bootstrap --yes
```

### Windows

Run in PowerShell:

```powershell
mise bootstrap `
  --from https://github.com/zenobi-us/dotfiles.git `
  --from-dir "$HOME/.local/share/dotfiles" `
  --yes
```

Set the repository as the persistent mise global config root:

```powershell
[Environment]::SetEnvironmentVariable(
  "MISE_GLOBAL_CONFIG_ROOT",
  "$HOME/.local/share/dotfiles",
  "User"
)
```

Open a new PowerShell window. Future bootstrap runs do not need `--from` or `--from-dir`:

```powershell
mise bootstrap --yes
```

## Common commands

Apply the full machine setup:

```bash
mise bootstrap --yes
```

Apply selected bootstrap parts:

```bash
mise bootstrap --only dotfiles --yes
mise bootstrap --only tools --yes
mise bootstrap --only task --yes
```

Inspect state without changing the machine:

```bash
mise bootstrap status
mise bootstrap status --missing
mise bootstrap --dry-run
mise bootstrap plan
```

## Debug bootstrap configuration

Show the mise version:

```bash
mise --version
```

Show the active config files:

```bash
mise config ls
```

Show the combined bootstrap plan:

```bash
mise bootstrap plan
```

The repository uses folder fragments under `.mise/conf.d/`. Each direct child is a self-contained mise bundle. The bundle contains its platform-specific `mise.<env>.toml` files and the files referenced by those configurations.
