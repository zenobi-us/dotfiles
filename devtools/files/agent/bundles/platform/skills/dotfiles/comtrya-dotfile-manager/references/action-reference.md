# Comtrya Action Reference

## Overview

Comprehensive reference for comtrya actions. Use alongside SKILL.md for patterns and safety practices.

**Quick navigation:**

- [Package Management](#package-management)
- [File Operations](#file-operations)
- [System Management](#system-management)
- [Repository Operations](#repository-operations)
- [Execution](#execution)
- [OS-Specific](#os-specific)

---

## Package Management

### `package.install`

Install packages via system package manager.

**Supported providers:**

- `apt` (Debian/Ubuntu)
- `brew` (macOS - auto-bootstraps if missing)
- `winget` (Windows)
- `pacman` / `yay` / `paru` (Arch Linux)
- `pkg` (FreeBSD)
- `pkgin` (NetBSD/illumos)
- `xbps` (Void Linux)
- `zypper` (OpenSUSE)
- `macports` (macOS)
- `dnf` (Fedora)
- `snapcraft` (Linux)

**Basic example:**

```yaml
- action: package.install
  name: git
  # Uses default provider (apt on Linux, brew on macOS)
```

**With explicit provider:**

```yaml
- action: package.install
  name: neovim
  provider: apt
```

**Multi-OS with variants:**

```yaml
- action: package.install
  name: docker
  variants:
    - where: os.name == "linux"
      provider: apt
    - where: os.name == "macos"
      provider: brew
```

**Idempotent behavior:**

- If package installed: no-op
- If package missing: installed
- Downgrades: not performed (safe default)

---

### `package.repository`

Add package repositories.

**Example:**

```yaml
- action: package.repository
  name: https://repo.example.com/debian
  key:
    url: https://repo.example.com/key.gpg
```

**Note:** `package.remove` does not exist in Comtrya v0.9.2. For recovery, use `command.run` with package manager's remove command.

---

## File Operations

**IMPORTANT:** Actions `file.link`, `file.copy`, and `directory.copy` require source files to be in a `files/` subdirectory relative to the manifest.

### `file.copy`

Copy files from `files/` directory to destination.

**Basic:**

```yaml
# Copies files/app-config.json to ~/.config/app/config.json
- action: file.copy
  from: app-config.json
  to: ~/.config/app/config.json
```

**With template rendering:**

```yaml
- action: file.copy
  from: config-template.toml
  to: "{{ user.config_dir }}/app/config.toml"
  template: true  # Renders {{ variables }}
```

**With permissions:**

```yaml
- action: file.copy
  from: ssh-config
  to: ~/.ssh/config
  chmod: 0600
```

**With ownership (requires sudo):**

```yaml
- action: file.copy
  from: managed_file
  to: /root/file
  owned_by_user: root
  owned_by_group: root
```

---

### `file.link`

Create symbolic links (from `files/` directory).

**Single file symlink:**

```yaml
# Links files/zshrc to ~/.zshrc
- action: file.link
  from: zshrc
  to: ~/.zshrc
```

**Directory symlink with walk:**

```yaml
# Symlinks all files in files/configs/ to /tmp/configs/
- action: file.link
  source: configs
  target: /tmp/configs
  walk_dir: true
```

**Parameters:**
- Use `from`/`to` for single file
- Use `source`/`target` with `walk_dir: true` for directory

---

### `file.download`

Download files from URLs.

**Basic:**

```yaml
- action: file.download
  from: https://example.com/file.tar.gz
  to: /tmp/download.tar.gz
```

**With ownership (requires sudo):**

```yaml
- action: file.download
  from: https://google.com/robots.txt
  to: /tmp/robots.txt
  owned_by_user: nobody
  owned_by_group: nobody
```

---

### `file.remove`

Remove files.

**Basic:**

```yaml
- action: file.remove
  target: /tmp/some-file
```

---

### `file.chown`

Change file ownership (requires sudo).

**Example:**

```yaml
- action: file.chown
  path: /var/app/config
  user: appuser
  group: appgroup
```

---

### `file.unarchive`

Extract tar.gz archives.

**Example:**

```yaml
- action: file.download
  from: https://github.com/user/repo/archive/v1.0.tar.gz
  to: /tmp/archive.tar.gz

- action: file.unarchive
  from: /tmp/archive.tar.gz
  to: /opt/extracted/
  force: true  # Optional: force re-extraction
```

---

### `directory.copy`

Copy directories from `files/` subdirectory.

**Example:**

```yaml
# Copies files/configs/ to ~/.config/app/
- action: directory.copy
  from: configs
  to: ~/.config/app
```

---

## System Management

### `user.add`

Create system users.

**Basic:**

```yaml
- action: user.add
  fullname: Dev User
  username: devuser
  home_dir: /home/devuser
  shell: /bin/bash
```

**With groups:**

```yaml
- action: user.add
  fullname: Developer
  username: dev
  home_dir: /home/dev
  shell: sh
  group:
    - sudo
    - docker
```

**Note:** Requires sudo/elevation.

---

### `user.group`

Add existing user to groups.

**Example:**

```yaml
- action: user.group
  username: devuser
  group:
    - wheel
    - docker
```

---

### `group.add`

Create system groups.

**Basic:**

```yaml
- action: group.add
  group_name: docker
```

**With dependencies:**

```yaml
- action: group.add
  group_name: docker
  id: "create_docker_group"

- action: user.add
  fullname: Dev User
  username: devuser
  home_dir: /home/devuser
  group:
    - docker
  depends_on: ["create_docker_group"]
```

---

## Repository Operations

### `git.clone`

Clone git repositories (v0.9.1+).

**Note:** Git actions were removed in v0.8.8 and restored in v0.9.1 with breaking changes.

**Basic (v0.9.1+):**

```yaml
- action: git.clone
  repo_url: https://github.com/comtrya/comtrya
  directory: /Users/test/Testing/comtrya/
```

**Common usage:**

```yaml
- action: git.clone
  repo_url: https://github.com/user/dotfiles.git
  directory: ~/dotfiles
  id: "clone_dotfiles"
```

**Parameters changed from v0.8.7:**
- `repository` → `repo_url` (full URL required)
- `path` → `directory`
- `branch` parameter removed (clones default branch)

---

## Execution

### `command.run`

Execute arbitrary shell commands.

**Alias:** `cmd.run`

**Basic:**

```yaml
- action: command.run
  command: echo
  args:
    - "Hello World"
```

**With working directory:**

```yaml
- action: command.run
  command: make
  args:
    - install
  dir: /path/to/project
```

**With privilege escalation:**

```yaml
- action: command.run
  command: systemctl
  args:
    - enable
    - docker
  privileged: true
```

**With environment variables (v0.9.1+):**

```yaml
- action: command.run
  command: go
  args:
    - env
  env:
    GOBIN: /usr/local/go/bin
```

**Conditional execution:**

```yaml
- action: command.run
  command: cargo
  args:
    - install
    - my-tool
  where: os.name == "linux"
```

**Note:** Commands are NOT idempotent by default. Use with caution or add guards.

---

## OS-Specific

### macOS: `macos.default`

Modify macOS system defaults (Finder, Dock, Safari, etc.).

**Finder examples:**

```yaml
- action: macos.default
  domain: com.apple.dock
  key: orientation
  kind: string
  value: left

- action: macos.default
  domain: com.apple.screencapture
  key: include-date
  kind: bool
  value: "false"
```

**Integer example:**

```yaml
- action: macos.default
  domain: NSGlobalDomain
  key: "NSTableViewDefaultSizeMode"
  kind: int
  value: "1"
```

**Parameters:**
- `domain`: defaults domain or NSGlobalDomain
- `key`: preference key
- `kind`: value type (`string`, `bool`, `int`)
- `value`: value as string (even for bool/int)

**Reference:** Find available settings at [macos-defaults.com](https://macos-defaults.com) or use `defaults read DOMAIN`

---

### Linux: systemd services

Create and manage systemd user services using `file.copy` and `command.run`.

**Basic service:**

```yaml
# Create files/my-service.service in manifest directory first
- action: file.copy
  from: my-service.service
  to: ~/.config/systemd/user/my-service.service

- action: command.run
  command: systemctl
  args:
    - --user
    - daemon-reload

- action: command.run
  command: systemctl
  args:
    - --user
    - enable
    - my-service
```

**Timer example:**

```yaml
# Create files/daily-sync.timer and files/daily-sync.service first
- action: file.copy
  from: daily-sync.timer
  to: ~/.config/systemd/user/daily-sync.timer

- action: file.copy
  from: daily-sync.service
  to: ~/.config/systemd/user/daily-sync.service

- action: command.run
  command: systemctl
  args:
    - --user
    - daemon-reload

- action: command.run
  command: systemctl
  args:
    - --user
    - enable
    - --now
    - daily-sync.timer
```

---

## Common Patterns

### Pattern: Conditional Package Installation

```yaml
- action: package.install
  name: pkg-config-tool
  variants:
    - where: os.name == "linux"
      provider: apt
      name: pkg-config
    - where: os.name == "macos"
      provider: brew
      name: pkg-config
    - where: os.name == "windows"
      provider: winget
      name: pkgconfiglite
```

### Pattern: Setup with Dependency Chain

```yaml
- action: user.create
  username: builder
  groups: ["docker"]
  id: "create_builder_user"

- action: file.create
  path: /home/builder/.bashrc
  contents: "..."
  depends_on: ["create_builder_user"]

- action: command.run
  cmd: "chown builder:builder /var/build"
  depends_on: ["create_builder_user"]
```

### Pattern: Multi-File Configuration

```yaml
- action: git.clone
  repo_url: https://github.com/user/configs.git
  directory: ~/dotfiles
  id: "clone_configs"

# Note: file.link requires files in files/ subdirectory
# For git repos, use command.run with ln -s instead
- action: command.run
  command: ln
  args:
    - -sf
    - ~/dotfiles/alacritty.toml
    - ~/.config/alacritty/alacritty.toml
  depends_on: ["clone_configs"]

- action: command.run
  command: ln
  args:
    - -sf
    - ~/dotfiles/zshrc
    - ~/.zshrc
  depends_on: ["clone_configs"]
```

---

## Command Reference: Validation & Execution

### Validate manifest syntax

```bash
comtrya validate manifest.yml
```

### Preview changes (dry-run)

```bash
comtrya apply --dry-run --manifest manifest.yml
```

### Apply manifest

```bash
comtrya apply --manifest manifest.yml
```

### Apply multiple manifests in order

```bash
comtrya apply \
  --manifest base.yml \
  --manifest dev-tools.yml \
  --manifest system.yml
```

### Apply with elevated privileges

```bash
sudo comtrya apply --manifest manifest.yml
```

---

## Troubleshooting

### "Action X depends on Y which doesn't exist"

**Cause:** Missing `id:` on prerequisite action or wrong dependency name.

**Fix:** Check all `id:` fields match `depends_on:` references.

---

### "Package already installed (no-op)"

**Expected behavior:** Comtrya is idempotent. Repeated runs skip already-installed packages.

**If package didn't actually install:** Check `--dry-run` output; may need explicit provider.

---

### "File symlink failed"

**Cause:** Target file/directory doesn't exist yet.

**Fix:** Add `depends_on:` if creating target file first (e.g., `git.clone`).

---

### "Sudo required but not elevated"

**Cause:** Some actions need `sudo` but comtrya was run as regular user.

**Fix:** Run entire manifest with `sudo comtrya apply`, OR add `sudo` in individual commands.

---
