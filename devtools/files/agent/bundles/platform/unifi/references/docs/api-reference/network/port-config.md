# Port Configuration

**Category:** Network

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/rest/portconf`

---

#### Method: `list`

**HTTP Method:** GET

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f5ce05644140db67310ac",
      "name": "All",
      "site_id": "691f5ca15644140db673108c",
      "forward": "all",
      "native_networkconf_id": "691f5ce05644140db67310a6",
      "port_security_enabled": false,
      "poe_mode": "auto"
    }
  ]
}
```

**Notes:**
- Returns switch port profile configurations
- Used for configuring switch port settings
- Alternative endpoint: `/api/s/default/list/portconf` (same response)


#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with port profile configuration

**Required Fields:**
- `name` (string): Port profile name

**Optional Fields:**
See Response Fields table above for all available configuration fields.

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f5ce05644140db67310ac",
      "name": "All",
      "site_id": "691f5ca15644140db673108c",
      "forward": "all",
      "native_networkconf_id": "691f5ce05644140db67310a6",
      "port_security_enabled": false,
      "poe_mode": "auto"
    }
  ]
}
```

**Notes:**
- Creates new switch port profile


#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/rest/portconf/{profile_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `profile_id` (path, required): Port profile ID to update
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f5ce05644140db67310ac",
      "name": "All",
      "site_id": "691f5ca15644140db673108c",
      "forward": "all",
      "native_networkconf_id": "691f5ce05644140db67310a6",
      "port_security_enabled": false,
      "poe_mode": "auto"
    }
  ]
}
```

**Notes:**
- Must include `_id` field in request body


#### Method: `delete`

**HTTP Method:** DELETE

**Endpoint:** `/rest/portconf/{profile_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `profile_id` (path, required): Port profile ID to delete

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": []
}
```

---

## Assigning a single switch port to a VLAN (per-port override)

`/rest/portconf` defines reusable **port profiles**. To pin *one physical port*
of a specific switch to a network/VLAN — without creating a profile — set a
**per-port override** on the switch device itself via `port_overrides`.

**Endpoint:** `PUT /proxy/network/api/s/default/rest/device/{device_id}`

**Auth:** `X-API-KEY` header. (Verified: the API key authorizes this classic-API
`PUT`, despite the Integration API `/integrations/v1/` returning 405 on writes.)

**Body:** the **complete** `port_overrides` array — the PUT *replaces* it, so
read the current array first (`GET .../stat/device/{mac}` → `data[0].port_overrides`),
preserve every existing entry, and add/modify the target port. A minimal entry
to place a port on a network's native (untagged) VLAN:

```json
{
  "port_overrides": [
    { "port_idx": 10, "forward": "customize", "native_networkconf_id": "<network_id>" },
    { "port_idx": 11, "forward": "customize", "native_networkconf_id": "<network_id>", "name": "server-port-11" }
  ]
}
```

- `port_idx` (int): 1-based physical port number.
- `native_networkconf_id` (string): the `_id` from
  `GET /rest/networkconf` of the target network (e.g. a VLAN-20 "Servers" network).
  A port with **no** override / no `native_networkconf_id` falls through to the
  switch's default (usually the untagged Default VLAN) — the common cause of a
  correctly-IP'd host being isolated at L2.
- `name` (string, optional): the port label shown in the UI.

**Response:** `{"meta":{"rc":"ok"}, "data":[{ ...full device incl. updated port_table... }]}`.
The switch reprovisions the port within a few seconds (brief link blip on that port only).

**Verify:** `GET .../stat/device/{mac}` → find the port in `port_table`, confirm
`native_networkconf_id` matches. Cross-check the connected client's IP subnet in
`port_table[].last_connection.ip`.

**Gotchas:**
- Preserve LAG/aggregate entries (`op_mode: "aggregate"`, `aggregate_members`) and
  any fully-specified port entries exactly — dropping them reconfigures those ports.
- `sataN`-style volatility does not apply here, but `native_networkconf_id` values
  are per-controller — always resolve them from `/rest/networkconf`, never hardcode.

---

