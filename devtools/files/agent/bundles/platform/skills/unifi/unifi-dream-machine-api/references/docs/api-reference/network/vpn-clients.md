# VPN Clients

**Category:** Network

[← Back to API Reference](../README.md)

---

## Overview

Manage VPN client connections and generate VPN profiles.

**Base Paths:**
- VPN Client Status: `/proxy/network/api/s/{site}/stat/vpn`
- VPN Client Config: `/proxy/network/api/s/{site}/rest/vpnclient`
- VPN Profile Generation: `/proxy/network/api/s/{site}/rest/vpnprofile`

**Authentication:** `X-Api-Key` header required

---

## Response Fields

### VPN Client Status

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | VPN client connection ID |
| `name` | String | Client name |
| `user_name` | String | VPN username |
| `remote_ip` | String | Client's remote IP address |
| `vpn_ip` | String | Assigned VPN IP address |
| `rx_bytes` | Integer | Bytes received |
| `tx_bytes` | Integer | Bytes transmitted |
| `uptime` | Integer | Connection uptime in seconds |
| `site_id` | String | Site ID |

### VPN Client Configuration

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | VPN client config ID |
| `name` | String | Client configuration name |
| `enabled` | Boolean | Client enabled status |
| `server_id` | String | VPN server ID |
| `site_id` | String | Site ID |

---

## Methods

### List Active VPN Clients

#### Method: `list_active`

**HTTP Method:** GET

**Endpoint:** `/stat/vpn`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication

**Example Request:**
```bash
curl -X GET "https://192.168.1.1/proxy/network/api/s/default/stat/vpn" \
  -H "X-Api-Key: YOUR_API_KEY"
```

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Example Laptop",
      "user_name": "vpnuser",
      "remote_ip": "203.0.113.45",
      "vpn_ip": "192.168.255.10",
      "rx_bytes": 1048576,
      "tx_bytes": 524288,
      "uptime": 3600,
      "site_id": "507f191e810c19729de860ea"
    }
  ]
}
```

---

### Update VPN Client Configuration

#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/rest/vpnclient/{client_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `client_id` (path, required): VPN client config ID to update
- Request body: JSON object with fields to update

**Example Request:**
```bash
curl -X PUT "https://192.168.1.1/proxy/network/api/s/default/rest/vpnclient/507f1f77bcf86cd799439011" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "507f1f77bcf86cd799439011",
    "enabled": true
  }'
```

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "enabled": true
    }
  ]
}
```

---

### Generate VPN Profile

#### Method: `generate_profile`

**HTTP Method:** POST

**Endpoint:** `/rest/vpnprofile`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with profile configuration

**Required Fields:**
- `name` (string): Client profile name
- `server_id` (string): VPN server ID

**Optional Fields:**
- `exp` (integer): Expiration in days (default: 365)

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/rest/vpnprofile" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "johns-laptop",
    "server_id": "507f1f77bcf86cd799439011",
    "exp": 365
  }'
```

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "configuration": "<generated OpenVPN/WireGuard profile file content>"
    }
  ]
}
```

**Notes:**
- Returns VPN configuration file content
- Use for OpenVPN or WireGuard profile generation

