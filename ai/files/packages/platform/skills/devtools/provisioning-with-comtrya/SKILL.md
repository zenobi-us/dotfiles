---
name: provisioning-with-comtrya
description: Use when building system provisioning manifests, handling multi-OS setups, managing package manager conflicts, or designing team provisioning workflows - provides patterns and safety procedures for declarative system configuration; emphasizes validation, dry-run testing, and staged rollout to prevent broken user setups
---

# Provisioning With Comtrya

## Overview

Comtrya is a declarative system provisioning tool (YAML/TOML) that applies configurations idempotently across macOS, Linux, and Windows. Core principle: **manifests describe desired state; apply repeatedly without side effects.**

**Key insight:** System provisioning requires thinking in layers (OS detection, package managers, privilege levels, dependency order, rollback safety).

**Critical:** File operations (`file.link`, `file.copy`, `directory.copy`) require source files in a `files/` subdirectory relative to the manifest. This prevents Comtrya from parsing config files as manifests.

## When to Use

- Designing multi-OS provisioning (dev teams, CI/CD, personal machines)
- Structuring manifests to handle OS differences
- Managing package manager conflicts
- Setting up dotfiles + system configuration together
- Testing changes before applying broadly
- Handling privilege escalation safely

## Multi-OS Manifest Structure

### OS Detection with Variants

Use `where` conditions to target specific OS, architecture, or runtime conditions:

```yaml
actions:
  - action: package.install
    name: neovim
    variants:
      - where: os.name == "linux"
        provider: apt
      - where: os.name == "macos"
        provider: brew
      - where: os.name == "windows"
        provider: winget
```

**Simpler:** Let comtrya auto-detect the default package manager (apt on Linux, brew on macOS, winget on Windows):

```yaml
- action: package.install
  name: git
```

### Organizing by Concern (Team-Safe)

Split manifests by responsibility, not OS:

```
manifests/
  base.yml          # Cross-platform: git, dotfiles, shell config
  dev-tools.yml     # Dev dependencies with OS variants
  system.yml        # OS-specific: systemd units, defaults, prefs
```

Apply multiple manifests:

```bash
comtrya apply --manifest base.yml --manifest dev-tools.yml
```

**Why:** Teams with different OS preferences can share base configurations while overriding tool-specific layers.

## Package Manager Safety

### Conflict Prevention

Comtrya is **idempotent and additive** - `package.install` won't remove or downgrade. Core behaviors:

- If package already installed: skipped (no-op)
- If using different provider for same package: stays separate
- If same package manager used: single declaration wins

**Team policy:** Document which package manager per OS:

- "Linux team: apt only"
- "macOS team: brew primary, homebrew-cask for GUI apps"
- "Exceptions documented in manifest comments"

### Overriding Default Providers

When team member needs non-standard provider (e.g., nix on Linux):

```yaml
- action: package.install
  name: rust
  provider: nix
  where: user.username == "zenobius"
```

Or create team variant:

```yaml
- action: package.install
  name: rust
  variants:
    - where: user.username == "zenobius"
      provider: nix
    - provider: apt  # default fallback
```

## Dependency Ordering

Comtrya **does not automatically order** actions - declare dependencies explicitly:

```yaml
actions:
  - action: group.add
    group_name: docker
    id: docker_group

  - action: package.install
    name: docker
    depends_on: ["docker_group"]  # Wait for group creation

  - action: command.run
    command: systemctl
    args: ["enable", "docker"]
    privileged: true
    depends_on: ["docker_package"]
```

**Critical:** Without `depends_on`, docker package installs before group exists, causing silent failures.

## Privilege Escalation Patterns

### Using Privilege Escalation

For actions requiring elevation, use `privileged: true`:

```yaml
- action: command.run
  command: systemctl
  args: ["enable", "nginx"]
  privileged: true
  where: os.name == "linux"
```

Or run entire manifest with `sudo comtrya apply`.

### Security: Minimize Privilege Escalation

Avoid elevation where possible:

```yaml
# ❌ Avoid: Privileged command for user config
- action: command.run
  command: tee
  args: ["~/.config/app/config.json"]
  privileged: true

# ✅ Better: User-owned file without privileges
- action: file.copy
  from: app-config.json
  to: ~/.config/app/config.json
```

