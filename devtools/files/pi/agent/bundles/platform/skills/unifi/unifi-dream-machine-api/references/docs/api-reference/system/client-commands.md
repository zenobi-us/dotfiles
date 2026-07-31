# Client Commands

**Category:** System

[← Back to API Reference](../README.md)

---

## Overview

Execute commands on network clients (block, unblock, kick, authorize guests, rename).

**Base Paths:**
- Client Commands: `/proxy/network/api/s/{site}/cmd/stamgr`
- Client Update: `/proxy/network/api/s/{site}/upd/user/{client_id}`

**Authentication:** `X-Api-Key` header required

---

## Methods

### Block Client

#### Method: `block`

**HTTP Method:** POST

**Endpoint:** `/cmd/stamgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with command

**Required Fields:**
- `mac` (string): Client MAC address
- `cmd` (string): Command (`block-sta`)

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/cmd/stamgr" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mac": "aa:bb:cc:dd:ee:ff",
    "cmd": "block-sta"
  }'
```

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

### Unblock Client

#### Method: `unblock`

**HTTP Method:** POST

**Endpoint:** `/cmd/stamgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with command

**Required Fields:**
- `mac` (string): Client MAC address
- `cmd` (string): Command (`unblock-sta`)

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/cmd/stamgr" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mac": "aa:bb:cc:dd:ee:ff",
    "cmd": "unblock-sta"
  }'
```

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

### Force Reconnect (Kick) Client

#### Method: `kick`

**HTTP Method:** POST

**Endpoint:** `/cmd/stamgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with command

**Required Fields:**
- `mac` (string): Client MAC address
- `cmd` (string): Command (`kick-sta`)

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/cmd/stamgr" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mac": "aa:bb:cc:dd:ee:ff",
    "cmd": "kick-sta"
  }'
```

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": []
}
```

**Notes:**
- Forces client to disconnect and reconnect
- Useful for applying new network settings

---

### Authorize Guest

#### Method: `authorize_guest`

**HTTP Method:** POST

**Endpoint:** `/cmd/stamgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with command

**Required Fields:**
- `mac` (string): Guest MAC address
- `cmd` (string): Command (`authorize-guest`)
- `minutes` (integer): Authorization duration in minutes

**Optional Fields:**
- `up` (integer): Upload bandwidth limit in Kbps
- `down` (integer): Download bandwidth limit in Kbps
- `bytes` (integer): Data quota in bytes

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/cmd/stamgr" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mac": "aa:bb:cc:dd:ee:ff",
    "cmd": "authorize-guest",
    "minutes": 1440,
    "up": 5000,
    "down": 10000
  }'
```

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

### Unauthorize Guest

#### Method: `unauthorize_guest`

**HTTP Method:** POST

**Endpoint:** `/cmd/stamgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with command

**Required Fields:**
- `mac` (string): Guest MAC address
- `cmd` (string): Command (`unauthorize-guest`)

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/cmd/stamgr" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mac": "aa:bb:cc:dd:ee:ff",
    "cmd": "unauthorize-guest"
  }'
```

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

### Rename Client

#### Method: `rename`

**HTTP Method:** PUT

**Endpoint:** `/upd/user/{client_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `client_id` (path, required): Client ID (not MAC address)
- Request body: JSON object with new name

**Required Fields:**
- `name` (string): New client name

**Example Request:**
```bash
curl -X PUT "https://192.168.1.1/proxy/network/api/s/default/upd/user/507f1f77bcf86cd799439011" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Johns Laptop"
  }'
```

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": []
}
```

**Notes:**
- Requires client `_id`, not MAC address
- Get client ID from `/stat/sta` or `/rest/user` endpoints

