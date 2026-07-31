# Routing

**Category:** Network Management

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/rest/routing`

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
      "_id": "691f8d9a5644140db67349cd",
      "name": "Route to Remote Network",
      "enabled": true,
      "static-route_network": "10.20.0.0/16",
      "static-route_nexthop": "192.168.1.254",
      "static-route_distance": 1,
      "static-route_type": "nexthop-route",
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Alternative endpoint: `/list/routing` (same response)
- Returns all configured static routes

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Unique route ID |
| `name` | string | Route name/description |
| `enabled` | boolean | Route enabled |
| `static-route_network` | string | Destination network in CIDR notation |
| `static-route_nexthop` | string | Next hop gateway IP |
| `static-route_distance` | integer | Administrative distance (1-255) |
| `static-route_type` | string | Route type: `nexthop-route`, `blackhole`, `interface-route` |
| `static-route_interface` | string | Interface name (for interface-route type) |
| `site_id` | string | Site ID |


#### Method: `get`

**HTTP Method:** GET

**Endpoint:** `/rest/routing/{route_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `route_id` (path, required): Route ID

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f8d9a5644140db67349cd",
      "name": "Route to Remote Network",
      "enabled": true,
      "static-route_network": "10.20.0.0/16",
      "static-route_nexthop": "192.168.1.254",
      "static-route_distance": 1,
      "static-route_type": "nexthop-route",
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Returns single static route by ID


#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with static route configuration

**Required Fields:**
- `name` (string): Route name/description
- `enabled` (boolean): Enable/disable route
- `static-route_network` (string): Destination network in CIDR notation
- `static-route_type` (string): Route type
- `static-route_distance` (integer): Administrative distance

**Type-Specific Fields:**
- For `nexthop-route`: `static-route_nexthop` (string)
- For `interface-route`: `static-route_interface` (string)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f8d9a5644140db67349cd",
      "name": "Route to Remote Network",
      "enabled": true,
      "static-route_network": "10.20.0.0/16",
      "static-route_nexthop": "192.168.1.254",
      "static-route_distance": 1,
      "static-route_type": "nexthop-route",
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**


#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/rest/routing/{route_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `route_id` (path, required): Route ID to update
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f8d9a5644140db67349cd",
      "name": "Route to Remote Network",
      "enabled": true,
      "static-route_network": "10.20.0.0/16",
      "static-route_nexthop": "192.168.1.254",
      "static-route_distance": 1,
      "static-route_type": "nexthop-route",
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Must include `_id` field in request body
- Only include fields to update


#### Method: `delete`

**HTTP Method:** DELETE

**Endpoint:** `/rest/routing/{route_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `route_id` (path, required): Route ID to delete

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

## Route Types

| Type | Description | Required Fields |
|------|-------------|-----------------|
| `nexthop-route` | Route via next hop gateway | `static-route_nexthop` |
| `blackhole` | Drop traffic to destination | None |
| `interface-route` | Route via specific interface | `static-route_interface` |

## Administrative Distance

Lower values have higher priority. Default is 1.

| Distance | Typical Use |
|----------|-------------|
| 1 | Primary routes |
| 10 | Backup routes |
| 50 | Low priority routes |
| 250 | Floating static routes |

---
