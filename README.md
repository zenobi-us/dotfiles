# My Dotfiles

![Dotfiles banner](./banner.png)

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

Show the selected nested bootstrap roots:

```bash
mise bootstrap config-roots
```

Inspect the roots as JSON:

```bash
mise bootstrap config-roots --json | jq
```

If your command runner merges stderr into stdout, keep the deprecation warning away from `jq`:

```bash
mise bootstrap config-roots --json 2>/dev/null | jq
```

Show the combined bootstrap plan:

```bash
mise bootstrap plan
```

### Fix `config_roots did not match any config roots`

This repository links its root `mise.toml` as the global mise config. Mise must resolve relative config-root patterns from the repository, not from the home directory.

On Linux or macOS, confirm the variable:

```zsh
print -r -- "$MISE_GLOBAL_CONFIG_ROOT"
```

For a one-off repair, run:

```bash
MISE_GLOBAL_CONFIG_ROOT="$HOME/.local/share/dotfiles" \
  mise bootstrap config-roots
```

On Windows, confirm the variable:

```powershell
$env:MISE_GLOBAL_CONFIG_ROOT
```

For a one-off repair, run:

```powershell
$env:MISE_GLOBAL_CONFIG_ROOT = "$HOME/.local/share/dotfiles"
mise bootstrap config-roots
```

### Expected deprecation warning

Mise currently prints a warning for `[bootstrap].config_roots`. This warning is expected. Mise supports the setting for compatibility but plans to remove it in mise `2027.3.3`.
