---
name: home-assistant-cli-ops
description: Operate Home Assistant remotely with hass-cli, when inspecting states/entities, calling services, watching events, or using raw API endpoints, resulting in fast read-first runtime operations from the terminal.
---

# Home Assistant CLI Ops (`hass-cli`)

Use this skill for direct remote operations against a Home Assistant instance through `hass-cli`.

This skill is for interactive CLI operations.

- For scripted/bulk plan→apply→rollback workflows, use: `homeassistant-ops/SKILL.md`
- For automation and YAML design decisions, use: `home-assistant-best-practices/SKILL.md`
- If task scope is unclear, route first with: `homeassistant-router/SKILL.md`

## When to Use

Use when you need to:
- Inspect runtime state quickly (`state`, `entity`, `device`, `area`)
- Trigger or toggle behavior immediately (`service call`, `state toggle`)
- Watch events live for debugging (`event watch`)
- Use API endpoints not covered by high-level commands (`raw get/post/ws`)

Do not use this as your only tool for high-risk bulk refactors. Switch to `homeassistant-ops` for that.

## Setup

Prefer environment variables over command-line secrets:

```bash
export HASS_SERVER="http://homeassistant.local:8123"
export HASS_TOKEN="<long-lived-access-token>"
```

Your local alias is expected:

```bash
hass-cli --help
```

## Default Safety Workflow (read -> scope -> write -> verify)

1. **Read first**: `info`, `config release`, `state list`, `entity list`
2. **Scope tightly**: filter by entity/service/domain before changing anything
3. **Apply one change**: one service call / one state toggle / one assignment
4. **Verify outcome**: `state get` + `event watch <event_type>` if needed
5. **Only then batch**: repeat in small groups after first success

## Command Reference

Use the focused command guide in:

- `references/command-cheatsheet.md`

This keeps `SKILL.md` short while preserving copy-paste-ready commands for common tasks.

## Common Mistakes

- Passing tokens directly via `--token` in shell history.
- Writing first, reading later.
- Running broad `--match` operations without previewing list output.
- Treating `state edit` as persistent config management (it is runtime state manipulation).

## Command Discovery

When unsure, inspect command tree first:

```bash
hass-cli --help
hass-cli <command> --help
hass-cli <command> <subcommand> --help
```

## Related Skills

- `ai/files/packages/platform/skills/homeassistant/homeassistant-ops/SKILL.md`
- `ai/files/packages/platform/skills/homeassistant/home-assistant-best-practices/SKILL.md`

## Upstream Sources

- home-assistant-cli README.rst: https://github.com/home-assistant-ecosystem/home-assistant-cli/blob/dev/README.rst
- home-assistant-cli repository: https://github.com/home-assistant-ecosystem/home-assistant-cli
