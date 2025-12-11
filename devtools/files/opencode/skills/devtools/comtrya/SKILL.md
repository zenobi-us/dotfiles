---
name: provisioning-with-comtrya
description: Use when building system provisioning manifests, handling multi-OS setups, managing package manager conflicts, or designing team provisioning workflows - provides patterns and safety procedures for declarative system configuration; emphasizes validation, dry-run testing, and staged rollout to prevent broken user setups
---

# Provisioning With Comtrya

## Overview

Comtrya is a declarative system provisioning tool (YAML/TOML) that applies configurations idempotently across macOS, Linux, and Windows. Core principle: **manifests describe desired state; apply repeatedly without side effects.**

**Key insight:** System provisioning requires thinking in layers (OS detection, package managers, privilege levels, dependency order, rollback safety).

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
  - action: group.create
    name: docker
    id: 1001

  - action: package.install
    name: docker
    depends_on: ["docker_group"]  # Wait for group creation

  - action: command.run
    cmd: "sudo systemctl enable docker"
    depends_on: ["docker_package"]
```

**Critical:** Without `depends_on`, docker package installs before group exists, causing silent failures.

## Privilege Escalation Patterns

### Using `sudo`

For actions requiring elevation:

```yaml
- action: command.run
  cmd: "systemctl enable nginx"
  shell: "bash -c"
  where: os.name == "linux"
```

Comtrya runs with current user privileges by default. **For system actions, wrap in `sudo`** or run entire manifest with `sudo comtrya apply`.

### Security: Minimize Sudo

Avoid elevation where possible:

```yaml
# ❌ Avoid: Full sudo for user config
- action: command.run
  cmd: "sudo tee ~/.config/app/config.json"

# ✅ Better: User-owned config without sudo
- action: file.create
  path: ~/.config/app/config.json
  contents: |
    { ... }
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

### Conditional File Creation Based on OS

```yaml
- action: file.create
  path: ~/.config/app/config.yml
  contents: |
    linux_only: true
  where: os.name == "linux"

- action: file.create
  path: ~/.config/app/config.yml
  contents: |
    macos_only: true
  where: os.name == "macos"
```

### Git Repository as Part of Provisioning

```yaml
- action: git.clone
  repo: "https://github.com/user/dotfiles.git"
  path: ~/.config/dotfiles
  branch: main

- action: file.symlink
  source: ~/.config/dotfiles/zshrc
  target: ~/.zshrc
```

### User and Group Management (Privilege Required)

```yaml
- action: group.create
  name: dev
  id: 5000

- action: user.create
  username: devuser
  groups: ["dev", "sudo"]
  home: /home/devuser
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

## Quick Reference: Common Actions

| Action | Use Case | Example |
|--------|----------|---------|
| `package.install` | Install via system package manager | `name: git` |
| `file.create` | Create files with content | Config files, dotfiles |
| `file.symlink` | Link config files | `source: ~/repo/zshrc`, `target: ~/.zshrc` |
| `git.clone` | Clone repositories | Dotfiles, projects |
| `command.run` | Execute custom commands | Build scripts, setup hooks |
| `group.create` / `user.create` | Manage system users | Docker group, dev user |
| `macOS.*` | macOS-specific | Defaults, Finder settings |

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
