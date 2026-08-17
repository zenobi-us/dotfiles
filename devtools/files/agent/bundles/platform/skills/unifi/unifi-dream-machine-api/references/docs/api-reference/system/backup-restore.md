# Backup & Restore

**Category:** System

[← Back to API Reference](../README.md)

---

## Overview

Create and restore controller backups.

**Base Paths:**
- Backup: `/proxy/network/api/s/{site}/cmd/backup`
- Restore: `/proxy/network/api/s/{site}/cmd/restore`

**Authentication:** `X-Api-Key` header required

---

## Methods

### Create Backup

#### Method: `create`

**HTTP Method:** POST

**Endpoint:** `/cmd/backup`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with command

**Required Fields:**
- `cmd` (string): Command (`backup`)

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/cmd/backup" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "cmd": "backup"
  }' \
  --output backup.unf
```

**Response:**
```text
Binary backup file (`.unf` format), returned as application/octet-stream.
Save the response body directly to a file — it is not JSON.
```

**Notes:**
- Save the response as a `.unf` file
- Backup includes all site configuration
- Does not include historical statistics

---

### Restore Backup

#### Method: `restore`

**HTTP Method:** POST

**Endpoint:** `/cmd/restore`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: Multipart form data with backup file

**Required Fields:**
- `file` (file): Backup file (`.unf` format)

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/cmd/restore" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -F "file=@backup.unf"
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
- ⚠️ **WARNING:** This will overwrite current configuration
- Controller will restart after restore
- All current settings will be replaced with backup
- Backup your current configuration before restoring

---

## Best Practices

1. **Regular Backups:** Create backups before making major configuration changes
2. **Version Control:** Keep multiple backup versions with timestamps
3. **Test Restores:** Verify backups can be restored in a test environment
4. **Secure Storage:** Store backups in a secure location separate from the controller
5. **Pre-Upgrade:** Always backup before firmware upgrades

