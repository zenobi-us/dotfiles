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

**Variants available:**

- `apt` (Debian/Ubuntu)
- `brew` (macOS)
- `homebrew-cask` (macOS GUI apps)
- `winget` (Windows)
- `choco` (Windows legacy)
- `cargo` (Rust packages)
- `pip` (Python packages)
- `npm` (Node.js packages)
- `nix` (NixOS)

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

### `package.remove`

Remove installed packages.

**Example:**

```yaml
- action: package.remove
  name: old-app
  provider: apt
```

Use in recovery manifests when troubleshooting.

---

## File Operations

### `file.create`

Create files with content.

**Basic:**

```yaml
- action: file.create
  path: ~/.config/app/config.json
  contents: |
    {
      "setting": "value"
    }
```

**With permissions (Linux/macOS):**

```yaml
- action: file.create
  path: ~/.ssh/config
  contents: |
    Host github.com
      IdentityFile ~/.ssh/id_ed25519
  mode: 0600  # Read/write owner only
```

**Overwrite existing (use with caution):**

```yaml
- action: file.create
  path: ~/.bashrc
  contents: |
    export PATH=~/.local/bin:$PATH
  force: true  # Overwrites existing file
```

**Idempotent behavior:**

- If file exists and content matches: no-op
- If file missing: created
- If content differs and `force: false`: error
- If content differs and `force: true`: overwrites

---

### `file.symlink`

Create symbolic links.

**Basic:**

```yaml
- action: file.symlink
  source: ~/.config/dotfiles/zshrc
  target: ~/.zshrc
```

**Creating links to directories:**

```yaml
- action: file.symlink
  source: ~/.config/dotfiles/nvim
  target: ~/.config/nvim
```

**With removal of existing (if needed):**

```yaml
- action: file.symlink
  source: ~/.config/new-config
  target: ~/.config/old-config
  force: true  # Removes old symlink/file first
```

**Idempotent behavior:**

- If symlink exists and points correctly: no-op
- If target missing: error
- If symlink exists but wrong target: error (use `force: true`)

---

### `file.delete`

Remove files or directories.

**File removal:**

```yaml
- action: file.delete
  path: ~/.config/broken-app
```

**Use in recovery scenarios:**

```yaml
# recover.yml
- action: file.delete
  path: ~/.config/app-v1
  recursive: true  # Remove directory and contents
```

---

## System Management

### `user.create`

Create system users.

**Basic (Linux):**

```yaml
- action: user.create
  username: devuser
  home: /home/devuser
  groups: ["sudo", "docker"]
  shell: /bin/bash
```

**With UID/GID:**

```yaml
- action: user.create
  username: builder
  uid: 5000
  gid: 5000
  home: /var/builder
```

**Note:** Requires sudo/elevation.

---

### `group.create`

Create system groups.

**Basic:**

```yaml
- action: group.create
  name: docker
  id: 1001
```

**Use case:** Often prerequisite for user creation or file permissions.

**With dependencies:**

```yaml
- action: group.create
  name: docker
  id: 1001
  id: "create_docker_group"

- action: user.create
  username: devuser
  groups: ["docker"]
  depends_on: ["create_docker_group"]
```

---

## Repository Operations

### `git.clone`

Clone git repositories.

**Basic:**

```yaml
- action: git.clone
  repo: https://github.com/user/dotfiles.git
  path: ~/.config/dotfiles
  branch: main
  id: "clone_dotfiles"
```

**Shallow clone (faster for large repos):**

```yaml
- action: git.clone
  repo: https://github.com/large/repo.git
  path: /opt/repo
  branch: main
  depth: 1
```

**With SSH key (for private repos):**

```yaml
- action: git.clone
  repo: git@github.com:private/repo.git
  path: ~/private-config
  branch: main
```

**Idempotent behavior:**

- If repo exists and correct branch: no-op
- If repo missing: cloned
- If branch differs: error (manual update needed)

