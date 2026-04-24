# `hass-cli` Command Cheatsheet

## Contents
- Read-only inspection
- Runtime actions
- Observability and debugging
- Registry operations (areas/devices/entities)
- Raw API access
- Output shaping for pipelines

## Read-only inspection

```bash
hass-cli info
hass-cli config release
hass-cli service list
hass-cli state list light
hass-cli -o yaml state get light.kitchen
```

## Runtime actions

```bash
hass-cli service call homeassistant.toggle --arguments entity_id=light.kitchen
hass-cli state toggle light.kitchen light.hallway
hass-cli state turn_on switch.office_fan
hass-cli state turn_off switch.office_fan
```

## Observability and debugging

```bash
hass-cli event watch
hass-cli event watch state_changed
hass-cli state history --since 2h light.kitchen binary_sensor.kitchen_motion
hass-cli --sort-by last_changed state history --since 2h light.kitchen
```

## Registry operations (areas/devices/entities)

```bash
hass-cli area list
hass-cli device list
hass-cli entity list

hass-cli area create "Workshop"
hass-cli device assign Workshop --match "Workshop"
hass-cli entity assign Workshop --match "workshop"
```

## Raw API access

```bash
hass-cli raw get states
hass-cli raw post services/homeassistant/toggle --json '{"entity_id":"light.kitchen"}'
hass-cli raw ws get_config
```

## Output shaping for pipelines

```bash
hass-cli -o json state list light
hass-cli -o ndjson state list sensor
hass-cli --no-headers state list light
hass-cli --columns ENTITY=entity_id,STATE=state state list light
```
