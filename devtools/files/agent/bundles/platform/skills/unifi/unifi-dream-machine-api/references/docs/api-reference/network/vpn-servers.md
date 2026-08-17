# VPN Servers

**Category:** Network

[← Back to API Reference](../README.md)

---

## Overview

Manage VPN server configurations (L2TP, PPTP, OpenVPN, WireGuard).

**Base Path:** `/proxy/network/api/s/{site}/rest/vpnserver`

**Authentication:** `X-Api-Key` header required

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | VPN server ID |
| `name` | String | VPN server name |
| `enabled` | Boolean | Server enabled status |
| `type` | String | VPN type (`l2tp`, `pptp`, `openvpn`, `wireguard`) |
| `port` | Integer | VPN server port |
| `network` | String | VPN network subnet (e.g., `192.168.255.0/24`) |
| `dns` | Array | DNS servers for VPN clients |
| `encryption` | String | Encryption type |
| `auth` | String | Authentication method |
| `site_id` | String | Site ID |

---

## Methods

### List VPN Servers

#### Method: `list`

**HTTP Method:** GET

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication

**Example Request:**
```bash
curl -X GET "https://192.168.1.1/proxy/network/api/s/default/rest/vpnserver" \
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
      "name": "Remote Access VPN",
      "enabled": true,
      "type": "openvpn",
      "port": 1194,
      "network": "192.168.255.0/24",
      "site_id": "507f191e810c19729de860ea"
    }
  ]
}
```

---

### Update VPN Server

#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/rest/vpnserver/{server_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `server_id` (path, required): VPN server ID to update
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Example Request:**
```bash
curl -X PUT "https://192.168.1.1/proxy/network/api/s/default/rest/vpnserver/507f1f77bcf86cd799439011" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "507f1f77bcf86cd799439011",
    "enabled": false
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
      "name": "Remote Access VPN",
      "enabled": false,
      "type": "openvpn",
      "port": 1194,
      "network": "192.168.255.0/24",
      "site_id": "507f191e810c19729de860ea"
    }
  ]
}
```

**Notes:**
- Must include `_id` field in request body
- Common use case: Enable/disable VPN server

