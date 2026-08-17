# Admin User Management

**Category:** System

[← Back to API Reference](../README.md)

---

## Overview

Manage administrator users (create, update, delete, list, invite).

**Base Paths:**
- List Admins: `/proxy/network/api/stat/admin`
- Admin Commands: `/proxy/network/api/s/{site}/cmd/sitemgr`
- Delete Admin: `/proxy/network/api/stat/admin/{admin_id}`

**Authentication:** `X-Api-Key` header required

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Admin user ID |
| `name` | String | Admin username |
| `email` | String | Admin email address |
| `is_super` | Boolean | Super admin status |
| `role` | String | Admin role |
| `site_permissions` | Array | Site access permissions |
| `requires_new_password` | Boolean | Password reset required |
| `last_site_name` | String | Last accessed site |

---

## Methods

### List Admin Users

#### Method: `list`

**HTTP Method:** GET

**Endpoint:** `/api/stat/admin`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication

**Example Request:**
```bash
curl -X GET "https://192.168.1.1/proxy/network/api/stat/admin" \
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
      "_id": "691f5dc15644140db67310fe",
      "name": "admin",
      "email": "admin@example.com",
      "first_name": "Admin",
      "last_name": "User",
      "is_super": true,
      "is_owner": true,
      "is_verified": true,
      "last_site_name": "default",
      "roles": [
        {
          "site_id": "691f5ca15644140db673108c",
          "site_name": "default",
          "site_desc": "Default",
          "role": "admin",
          "permissions": []
        }
      ]
    }
  ]
}
```

---

### Create Admin User

#### Method: `create`

**HTTP Method:** POST

**Endpoint:** `/cmd/sitemgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with admin configuration

**Required Fields:**
- `cmd` (string): Command (`create-admin`)
- `name` (string): Admin username
- `email` (string): Admin email address
- `x_password` (string): Admin password

**Optional Fields:**
- `is_super` (boolean): Super admin status (default: `false`)
- `role` (string): Admin role (`admin`, `readonly`)
- `site_access` (array): Site access permissions

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/cmd/sitemgr" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "cmd": "create-admin",
    "name": "john",
    "email": "john@example.com",
    "x_password": "SecurePassword123!",
    "role": "admin"
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

### Update Admin User

#### Method: `update`

**HTTP Method:** POST

**Endpoint:** `/cmd/sitemgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with update configuration

**Required Fields:**
- `cmd` (string): Command (`update-admin`)
- `admin_id` (string): Admin user ID

**Optional Fields:**
- `email` (string): New email address
- `x_password` (string): New password
- `role` (string): New role

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/cmd/sitemgr" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "cmd": "update-admin",
    "admin_id": "507f1f77bcf86cd799439011",
    "email": "newemail@example.com"
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

### Delete Admin User

#### Method: `delete`

**HTTP Method:** DELETE

**Endpoint:** `/api/stat/admin/{admin_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `admin_id` (path, required): Admin user ID to delete

**Example Request:**
```bash
curl -X DELETE "https://192.168.1.1/proxy/network/api/stat/admin/507f1f77bcf86cd799439011" \
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

**Notes:**
- ⚠️ Cannot delete the currently authenticated admin user
- ⚠️ Cannot delete the last super admin

---

### Invite Admin User

#### Method: `invite`

**HTTP Method:** POST

**Endpoint:** `/cmd/sitemgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with invite configuration

**Required Fields:**
- `cmd` (string): Command (`invite-admin`)
- `name` (string): Admin username
- `email` (string): Admin email address

**Optional Fields:**
- `role` (string): Admin role (`admin`, `readonly`)
- `site_access` (array): Site access permissions

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/cmd/sitemgr" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "cmd": "invite-admin",
    "name": "jane",
    "email": "jane@example.com",
    "role": "readonly"
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
- Sends invitation email to the specified address
- User must accept invitation and set password

