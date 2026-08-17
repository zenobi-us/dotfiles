# Home Assistant ops playbook

Use this as a checklist of common operations. Prefer small, reviewable changes and keep a before/after log.

## 0) Decide how to apply the change

- **Prefer API (REST/WS)** when you want validation, no restarts, and live feedback.
- **Prefer config YAML** when the thing is explicitly YAML-managed in your setup (packages, custom integrations, etc).
- **Avoid editing `.storage/*` directly** on a live instance; use the registries/flows APIs instead.

## 1) Inventory / discovery

Pick the smallest truth source that answers the question:

- **Current runtime state**: `/api/states` (REST)
- **Registries (source of truth for names/areas/disabled/hidden)**:
  - areas: `config/area_registry/list` (WS)
  - devices: `config/device_registry/list` (WS)
  - entities: `config/entity_registry/list` (WS)
- **Snapshot for diff/rollback**: run `scripts/ha_ops.js snapshot` before/after bulk changes to capture registries + key configs in one JSON file.
- **Backup audit** (good for planning changes offline):
  - `.storage/core.entity_registry`, `.storage/core.device_registry`, `.storage/core.area_registry`

Snapshot tips:

- Default output is already stable for diffs (sorted keys; registries sorted by id), so `diff -u before.json after.json` is usually enough.
- Skip noisy sections when you don’t need them (e.g., `--no-lovelace`, `--no-scenes`); avoid `--include-states` for long-lived baselines.

## 2) Naming and IDs

### Friendly names vs entity_id

- **Friendly name (UI label)**: change via `config/entity_registry/update` with `name=...`.
- **Entity ID**: change via `config/entity_registry/update` with `new_entity_id=...`.
- House style for entity ids: see `references/id_conventions.md`.

Guidelines:

- Keep a consistent convention (area prefixing is usually best for repeated device types).
- Don’t rename just to rename: aim for fewer surprises in voice control, dashboards, and automations.
- For “noisy” entities (RSSI/LQI/firmware/identify): prefer hiding/disabling over renaming.

### Ref updates (important)

Entity ID changes can break references in:

- automations, scripts, scenes, helpers, dashboards
- template sensors, trigger IDs, notify targets, etc

Make a plan to **search and update references** before applying large ID renames.

Tip: use `scripts/ha_ops.js find-references` with `--map-json` to locate old ids in automations/dashboards/backups.
Add `--json-out ha_refs.json` when you want a machine-readable report for follow-up tooling.

### Rename/migrate checklist (entity_id or helper id)

Use this whenever changing `entity_id`s (or helper ids) in bulk:

1. Snapshot baseline: `scripts/ha_ops.js snapshot` (keep the JSON).
2. Find references: `scripts/ha_ops.js find-references --needle <old>` (or `--map-json rename_map.json`).
3. Write a rename map (`old -> new`) and a timestamped change log (markdown).
4. Apply renames via WS `config/entity_registry/update` in small batches (stop if a target id already exists).
5. Update references (automations/scripts/scenes/dashboards/templates) and re-run the reference finder until clean.
6. Validate behavior: automation traces + event tail (`state_changed`, `zha_event`) for the specific entities.
7. Snapshot after and diff with baseline (fast way to confirm what actually changed).

## 3) Areas, floors, labels

Use these to reduce UI clutter and improve automation targeting:

- Assign devices/entities to an area (usually device-level, sometimes entity-level).
- Prefer areas for UI grouping and “overview” naming conventions.
- Use labels/tags when you want cross-cutting collections (e.g., “security”, “critical”, “outdoor”).

## 4) Helpers and groups (UI + maintainability)

Common helpers:

- `group` helpers (light/switch/cover): reduce dashboard clutter; make targeting easier.
- `input_boolean`, `input_select`, `input_number`, `timer`: encode state machines and modes.
- `scene`, `script`: normalize complex actions into reusable building blocks.

Notes:

- HA “group helpers” can “Hide members” so only the group shows up in Overview.
- Groups don’t speed up unicast devices; they help maintainability.

## 5) Automations, scripts, scenes

### Safe editing strategy

1. Fetch current config (API).
2. Make minimal changes (prefer surgical edits).
3. POST the full updated config back (API validates).
4. Verify behavior using traces and event tailing.

### Loop-avoidance patterns

If an automation changes entities that can re-trigger it:

- Use `this.context.id` / `trigger.to_state.context.parent_id` guards (blueprint-style).
- Use `mode` deliberately (`restart`, `queued`, `parallel`) to avoid oscillation.
- Avoid “invert/toggle” logic unless you can prove idempotence.

### Blueprints

- Blueprint **inputs aren’t templatable**; triggers need static entity lists at config-load time.
- If you want “dynamic membership”, either:
  - keep automations listing members and update the list when the group changes, or
  - change the blueprint to trigger broadly (`state_changed`) and filter membership at runtime (more overhead/complexity).

## 6) Zigbee / ZHA (when relevant)

- `zha_event` is useful for debugging, but it doesn’t imply Zigbee groupcast/binding.
- HA “group helpers” are UI/helpers; they expand into member calls and don’t make Zigbee unicast faster.
- Zigbee groupcast/binding is a separate ZHA concept and depends on device support.

## 7) Dashboards / UI compaction

- Auto-generated Overview: you mainly influence it by **hiding/disabling entities** and using helpers/groups.
- Manual dashboards: use `grid`/`tile` cards to put many covers on one row; use stacks; create “Maintenance” views for noisy entities.

### Hide vs disable (mini-guide)

- **Hide from UI**: keeps the entity available to automations/services, but reduces dashboard noise (especially auto-generated Overview). Prefer this for “member” entities of helpers/groups and for diagnostics you still want available.
- **Disable entity**: removes it from normal use (often stops the integration from setting it up). Use this only when you’re sure nothing relies on it (or it’s a duplicated/unsupported feature). Disabling can break automations/cards that reference the entity.

Rules of thumb:

- If you still want to target it in an automation/script, **hide** it (don’t disable).
- If it’s never used and you want it gone from lists/pickers (and possibly reduce polling), **disable** it.
- When in doubt, hide first; disable later after a few days of “nothing broke”.

## 8) Rollback strategy

Before risky operations:

- Keep a mapping of `old -> new` for entity names and IDs.
- Keep one markdown log per run (timestamped).
- Keep pre/post `ha_snapshot_*.json` files so you can diff and reconstruct intent later.
- To revert registry changes to a baseline snapshot: `scripts/ha_ops.js rollback <snapshot_before.json> --dry-run` then `--yes`.
- Prefer incremental changes so rollback is “undo the last run”, not “rebuild everything”.

## 9) Integrations and config entries

- Many helpers/integrations are configured via config entry flows (and sometimes require reload/restart).
- Prefer options flows over editing `.storage/*` when something is integration-owned.
- After changing options, verify entities didn’t get re-created with new ids/names.
