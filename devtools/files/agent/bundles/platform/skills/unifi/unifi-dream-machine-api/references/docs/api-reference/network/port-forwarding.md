# Port Forwarding

**Category:** Security

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/rest/portforward`

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
      "_id": "691f8c7d5644140db67348ab",
      "name": "Web Server",
      "enabled": true,
      "src": "any",
      "dst_port": "80",
      "fwd": "192.168.1.100",
      "fwd_port": "80",
      "proto": "tcp_udp",
      "log": false,
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Alternative endpoint: `/list/portforward` (same response)
- Returns all configured port forwarding rules (NAT)

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Unique port forward ID |
| `name` | string | Rule name/description |
| `enabled` | boolean | Rule enabled |
| `src` | string | Source: `any` or specific IP/CIDR |
| `dst_port` | string | External port (WAN side) |
| `fwd` | string | Internal IP address to forward to |
| `fwd_port` | string | Internal port (LAN side) |
| `proto` | string | Protocol: `tcp`, `udp`, `tcp_udp` |
| `log` | boolean | Enable logging |
| `site_id` | string | Site ID |


#### Method: `get`

**HTTP Method:** GET

**Endpoint:** `/rest/portforward/{portforward_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `portforward_id` (path, required): Port forward rule ID

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f8c7d5644140db67348ab",
      "name": "Web Server",
      "enabled": true,
      "src": "any",
      "dst_port": "80",
      "fwd": "192.168.1.100",
      "fwd_port": "80",
      "proto": "tcp_udp",
      "log": false,
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Returns single port forwarding rule by ID


#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with port forwarding configuration

**Required Fields:**
- `name` (string): Rule name/description
- `enabled` (boolean): Enable/disable rule
- `src` (string): Source IP or "any"
- `dst_port` (string): External port
- `fwd` (string): Internal IP address
- `fwd_port` (string): Internal port
- `proto` (string): Protocol

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
      "_id": "691f8c7d5644140db67348ab",
      "name": "Web Server",
      "enabled": true,
      "src": "any",
      "dst_port": "80",
      "fwd": "192.168.1.100",
      "fwd_port": "80",
      "proto": "tcp_udp",
      "log": false,
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**


#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/rest/portforward/{portforward_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `portforward_id` (path, required): Port forward rule ID to update
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f8c7d5644140db67348ab",
      "name": "Web Server",
      "enabled": true,
      "src": "any",
      "dst_port": "80",
      "fwd": "192.168.1.100",
      "fwd_port": "80",
      "proto": "tcp_udp",
      "log": false,
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

**Endpoint:** `/rest/portforward/{portforward_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `portforward_id` (path, required): Port forward rule ID to delete

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

## Protocols

| Protocol | Description |
|----------|-------------|
| `tcp` | TCP only |
| `udp` | UDP only |
| `tcp_udp` | Both TCP and UDP |

---
