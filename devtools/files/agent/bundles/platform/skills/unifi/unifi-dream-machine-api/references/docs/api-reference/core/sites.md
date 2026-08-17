# Sites

**Category:** Core

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/self/sites`

---

#### Method: `list`

**HTTP Method:** GET

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication

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
      "role": "admin"
    }
  ]
}
```

**Notes:**
- Returns all configured sites
- Default site cannot be deleted

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Unique site ID |
| `name` | string | Site name (URL-safe) |
| `desc` | string | Site description |
| `attr_hidden_id` | string | Hidden site identifier |
| `attr_no_delete` | boolean | Site cannot be deleted |
| `role` | string | User role for this site |


#### Method: `get_self`

**HTTP Method:** GET

**Endpoint:** `/s/default/self`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "name": "admin",
      "site_id": "691f5ca15644140db673108c",
      "site_name": "default",
      "site_role": "admin",
      "site_permissions": [],
      "super_site_permissions": [],
      "is_super": false,
      "is_professional_installer": false,
      "email_alert_enabled": false,
      "email_alert_grouping_enabled": false,
      "push_alert_enabled": true,
      "html_email_enabled": true,
      "ui_settings": {}
    }
  ]
}
```

**Notes:**
- Returns information about authenticated user
- Includes site permissions and role


#### Method: `create`

**HTTP Method:** POST

**Endpoint:** `/s/default/cmd/sitemgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `cmd` (required): `add-site`
- `desc` (required): Site description

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
      "role": "admin"
    }
  ]
}
```
#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/s/default/cmd/sitemgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `cmd` (required): `update-site`
- `desc` (required): Updated site description

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
      "role": "admin"
    }
  ]
}
```
#### Method: `delete`

**HTTP Method:** POST

**Endpoint:** `/s/default/cmd/sitemgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `cmd` (required): `delete-site`
- `site` (required): Site name to delete

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
- Cannot delete default site

---

## Site Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full administrative access |
| `readonly` | Read-only access |

---