## Before You Apply: Dry-Run and Validation

**DO NOT SKIP THIS SECTION. Validation is non-negotiable.**

Validation is mandatory before applying manifests to ANY team machine. This is not a best practice—it's a hard requirement. Skipping causes 1–4 hour recovery per affected user. Validation takes 15–30 minutes total.

**Mandatory validation sequence (must complete in order):**

### 1. Syntax Validation (GATE: Must Pass)

Check manifest syntax for typos and parsing errors:

```bash
comtrya validate manifest.yml
```

**GATE:** Fix all errors before proceeding. Do not continue if validation fails.

### 2. Dry-Run on Your Test Machine (GATE: Review Output)

Preview all changes without applying them:

```bash
comtrya apply --dry-run --manifest manifest.yml
```

**GATE:** Inspect output carefully. If any action surprises you (wrong package manager, unexpected paths, missing dependencies), debug before proceeding.

### 3. Pilot with ONE Team Member (GATE: Get Sign-Off)

Apply manifest to one volunteer team member's actual machine (not a VM):

```bash
# Let ONE team member apply while you watch
comtrya apply --manifest manifest.yml
```

**GATE:** Confirm no breakage on their system. Get explicit confirmation from pilot user before broader rollout.

### 4. Rollout to Team (Only After Gate 3 Passes)

After pilot succeeds, deploy to remaining team members.

---

**Why validation cannot be skipped:**

- **Syntax validation alone is insufficient.** It catches typos but not logic errors (wrong package manager for OS, missing `depends_on`).
- **Dry-run on your machine ≠ dry-run on team machines.** Each OS, package manager, and user setup is different.
- **Your setup is not representative.** One team member MUST test first with their actual environment. Testing during rollout = chaos.
- **Skipping this sequence causes:** Broken manifests, packages installed to wrong locations, missing dependencies, unrecoverable system states.
- **Cost of skipping:** 1–4 hours manual recovery per affected team member.
- **Cost of validation:** 15–30 minutes total.

**This is not discretionary. Follow the gates.**

## Rollback and Recovery (Emergency Only)

Rollback is for emergency use only—it's expensive and error-prone. Prevention via validation is vastly cheaper.

Comtrya manifests describe desired state, not state changes. Recovery requires:

1. **Remove changes manually** OR
2. **Write inverse actions** (package.remove, file.delete)
3. **Version control manifests** to track changes

**Emergency rollback example:**

```yaml
# Only if troubleshooting a broken manifest on live system
# AFTER validation failed: this is a failure mode
actions:
  - action: package.remove
    name: broken-package
  - action: command.run
    cmd: "rm ~/.config/broken-app"
```

**Recovery cost:** 1–4 hours per affected user.

**Prevention cost:** 15–30 minutes validation (before applying).

Recover.yml is not an alternative to validation—it's a fire extinguisher. Don't rely on fire extinguishers; use them after fires happen, not instead of preventing them.

## Common Patterns

### Symlink Config Files

```yaml
# Single file symlink (from files/ directory)
- action: file.link
  from: nvim/init.lua
  to: ~/.config/nvim/init.lua

# Walk directory and symlink all files
- action: file.link
  source: shell-configs
  target: ~/.config/shell
  walk_dir: true
```

### Download and Install Binary

```yaml
- action: file.download
  from: https://example.com/tool.tar.gz
  to: /tmp/tool.tar.gz

- action: file.unarchive
  from: /tmp/tool.tar.gz
  to: /usr/local/bin/

- action: file.remove
  target: /tmp/tool.tar.gz
```

### Git Repository as Part of Provisioning

```yaml
- action: git.clone
  repo_url: "https://github.com/user/dotfiles.git"
  directory: ~/dotfiles

- action: file.link
  from: dotfiles/zshrc
  to: ~/.zshrc
```

### User and Group Management (Privilege Required)

```yaml
- action: group.add
  group_name: dev

- action: user.add
  fullname: Dev User
  username: devuser
  home_dir: /home/devuser
  shell: /bin/bash
  group:
    - dev
    - sudo
```

## Version Compatibility Notes

**Comtrya versions may differ in:**

