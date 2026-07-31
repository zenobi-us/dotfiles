# RADIUS

**Category:** Security

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/rest/radiusprofile`

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
      "_id": "691f6a1b5644140db6731def",
      "name": "Corporate RADIUS",
      "auth_servers": [
        {
          "ip": "192.168.1.50",
          "port": 1812,
          "x_secret": "radius-secret-key"
        }
      ],
      "acct_servers": [
        {
          "ip": "192.168.1.50",
          "port": 1813,
          "x_secret": "radius-secret-key"
        }
      ],
      "interim_update_interval": 3600,
      "use_usg_auth_server": false,
      "use_usg_acct_server": false,
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Returns all configured RADIUS profiles for 802.1X authentication

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Unique profile ID |
| `name` | string | Profile name |
| `auth_servers` | array | Authentication servers |
| `acct_servers` | array | Accounting servers |
| `interim_update_interval` | integer | Interim update interval (seconds) |
| `use_usg_auth_server` | boolean | Use built-in RADIUS server for auth |
| `use_usg_acct_server` | boolean | Use built-in RADIUS server for accounting |
| `site_id` | string | Site ID |

**Server Object Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `ip` | string | Server IP address |
| `port` | integer | Server port (1812 for auth, 1813 for acct) |
| `x_secret` | string | Shared secret |


#### Method: `get`

**HTTP Method:** GET

**Endpoint:** `/rest/radiusprofile/{profile_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `profile_id` (path, required): RADIUS profile ID

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f6a1b5644140db6731def",
      "name": "Corporate RADIUS",
      "auth_servers": [
        {
          "ip": "192.168.1.50",
          "port": 1812,
          "x_secret": "radius-secret-key"
        }
      ],
      "acct_servers": [
        {
          "ip": "192.168.1.50",
          "port": 1813,
          "x_secret": "radius-secret-key"
        }
      ],
      "interim_update_interval": 3600,
      "use_usg_auth_server": false,
      "use_usg_acct_server": false,
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```
#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with profile configuration

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f6a1b5644140db6731def",
      "name": "Corporate RADIUS",
      "auth_servers": [
        {
          "ip": "192.168.1.50",
          "port": 1812,
          "x_secret": "radius-secret-key"
        }
      ],
      "acct_servers": [
        {
          "ip": "192.168.1.50",
          "port": 1813,
          "x_secret": "radius-secret-key"
        }
      ],
      "interim_update_interval": 3600,
      "use_usg_auth_server": false,
      "use_usg_acct_server": false,
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```
#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/rest/radiusprofile/{profile_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `profile_id` (path, required): RADIUS profile ID
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f6a1b5644140db6731def",
      "name": "Corporate RADIUS",
      "auth_servers": [
        {
          "ip": "192.168.1.50",
          "port": 1812,
          "x_secret": "radius-secret-key"
        }
      ],
      "acct_servers": [
        {
          "ip": "192.168.1.50",
          "port": 1813,
          "x_secret": "radius-secret-key"
        }
      ],
      "interim_update_interval": 3600,
      "use_usg_auth_server": false,
      "use_usg_acct_server": false,
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```
#### Method: `delete`

**HTTP Method:** DELETE

**Endpoint:** `/rest/radiusprofile/{profile_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `profile_id` (path, required): RADIUS profile ID

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
