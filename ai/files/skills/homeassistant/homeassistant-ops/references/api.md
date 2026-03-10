# API cheat sheet

This skill prefers the official Home Assistant **REST** + **WebSocket** APIs (not SSH-ing into the host).

## Auth

- Use a **long-lived access token**.
- REST: `Authorization: Bearer $HA_TOKEN`
- WS: connect to `$HA_URL/api/websocket`, then send:
  - `{"type":"auth","access_token":"..."}` after `auth_required`

## REST endpoints used most often

- Core discovery:
  - `GET /api/config` (location name, latitude/longitude, version, etc)
  - `GET /api/services` (what services exist + schemas)
- Events list (handy when tailing):
  - `GET /api/events`
- Entity state inventory:
  - `GET /api/states`
  - `GET /api/states/<entity_id>`
- Call a service:
  - `POST /api/services/<domain>/<service>`
  - Example domain/service: `homeassistant/turn_on`, `light/turn_off`
- Automations (UI-stored YAML / `automations.yaml`):
  - `GET /api/config/automation/config/<id>`
  - `POST /api/config/automation/config/<id>` (replace full config)
- Scripts and scenes (when present in your build/version):
  - `GET /api/config/script/config/<id>` / `POST /api/config/script/config/<id>`
  - `GET /api/config/scene/config/<id>` / `POST /api/config/scene/config/<id>`
- Config entry flows (used for helper creation, e.g. `group` integration):
  - `POST /api/config/config_entries/flow` with `{"handler":"group"}`
  - Continue flow by POSTing to `/api/config/config_entries/flow/<flow_id>`
  - Update options via:
    - `POST /api/config/config_entries/options/flow` with `{"handler":"<config_entry_id>"}`
    - Continue via `/api/config/config_entries/options/flow/<flow_id>`

## WebSocket message types used most often

Registries:

- `config/area_registry/list`
- `config/device_registry/list`
- `config/entity_registry/list`
- `config/entity_registry/get` with `{"entity_id":"switch.kitchen_lights"}`
- `config/entity_registry/update` with fields like:
  - `{"entity_id":"switch.kitchen_lights","name":"Kitchen Lights"}`
  - `{"entity_id":"switch.old","new_entity_id":"switch.new"}`
  - `{"entity_id":"switch.kitchen_lights","area_id":"kitchen"}`
  - Hide from UI: `{"entity_id":"sensor.foo","hidden_by":"user"}` (unhide with `hidden_by: null`)
  - Disable: `{"entity_id":"sensor.foo","disabled_by":"user"}` (enable with `disabled_by: null`)

Events (for debugging):

- `subscribe_events` with optional `{"event_type":"state_changed"}` or `{"event_type":"zha_event"}`

## Notes / gotchas

- Friendly names shown in the UI typically come from the entity registry’s `name` override; update via `config/entity_registry/update`.
- `use_blueprint.input` is **not templatable**; blueprint triggers (e.g., `platform: state entity_id: !input ...`) require a static entity list at config-load time.
- HA “group helpers” are great for UI organization, but they don’t make Zigbee unicast faster; they just expand to member service calls.
- Dashboard editing depends on dashboard mode:
  - Auto-generated Overview is strategy-driven (not layout-editable).
  - Storage dashboards can usually be fetched/updated via Lovelace APIs; YAML dashboards are file-managed.
