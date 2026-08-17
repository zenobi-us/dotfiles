# System Commands

**Category:** System

[← Back to API Reference](../README.md)

---

## Overview

Execute system-level commands on the controller (upgrade, reboot).

**Base Paths:**
- System Commands: `/proxy/network/api/s/{site}/cmd/system`
- Firmware Check: `/proxy/network/api/s/{site}/stat/fwupdate/latest-version`
- Controller Status: `/proxy/network/api/s/{site}/stat/status`

**Authentication:** `X-Api-Key` header required

---

## Methods

### Check Firmware Updates

#### Method: `check_updates`

**HTTP Method:** GET

**Endpoint:** `/stat/fwupdate/latest-version`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication

**Example Request:**
```bash
curl -X GET "https://192.168.1.1/proxy/network/api/s/default/stat/fwupdate/latest-version" \
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
      "latest": "7.2.97",
      "download_link": "https://fw-download.ubnt.com/data/unifi-controller/...",
      "has_upgradable_controller": false
    }
  ]
}
```

---

### Upgrade Controller

#### Method: `upgrade`

**HTTP Method:** POST

**Endpoint:** `/cmd/system`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with command

**Required Fields:**
- `cmd` (string): Command (`upgrade`)

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/cmd/system" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
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
- ⚠️ **WARNING:** Controller will restart during upgrade
- Network will remain operational during upgrade
- Backup configuration before upgrading
- Upgrade to latest available firmware version

---

### Reboot Controller

#### Method: `reboot`

**HTTP Method:** POST

**Endpoint:** `/cmd/system`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with command

**Required Fields:**
- `cmd` (string): Command (`reboot`)

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/cmd/system" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "cmd": "reboot"
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
- ⚠️ **WARNING:** Controller will be unavailable during reboot
- Network devices will continue operating
- Management interface will be unavailable for 2-5 minutes
- Use only when necessary (troubleshooting, after configuration changes)

---

### Get Controller Status

#### Method: `status`

**HTTP Method:** GET

**Endpoint:** `/stat/status`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication

**Example Request:**
```bash
curl -X GET "https://192.168.1.1/proxy/network/api/s/default/stat/status" \
  -H "X-Api-Key: YOUR_API_KEY"
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

## Safety Guidelines

1. **Backup First:** Always create a backup before system commands
2. **Maintenance Window:** Schedule upgrades/reboots during low-traffic periods
3. **Monitor Status:** Check controller status after operations
4. **Plan Downtime:** Inform users of planned maintenance
5. **Test Environment:** Test upgrades in non-production environment first

