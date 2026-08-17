# QoS Rules

**Category:** Network

[← Back to API Reference](../README.md)

---

## Overview

Manage Quality of Service (QoS) rules to prioritize network traffic.

**Base Path:** `/proxy/network/v2/api/site/{site}/qos-rules`

**Authentication:** `X-Api-Key` header required

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | QoS rule ID |
| `name` | String | Rule name |
| `enabled` | Boolean | Rule enabled status |
| `description` | String | Rule description |
| `network_id` | String | Network ID to apply rule to |
| `matching_target` | String | Match target type (`INTERNET`, `DOMAIN`, `IP`, `PORT`) |
| `target_devices` | Array | List of device/client selectors |
| `domains` | Array | Domain names (if `matching_target` is `DOMAIN`) |
| `ip_addresses` | Array | IP addresses/CIDRs (if `matching_target` is `IP`) |
| `port_ranges` | Array | Port ranges (if `matching_target` is `PORT`) |
| `protocol` | String | Protocol (`tcp`, `udp`, `all`) |
| `download_limit_kbps` | Integer | Download bandwidth limit in Kbps |
| `upload_limit_kbps` | Integer | Upload bandwidth limit in Kbps |
| `dscp_value` | Integer | DSCP value to set (0-63) |
| `site_id` | String | Site ID |

---

## Methods

### List QoS Rules

#### Method: `list`

**HTTP Method:** GET

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication

**Example Request:**
```bash
curl -X GET "https://192.168.1.1/proxy/network/v2/api/site/default/qos-rules" \
  -H "X-Api-Key: YOUR_API_KEY"
```

**Response:**
```json
[]
```

**Notes:**
- The V2 API returns a bare JSON array (no `meta`/`data` envelope)
- An empty array is returned when no QoS rules are configured

---

### Create QoS Rule

#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with QoS rule configuration

**Required Fields:**
- `name` (string): Rule name
- `enabled` (boolean): Enable/disable rule
- `network_id` (string): Network ID to apply rule to
- `matching_target` (string): Match target (`INTERNET`, `DOMAIN`, `IP`, `PORT`)

**Optional Fields:**
- `description` (string): Rule description
- `target_devices` (array): Device/client selectors
- `domains` (array): Domain names (required if `matching_target` is `DOMAIN`)
- `ip_addresses` (array): IP addresses/CIDRs (required if `matching_target` is `IP`)
- `port_ranges` (array): Port ranges (required if `matching_target` is `PORT`)
- `protocol` (string): Protocol (`tcp`, `udp`, `all`)
- `download_limit_kbps` (integer): Download bandwidth limit in Kbps
- `upload_limit_kbps` (integer): Upload bandwidth limit in Kbps
- `dscp_value` (integer): DSCP value (0-63)

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/v2/api/site/default/qos-rules" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Video Streaming",
    "enabled": true,
    "network_id": "507f191e810c19729de860ea",
    "matching_target": "DOMAIN",
    "domains": ["netflix.com", "youtube.com"],
    "dscp_value": 34
  }'
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Video Streaming",
    "enabled": true,
    "network_id": "507f191e810c19729de860ea",
    "matching_target": "DOMAIN",
    "domains": ["netflix.com", "youtube.com"],
    "dscp_value": 34,
    "site_id": "507f191e810c19729de860ea"
  }
]
```

---

### Update QoS Rule

#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/qos-rules/{rule_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `rule_id` (path, required): QoS rule ID to update
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Gaming Priority",
    "enabled": true,
    "description": "Prioritize gaming traffic",
    "network_id": "507f191e810c19729de860ea",
    "matching_target": "PORT",
    "port_ranges": ["3074-3075", "27015-27030"],
    "protocol": "udp",
    "dscp_value": 46,
    "site_id": "507f191e810c19729de860ea"
  }
]
```

---

### Delete QoS Rule

#### Method: `delete`

**HTTP Method:** DELETE

**Endpoint:** `/qos-rules/{rule_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `rule_id` (path, required): QoS rule ID to delete

**Example Request:**
```bash
curl -X DELETE "https://192.168.1.1/proxy/network/v2/api/site/default/qos-rules/507f1f77bcf86cd799439011" \
  -H "X-Api-Key: YOUR_API_KEY"
```

**Response:**
```json
[]
```

