# IP Groups

**Category:** Security

[← Back to API Reference](../README.md)

---

## Overview

Manage IP address groups for use in firewall rules and policies.

**Base Path:** `/proxy/network/v2/api/site/{site}/ip-groups`

**Authentication:** `X-Api-Key` header required

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | IP group ID |
| `name` | String | Group name |
| `description` | String | Group description |
| `ip_addresses` | Array | List of IP addresses/CIDRs in the group |
| `site_id` | String | Site ID |

---

## Methods

### List IP Groups

#### Method: `list`

**HTTP Method:** GET

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication

**Example Request:**
```bash
curl -X GET "https://192.168.1.1/proxy/network/v2/api/site/default/ip-groups" \
  -H "X-Api-Key: YOUR_API_KEY"
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Trusted IPs",
    "description": "Trusted IP addresses",
    "ip_addresses": [
      "192.168.1.100",
      "192.168.1.101",
      "10.0.0.0/24"
    ],
    "site_id": "507f191e810c19729de860ea"
  }
]
```

---

**Note:** This endpoint currently supports read-only operations via the V2 API. Create, update, and delete operations may be available through the V1 REST API `/rest/firewallgroup` endpoint.

