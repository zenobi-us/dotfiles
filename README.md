# DotFiles

- zsh
- powershell

## Install

### linux

```bash
curl -fsSL https://get.comtrya.dev | sh
comtrya -d https://github.com/airtonix/dotfiles apply
```

### macos

```bash
curl -fsSL https://get.comtrya.dev | sh
comtrya -d https://github.com/airtonix/dotfiles apply
```

### windows

first open powershell as admin and run:

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux,VirtualMachinePlatform -All -NoRestart
```

then reboot. yes stop crying. just do it.

After rebooting, run:

```powershell
iwr "https://get.comtrya.dev/ps" -UseBasicParsing | iex
comtrya -d https://github.com/airtonix/dotfiles apply
```

## Intermediary Setup

Above would be useful if comtrya was perfect. However you may instead need to install individual parts:

```sh
$env:PATH+=";$env:USERPROFILE\.comtrya"
cd C:\Users\zeno.jiricek\AppData\Local\comtrya\manifests\git\githubcomairtonixdotfiles
comtrya apply -m manifest.dot.notated.path.instead.of.slash.notated.paths
```

## Usage

This is mostly a reminder for myself.

```sh
dotfiles apply # applies all changes
dotfiles apply zsh # applies only zsh related changes
dotfiles apply powershell # applies only powershell related changes

# with or without commas
dotfiles apply devtools.opencode,windowmanagers.sway # applies only devtools and sway window manager related changes
dotfiles apply devtools.opencode windowmanagers.sway # applies only devtools and sway window manager related changes
```