---

## Execution

### `command.run`

Execute arbitrary shell commands.

**Basic:**

```yaml
- action: command.run
  cmd: "mkdir -p ~/.config/app"
```

**With specific shell:**

```yaml
- action: command.run
  cmd: |
    if [ ! -f ~/.ssh/id_ed25519 ]; then
      ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""
    fi
  shell: bash
```

**With sudo (requires elevation):**

```yaml
- action: command.run
  cmd: "systemctl enable docker"
  shell: bash
```

**Conditional execution:**

```yaml
- action: command.run
  cmd: "cargo install --locked my-tool"
  where: os.name == "linux"
```

**With environment variables:**

```yaml
- action: command.run
  cmd: "go install github.com/user/tool@latest"
  env:
    GOPATH: /opt/go
    PATH: /opt/go/bin:$PATH
```

**With dependency:**

```yaml
- action: command.run
  cmd: "systemctl --user daemon-reload"
  depends_on: ["create_systemd_service"]
```

**Note:** Commands are NOT idempotent by default. Guard against multiple runs:

```yaml
# ❌ Unsafe - runs every time
- action: command.run
  cmd: "echo 'appended' >> ~/.bashrc"

# ✅ Better - only runs if file doesn't exist
- action: command.run
  cmd: "echo 'appended' >> ~/.bashrc"
  where: '!file_exists("~/.bashrc.backup")'
```

---

## OS-Specific

### macOS: `macOS.defaults.write`

Modify macOS system defaults (Finder, Dock, Safari, etc.).

**Finder examples:**

```yaml
- action: macOS.defaults.write
  domain: "com.apple.finder"
  key: "AppleShowAllFiles"
  value: true
  type: "bool"
  where: os.name == "macos"

- action: macOS.defaults.write
  domain: "com.apple.finder"
  key: "FXEnableExtensionChangeWarning"
  value: false
  type: "bool"
  where: os.name == "macos"
```

**Dock examples:**

```yaml
- action: macOS.defaults.write
  domain: "com.apple.dock"
  key: "autohide"
  value: true
  type: "bool"

- action: macOS.defaults.write
  domain: "com.apple.dock"
  key: "show-recents"
  value: false
  type: "bool"
```

**Type options:** `bool`, `int`, `string`, `array`, `date`

**Reference:** Find available domains with `defaults domains` or `defaults find KEYWORD`

---

### Linux: `systemd.*`

Create and manage systemd user services.

**Basic service:**

```yaml
- action: file.create
  path: ~/.config/systemd/user/my-service.service
  contents: |
    [Unit]
    Description=My Custom Service
    After=network-online.target

    [Service]
    Type=simple
    ExecStart=/usr/local/bin/my-service
    Restart=on-failure
    RestartSec=10

    [Install]
    WantedBy=default.target

- action: command.run
  cmd: "systemctl --user daemon-reload"

- action: command.run
  cmd: "systemctl --user enable my-service"
```

**Timer example:**

```yaml
- action: file.create
  path: ~/.config/systemd/user/daily-sync.timer
  contents: |
    [Unit]
    Description=Daily sync timer

    [Timer]
    OnCalendar=daily
    OnBootSec=5min

    [Install]
    WantedBy=timers.target

- action: file.create
  path: ~/.config/systemd/user/daily-sync.service
  contents: |
    [Unit]
    Description=Daily sync service

    [Service]
    Type=oneshot
    ExecStart=/home/user/.local/bin/sync-script.sh
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
  repo: https://github.com/user/configs.git
  path: ~/.config/dotfiles
  id: "clone_configs"

- action: file.symlink
  source: ~/.config/dotfiles/alacritty.toml
  target: ~/.config/alacritty/alacritty.toml
  depends_on: ["clone_configs"]

- action: file.symlink
  source: ~/.config/dotfiles/zshrc
  target: ~/.zshrc
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
