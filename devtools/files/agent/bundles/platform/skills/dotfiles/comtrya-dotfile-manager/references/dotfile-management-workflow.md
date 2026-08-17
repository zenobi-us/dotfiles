# Onboarding New Config Files to Comtrya Management

Purpose: bring an **unmanaged** local config file under repo + comtrya symlink control.

## Scope

Use this when file currently exists only in `$HOME` (or system path) and is not yet represented in this repo/manifests.

## Required Process

1. **Identify owner module (MUST)**
   - Pick module by domain (`windowmanagers`, `shells`, `devtools`, etc.).
   - Do not create duplicate manifests for same concern.

2. **Create repo destination (MUST)**
   - Put source under `<module>/files/<app-or-dir>/...`
   - Example: `windowmanagers/files/niri/config.kdl`

3. **Copy current live config into repo (MUST)**
   - Preserve existing behavior first; do not refactor during onboarding.

4. **Create or update manifest (MUST)**
   - File: `<module>/<app>.yml` (or existing module manifest)
   - Add cleanup + link actions (remove target before linking):

```yaml
---
actions:
  - action: command.run
    where: os.name == "linux"
    command: rm
    args:
      - -rf
      - "{{user.home_dir}}/.config/niri"

  - action: file.link
    where: os.name == "linux"
    from: niri
    to: "{{user.home_dir}}/.config/niri"
```

5. **Preflight checks (MUST)**
   - Confirm `from` path resolves relative to `<module>/files/`
   - Confirm `to` path is correct target in home/system
   - Check for collisions with existing links/actions
   - Confirm cleanup action removes only intended target path

6. **Dry-run apply (MUST)**
   - `comtrya -d . apply -m <module> --dry-run`
   - If output unexpected: stop and fix manifest/pathing.

7. **Apply (MUST)**
   - `comtrya -d . apply -m <module>`

8. **Verify managed state (MUST)**
   - Target path exists
   - Target is symlink
   - Symlink points to repo file under `<module>/files/...`

9. **Regression check (SHOULD)**
   - Launch app/component and verify behavior unchanged.

## Anti-Patterns

- Editing local file in `~/.config/...` after onboarding (bypasses source of truth)
- Mixing onboarding + large refactor in one step
- Skipping dry-run
- Using wrong `from` root (not under `files/`)

## Day-2 Update Rule

After onboarding, edit only repo copy under `*/files/...`, then re-apply module.

## State Flow

```text
[unmanaged local file]
  -> [copied into repo files/]
  -> [manifest link declared]
  -> [dry-run clean]
  -> [apply]
  -> [symlink verified]
  -> [managed]
```
