# Firewall Groups

**Category:** Security

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/rest/firewallgroup`

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
      "_id": "691f8b5a5644140db6734789",
      "name": "IoT Devices",
      "group_type": "address-group",
      "group_members": [
        "192.168.10.10",
        "192.168.10.11",
        "192.168.10.0/24"
      ],
      "site_id": "691f5ca15644140db673108c"
    },
    {
      "_id": "691f8b6c5644140db673478a",
      "name": "Web Ports",
      "group_type": "port-group",
      "group_members": [
        "80",
        "443",
        "8080"
      ],
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Alternative endpoint: `/list/firewallgroup` (same response)
- Returns all configured firewall groups (address groups and port groups)

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Unique group ID |
| `name` | string | Group name |
| `group_type` | string | Type: `address-group`, `port-group`, `ipv6-address-group` |
| `group_members` | array | List of IPs, CIDRs, or ports |
| `site_id` | string | Site ID |


#### Method: `get`

**HTTP Method:** GET

**Endpoint:** `/rest/firewallgroup/{group_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `group_id` (path, required): Firewall group ID

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f8b5a5644140db6734789",
      "name": "IoT Devices",
      "group_type": "address-group",
      "group_members": [
        "192.168.10.10",
        "192.168.10.11",
        "192.168.10.0/24"
      ],
      "site_id": "691f5ca15644140db673108c"
    },
    {
      "_id": "691f8b6c5644140db673478a",
      "name": "Web Ports",
      "group_type": "port-group",
      "group_members": [
        "80",
        "443",
        "8080"
      ],
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Returns single firewall group by ID


#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with firewall group configuration

**Required Fields:**
- `name` (string): Group name
- `group_type` (string): Group type
- `group_members` (array): List of members

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
      "_id": "691f8b5a5644140db6734789",
      "name": "IoT Devices",
      "group_type": "address-group",
      "group_members": [
        "192.168.10.10",
        "192.168.10.11",
        "192.168.10.0/24"
      ],
      "site_id": "691f5ca15644140db673108c"
    },
    {
      "_id": "691f8b6c5644140db673478a",
      "name": "Web Ports",
      "group_type": "port-group",
      "group_members": [
        "80",
        "443",
        "8080"
      ],
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Creates new firewall group (address or port group)


#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/rest/firewallgroup/{group_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `group_id` (path, required): Firewall group ID to update
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f8b5a5644140db6734789",
      "name": "IoT Devices",
      "group_type": "address-group",
      "group_members": [
        "192.168.10.10",
        "192.168.10.11",
        "192.168.10.0/24"
      ],
      "site_id": "691f5ca15644140db673108c"
    },
    {
      "_id": "691f8b6c5644140db673478a",
      "name": "Web Ports",
      "group_type": "port-group",
      "group_members": [
        "80",
        "443",
        "8080"
      ],
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

**Endpoint:** `/rest/firewallgroup/{group_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `group_id` (path, required): Firewall group ID to delete

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

## Group Types

| Type | Description | Member Format |
|------|-------------|---------------|
| `address-group` | IPv4 addresses/ranges | IP addresses, CIDR notation |
| `ipv6-address-group` | IPv6 addresses/ranges | IPv6 addresses, CIDR notation |
| `port-group` | Port numbers | Port numbers, port ranges (e.g., `8000-9000`) |

---

## Usage in Firewall Rules

Firewall groups can be referenced in firewall rules using:
- `src_firewallgroup_ids` - Source address/port groups
- `dst_firewallgroup_ids` - Destination address/port groups

---
