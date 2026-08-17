# Device Commands

**Category:** System

[← Back to API Reference](../README.md)

---

## Overview

Execute commands on UniFi devices (reboot, adopt, upgrade, rename).

**Base Paths:**
- Device Commands: `/proxy/network/api/s/{site}/cmd/devmgr`
- Device Update: `/proxy/network/api/s/{site}/rest/device/{device_id}`

**Authentication:** `X-Api-Key` header required

---

## Methods

### Reboot Device

#### Method: `reboot`

**HTTP Method:** POST

**Endpoint:** `/cmd/devmgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with command

**Required Fields:**
- `mac` (string): Device MAC address
- `cmd` (string): Command (`restart`)

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/cmd/devmgr" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mac": "aa:bb:cc:dd:ee:ff",
    "cmd": "restart"
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

### Adopt Device

#### Method: `adopt`

**HTTP Method:** POST

**Endpoint:** `/cmd/devmgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with command

**Required Fields:**
- `mac` (string): Device MAC address
- `cmd` (string): Command (`adopt`)

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/cmd/devmgr" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mac": "aa:bb:cc:dd:ee:ff",
    "cmd": "adopt"
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
- Device must be in "pending adoption" state
- Device must be on the same network as the controller

---

### Upgrade Device Firmware

#### Method: `upgrade`

**HTTP Method:** POST

**Endpoint:** `/cmd/devmgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with command

**Required Fields:**
- `mac` (string): Device MAC address
- `cmd` (string): Command (`upgrade`)

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/cmd/devmgr" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mac": "aa:bb:cc:dd:ee:ff",
    "cmd": "upgrade"
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
- Upgrades device to latest available firmware
- Device will reboot during upgrade process

---

### Rename Device

#### Method: `rename`

**HTTP Method:** PUT

**Endpoint:** `/rest/device/{device_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `device_id` (path, required): Device ID (not MAC address)
- Request body: JSON object with new name

**Required Fields:**
- `name` (string): New device name

**Example Request:**
```bash
curl -X PUT "https://192.168.1.1/proxy/network/api/s/default/rest/device/507f1f77bcf86cd799439011" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Living Room AP"
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
- Requires device `_id`, not MAC address
- Get device ID from `/stat/device` endpoint

