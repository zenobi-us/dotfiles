# Dynamic DNS

**Category:** Network Management

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/rest/dynamicdns`

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
      "_id": "691f6b2c5644140db6731fgh",
      "enabled": true,
      "service": "dyndns",
      "host_name": "myhouse.dyndns.org",
      "login": "myusername",
      "x_password": "mypassword",
      "interface": "wan",
      "server": "members.dyndns.org",
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Returns all configured Dynamic DNS entries for automatic WAN IP updates

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Unique DDNS ID |
| `enabled` | boolean | DDNS enabled |
| `service` | string | DDNS service provider |
| `host_name` | string | Hostname to update |
| `login` | string | DDNS account username |
| `x_password` | string | DDNS account password |
| `interface` | string | WAN interface: `wan`, `wan2` |
| `server` | string | DDNS server hostname |
| `site_id` | string | Site ID |


#### Method: `get`

**HTTP Method:** GET

**Endpoint:** `/rest/dynamicdns/{ddns_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `ddns_id` (path, required): Dynamic DNS ID

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f6b2c5644140db6731fgh",
      "enabled": true,
      "service": "dyndns",
      "host_name": "myhouse.dyndns.org",
      "login": "myusername",
      "x_password": "mypassword",
      "interface": "wan",
      "server": "members.dyndns.org",
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```
#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with DDNS configuration

**Required Fields:**
- `enabled` (boolean): Enable DDNS
- `service` (string): DDNS service provider (dyndns, noip, cloudflare, afraid, namecheap, he, google, custom)
- `host_name` (string): Hostname to update
- `login` (string): DDNS account username/email
- `x_password` (string): DDNS account password/API token
- `interface` (string): WAN interface (wan, wan2)
- `server` (string): DDNS server hostname

**Optional Fields:**
See Response Fields table above for all available configuration fields.

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f6b2c5644140db6731fgh",
      "enabled": true,
      "service": "dyndns",
      "host_name": "myhouse.dyndns.org",
      "login": "myusername",
      "x_password": "mypassword",
      "interface": "wan",
      "server": "members.dyndns.org",
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Creates new Dynamic DNS configuration


#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/rest/dynamicdns/{ddns_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `ddns_id` (path, required): Dynamic DNS ID to update
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f6b2c5644140db6731fgh",
      "enabled": true,
      "service": "dyndns",
      "host_name": "myhouse.dyndns.org",
      "login": "myusername",
      "x_password": "mypassword",
      "interface": "wan",
      "server": "members.dyndns.org",
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Must include `_id` field in request body
- Only include fields to update


#### Method: `delete`

**HTTP Method:** DELETE

**Endpoint:** `/rest/dynamicdns/{ddns_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `ddns_id` (path, required): Dynamic DNS ID to delete

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": []
}
```
