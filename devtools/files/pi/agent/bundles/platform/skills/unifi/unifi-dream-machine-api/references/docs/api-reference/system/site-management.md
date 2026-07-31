# Site Management

**Category:** System

[← Back to API Reference](../README.md)

---

## Overview

Manage UniFi sites (create, update, delete, list).

**Base Paths:**
- List Sites: `/proxy/network/api/self/sites`
- Site Commands: `/proxy/network/api/s/{site}/cmd/sitemgr`

**Authentication:** `X-Api-Key` header required

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Site internal ID |
| `name` | String | Site internal name (URL-safe) |
| `desc` | String | Site display name/description |
| `role` | String | User's role on this site |
| `attr_hidden_id` | String | Hidden attribute ID |
| `attr_no_delete` | Boolean | Whether site can be deleted |

---

## Methods

### List Sites

#### Method: `list`

**HTTP Method:** GET

**Endpoint:** `/api/self/sites`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication

**Example Request:**
```bash
curl -X GET "https://192.168.1.1/proxy/network/api/self/sites" \
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
      "_id": "691f5ca15644140db673108c",
      "name": "default",
      "desc": "Default",
      "attr_hidden_id": "default",
      "attr_no_delete": true,
      "role": "admin",
      "role_hotspot": false,
      "device_count": 7
    }
  ]
}
```

---

### Create Site

#### Method: `create`

**HTTP Method:** POST

**Endpoint:** `/cmd/sitemgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with site configuration

**Required Fields:**
- `cmd` (string): Command (`add-site`)
- `name` (string): Site internal name (lowercase, no spaces)
- `desc` (string): Site display name

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/cmd/sitemgr" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "cmd": "add-site",
    "name": "warehouse",
    "desc": "Warehouse Site"
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
- Site `name` must be unique and URL-safe (lowercase, no spaces)
- Site `desc` is the display name shown in UI

---

### Update Site

#### Method: `update`

**HTTP Method:** POST

**Endpoint:** `/cmd/sitemgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with update configuration

**Required Fields:**
- `cmd` (string): Command (`update-site`)
- `site` (string): Site internal ID (`_id`)
- `desc` (string): New site display name

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/cmd/sitemgr" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "cmd": "update-site",
    "site": "507f1f77bcf86cd799439011",
    "desc": "New Warehouse Site"
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
- Can only update site description, not internal name
- Use site `_id`, not site `name`

---

### Delete Site

#### Method: `delete`

**HTTP Method:** POST

**Endpoint:** `/cmd/sitemgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with delete command

**Required Fields:**
- `cmd` (string): Command (`delete-site`)
- `site` (string): Site internal ID (`_id`)

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/cmd/sitemgr" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "cmd": "delete-site",
    "site": "507f1f77bcf86cd799439011"
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
- ⚠️ **WARNING:** This permanently deletes the site and all its configuration
- Cannot delete the default site
- All devices and settings in the site will be removed
- Backup site configuration before deleting

