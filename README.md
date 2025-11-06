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

---

# Comtrya Quick Reference

## CLI Commands

| Command | Description |
|---------|-------------|
| `comtrya apply` | Apply all manifests in current directory |
| `comtrya -d ./path apply` | Apply manifests from specific directory |
| `comtrya -d ./ apply -m one,two,three` | Apply specific manifests by name |
| `comtrya status` | List manifest status |
| `comtrya contexts` | List available contexts |
| `comtrya contexts --show-values` | Show context values |
| `comtrya version` | Print version information |
| `comtrya help` | Print help information |
| `comtrya gen-completions` | Auto generate shell completions |

## YAML Actions in Manifests

### binary.github
Download binary from GitHub
```yaml
- action: binary.github
  name: comtrya                    # binary name locally
  directory: /usr/local/bin        # save location
  repository: comtrya/comtrya      # github repo
  version: v0.8.7                  # version/tag
```

### command.run (alias: cmd.run)
Run arbitrary commands
```yaml
- action: command.run
  command: echo
  args:
    - "Hello world"
  dir: .                           # working directory (optional)
  privileged: false                # elevate privileges (optional)
  env:                             # scoped env vars (optional)
    VAR_NAME: value
```

### file.copy
Copy file from files directory to destination
```yaml
- action: file.copy
  from: config_file                # source (under files/)
  to: "{{ user.config_dir }}/app"  # destination
  template: false                  # render with context (optional)
  chmod: 644                       # octal permissions (optional)
  owned_by_user: username          # chown user (optional, needs root)
  owned_by_group: groupname        # chown group (optional, needs root)
```

### file.download
Download file from URL
```yaml
- action: file.download
  from: https://example.com/file
  to: /tmp/file
  owned_by_user: user              # chown (optional, needs root)
  owned_by_group: group            # chown (optional, needs root)
```

### file.link
Create symlinks
```yaml
# Single file
- action: file.link
  from: /root/symlink              # symlink location
  to: managed_file                 # what it points to

# Directory walk
- action: file.link
  source: walker
  target: /tmp/walker-123
  walk_dir: true                   # walk directory
```

### file.remove
Remove file
```yaml
- action: file.remove
  target: /tmp/some-file
```

### file.unarchive
Extract tar.gz archives
```yaml
- action: file.unarchive
  from: /tmp/archive.tar.gz
  to: /tmp/extracted
  force: true                      # force extraction (optional)
```

### directory.copy
Copy directory
```yaml
- action: directory.copy
  from: managed_directory          # source (under files/)
  to: /root/location               # destination
```

### package.install
Install packages
```yaml
# Default provider
- action: package.install
  name: curl

# Multiple packages
- action: package.install
  list:
    - curl
    - wget

# Specific provider
- action: package.install
  name: curl
  provider: pkgin                  # or: brew, apt, pacman, yay, dnf, etc.

# From repository
- action: package.install
  name: blox
  provider: homebrew
  repository: cueblox/tap

# Local file
- action: package.install
  name: /path/to/file.pkg
  file: true
```

### package.repository
Configure package repositories (more docs needed)
```yaml
- action: package.repository
  provider: apt
  name: repository-name
  url: https://repo.url
  key: key_content
```

### file.chown
Change file ownership
```yaml
- action: file.chown
  path: ./files/some-file
  user: username
  group: groupname
```

## Context Variables Available

Use `{{ variable_name }}` in templates and file.copy actions.

### Environment Variables
All env vars accessible via `{{ env.VAR_NAME }}`
```
HOME, PATH, SHELL, USER, etc.
```

### OS Context
```yaml
{{ os.name }}                 # OS name
{{ os.family }}               # OS family
{{ os.version }}              # OS version
{{ os.codename }}             # OS codename
{{ os.edition }}              # OS edition
{{ os.bitness }}              # 32 or 64
{{ os.hostname }}             # System hostname
```

### User Context
```yaml
{{ user.name }}               # User display name
{{ user.username }}           # Username
{{ user.home_dir }}           # Home directory
{{ user.config_dir }}         # Config directory
{{ user.data_dir }}           # Data directory
{{ user.data_local_dir }}     # Local data directory
{{ user.document_dir }}       # Documents directory
{{ user.id }}                 # User ID
```

**Resolved values by platform:**

| Variable | Linux | macOS | Windows |
|----------|-------|-------|---------|
| `home_dir` | `/home/username` | `/Users/username` | `C:\Users\username` |
| `config_dir` | `/home/username/.config` | `/Users/username/Library/Application Support` | `C:\Users\username\AppData\Roaming` |
| `data_dir` | `/home/username/.local/share` | `/Users/username/Library/Application Support` | `C:\Users\username\AppData\Roaming` |
| `data_local_dir` | `/home/username/.local/share` | `/Users/username/Library/Application Support` | `C:\Users\username\AppData\Local` |
| `document_dir` | `unknown` | `/Users/username/Documents` | `C:\Users\username\Documents` |
| `name` | user display name | user display name | user display name |
| `username` | `username` | `username` | `username` |
| `id` | uid (e.g. 1000) | uid | N/A |

Use `comtrya contexts --show-values` to see resolved values on your system.

### Custom Variables
Define in manifest or include via `include_variables` directive

## Supported Package Providers

| Provider | OS |
|----------|-----|
| pacman/yay | Arch |
| paru | Arch |
| apt | Debian/Ubuntu |
| pkg | FreeBSD |
| pkgin | NetBSD (Multiple) |
| brew | macOS |
| winget | Windows |
| xbps | Void Linux |
| zypper | OpenSUSE |
| macports | macOS |
| dnf | Fedora |
| snapcraft | Linux |

## Key Tips

- Manifest files must be YAML or TOML format
- File references in `file.copy`, `file.link`, `directory.copy` must be under a `files/` directory
- Use `{{ variable }}` for templating in file.copy with `template: true`
- Template support works with file.download as well
- Privilege escalation available via `privileged: true` in command.run
- Scoped environment variables in command.run are injected before execution and removed after
- View all available contexts with: `comtrya contexts --show-values`
