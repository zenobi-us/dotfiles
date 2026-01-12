# Comtrya Actions Reference (v0.9.2)

Quick reference for all available Comtrya actions and their parameters.

## File & Directory Actions

| Action | Required Params | Optional Params | Description |
|--------|----------------|-----------------|-------------|
| `file.copy` | `from`, `to` | `template`, `chmod`, `owned_by_user`, `owned_by_group`, `passphrase` | Copy file (from files/ dir) |
| `file.link` | `from`, `to` | `walk_dir`, `source`, `target` | Create symlink (from files/ dir) |
| `file.download` | `from`/`source`, `to`/`target` | `owned_by_user`, `owned_by_group` | Download file from URL |
| `file.remove` | `target` | - | Remove a file |
| `file.chown` | `path`, `user`, `group` | - | Change file ownership |
| `file.unarchive` | `from`, `to` | `force` | Extract tar.gz archive |
| `directory.copy` | `from`, `to` | - | Copy directory (from files/ dir) |

**Note:** `file.link`, `file.copy`, and `directory.copy` require source files to be in a `files/` subdirectory.

## Command Actions

| Action | Required Params | Optional Params | Description |
|--------|----------------|-----------------|-------------|
| `command.run` (or `cmd.run`) | `command` | `args`, `dir`, `privileged`, `env` | Execute shell command |

## Package Actions

| Action | Required Params | Optional Params | Description |
|--------|----------------|-----------------|-------------|
| `package.install` | `name` OR `list` | `provider`, `repository`, `file` | Install package(s) |
| `package.repository` | `name` (url alias) | `key`, `provider` | Add package repository |

**Supported Providers:** `pacman`, `yay`, `paru`, `apt`, `pkg`, `pkgin`, `brew`, `winget`, `xbps`, `zypper`, `macports`, `dnf`, `snapcraft`

## Git Actions

| Action | Required Params | Optional Params | Description |
|--------|----------------|-----------------|-------------|
| `git.clone` | `repo_url`, `directory` | - | Clone git repository (v0.9.1+) |

**Note:** Git actions were removed in v0.8.8 and restored in v0.9.1 with breaking changes.

## User & Group Actions

| Action | Required Params | Optional Params | Description |
|--------|----------------|-----------------|-------------|
| `user.add` | `fullname`, `home_dir`, `username` | `shell`, `group` | Add system user |
| `user.group` | `username`, `group` | - | Add user to group(s) |
| `group.add` | `group_name` | - | Create system group |

## Binary Actions

| Action | Required Params | Optional Params | Description |
|--------|----------------|-----------------|-------------|
| `binary.github` | `name`, `directory`, `repository`, `version` | - | Download binary from GitHub release |

## macOS Actions

| Action | Required Params | Optional Params | Description |
|--------|----------------|-----------------|-------------|
| `macos.default` | `domain`, `key`, `kind`, `value` | - | Set macOS defaults (system preferences) |

**Supported `kind` values:** `string`, `bool`, `int`

## Common Optional Parameters

These work across multiple actions:

| Parameter | Type | Description |
|-----------|------|-------------|
| `description` | string | Human-readable action description |
| `depends_on` | list | Action IDs to wait for |
| `where` | condition | OS/variant conditional (e.g., `os.name == "linux"`) |

## Context Variables

Available for templating with `{{ variable }}`:

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `{{ user.home_dir }}` | `/home/zenobius` | User home directory |
| `{{ user.config_dir }}` | `/home/zenobius/.config` | User config directory |
| `{{ user.username }}` | `zenobius` | Current username |
| `{{ os.name }}` | `linux`, `macos`, `windows` | Operating system |

## Quick Examples

### Symlink config file
```yaml
- action: file.link
  from: nvim/init.lua
  to: ~/.config/nvim/init.lua
```

### Install packages conditionally
```yaml
- action: package.install
  name: neovim
  variants:
    - where: os.name == "linux"
      provider: apt
    - where: os.name == "macos"
      provider: brew
```

### Run command with environment
```yaml
- action: command.run
  command: go
  args: ["env"]
  env:
    GOBIN: /usr/local/go/bin
```

### Clone repository
```yaml
- action: git.clone
  repo_url: https://github.com/user/dotfiles
  directory: ~/dotfiles
```

## Validation Workflow

**Always validate before applying:**

```bash
# 1. Syntax validation
comtrya validate manifest.yml

# 2. Dry-run
comtrya apply --dry-run --manifest manifest.yml

# 3. Apply
comtrya apply --manifest manifest.yml
```