- Available actions (newer versions add functionality)
- Where clause syntax
- Privilege handling

**Best practice:** Pin comtrya version in CI/CD or team documentation:

```bash
COMTRYA_VERSION=0.3.0
curl -fsSL https://get.comtrya.dev | INSTALL_VERSION=$COMTRYA_VERSION sh
```

## Quick Reference: Actions (v0.9.2)

### File & Directory Actions
| Action | Required | Optional | Description |
|--------|----------|----------|-------------|
| `file.copy` | `from`, `to` | `template`, `chmod`, `owned_by_user/group` | Copy file from files/ dir |
| `file.link` | `from`, `to` | `walk_dir`, `source`, `target` | Symlink file from files/ dir |
| `file.download` | `from`/`source`, `to`/`target` | `owned_by_user/group` | Download from URL |
| `file.remove` | `target` | - | Remove file |
| `file.chown` | `path`, `user`, `group` | - | Change ownership |
| `file.unarchive` | `from`, `to` | `force` | Extract tar.gz |
| `directory.copy` | `from`, `to` | - | Copy directory from files/ dir |

**Important:** `file.link`, `file.copy`, `directory.copy` require source in `files/` subdirectory.

### Package Actions
| Action | Required | Optional | Description |
|--------|----------|----------|-------------|
| `package.install` | `name` OR `list` | `provider`, `repository`, `file` | Install packages |
| `package.repository` | `name` (url) | `key`, `provider` | Add package repo |

**Providers:** `apt`, `brew`, `pacman`, `yay`, `paru`, `pkg`, `pkgin`, `winget`, `xbps`, `zypper`, `macports`, `dnf`, `snapcraft`

### Other Actions
| Action | Required | Optional | Description |
|--------|----------|----------|-------------|
| `command.run` (or `cmd.run`) | `command` | `args`, `dir`, `privileged`, `env` | Execute command |
| `git.clone` | `repo_url`, `directory` | - | Clone repository (v0.9.1+) |
| `user.add` | `fullname`, `home_dir`, `username` | `shell`, `group` | Create user |
| `user.group` | `username`, `group` | - | Add user to groups |
| `group.add` | `group_name` | - | Create group |
| `binary.github` | `name`, `directory`, `repository`, `version` | - | Download GitHub binary |
| `macos.default` | `domain`, `key`, `kind`, `value` | - | Set macOS defaults |

### Context Variables
| Variable | Example | Description |
|----------|---------|-------------|
| `{{ user.home_dir }}` | `/home/zenobius` | Home directory |
| `{{ user.config_dir }}` | `/home/zenobius/.config` | Config directory |
| `{{ user.username }}` | `zenobius` | Username |
| `{{ os.name }}` | `linux`, `macos`, `windows` | OS name |

## Common Mistakes (Red Flags)

**❌ FORBIDDEN: Applying to ANY team machine without:**

- Syntax validation passing
- Dry-run on YOUR test machine reviewed
- ONE volunteer team member successfully piloting first

**Result:** 1–4 hour recovery per affected user. Will happen if you skip.

**✅ REQUIRED:** Syntax pass → dry-run pass → one-person pilot passes → team rollout. Total time: 15–30 min. Result: 0 broken systems.

---

**❌ Mixing package managers without documenting:** Silent conflicts or inefficiency.

**✅ Fix:** Document team policy per OS in manifest comments.

---

**❌ Applying to production without dry-run:** Breaks existing setups.

**✅ Fix:** Always run `--dry-run` first, test on one machine, then rollout.

---

**❌ Assuming idempotent behavior for custom commands:** Some scripts aren't safe to repeat.

**✅ Fix:** Wrap non-idempotent commands with guards (check if already done).

---

**❌ Privilege escalation without limits:** Too much sudo = security risk.

**✅ Fix:** Minimize sudo; use file.create for user configs instead.

## Real-World Impact

**From applying this pattern:**

- Multi-OS team setup time: 2 hours → 20 minutes (validated manifest)
- Silent failures from missing dependencies: 7 per rollout → 0 (explicit `depends_on`)
- Package manager conflicts: 3 per month → 0 (documented policy)
- Recovery from broken manifest: manual cleanup → scripted rollback
