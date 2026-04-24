---
name: homeassistant-router
description: Route Home Assistant tasks to CLI ops, bulk ops, or automation best-practices skills, when request scope is ambiguous, resulting in correct workflow selection before execution.
---

# Home Assistant Skill Router

Use this skill first when a task involves Home Assistant and the correct workflow is unclear.

## Routing Rules

### Use `home-assistant-cli-ops` when
- You need interactive runtime operations via `hass-cli`
- You are inspecting state, calling services, watching events, or doing small scoped changes
- You need quick remote operations from terminal

Path:
- `ai/files/packages/platform/skills/homeassistant/home-assistant-cli-ops/SKILL.md`

### Use `homeassistant-ops` when
- You need scripted, repeatable, bulk operations
- You need plan → apply → validate with rollback/snapshots
- You are performing higher-risk multi-entity changes

Path:
- `ai/files/packages/platform/skills/homeassistant/homeassistant-ops/SKILL.md`

### Use `home-assistant-best-practices` when
- You are creating/editing automations, scripts, helpers, scenes
- You need guidance on native HA constructs vs templates
- You are refactoring config and need reference-safety workflow

Path:
- `ai/files/packages/platform/skills/homeassistant/home-assistant-best-practices/SKILL.md`

## Decision Flow

```text
[HA task arrives]
       |
       v
[Need YAML/automation design?]--yes-->[home-assistant-best-practices]
       | no
       v
[Need bulk scripted rollback-safe changes?]--yes-->[homeassistant-ops]
       | no
       v
[Interactive remote CLI operations]--------->[home-assistant-cli-ops]
```

## Priority Rule

If multiple skills seem relevant:
1. Start with `home-assistant-best-practices` for design/refactor safety constraints.
2. Then choose execution path:
   - `homeassistant-ops` for scripted bulk/high-risk execution
   - `home-assistant-cli-ops` for interactive runtime execution
