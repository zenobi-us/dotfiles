# Users

**Category:** Network

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/rest/user`

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
      "_id": "691f5ce05644140db67310ab",
      "mac": "00:11:22:33:44:55",
      "site_id": "691f5ca15644140db673108c",
      "name": "Laptop",
      "note": "Work laptop",
      "fixed_ip": "192.168.1.100",
      "use_fixedip": true,
      "network_id": "691f5ce05644140db67310a6",
      "usergroup_id": ""
    }
  ]
}
```

**Notes:**
- Returns user/client configurations
- Includes DHCP reservations and client settings
- Different from `/stat/sta` which shows active connections


#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with user configuration

**Required Fields:**
- `mac` (string): Client MAC address
- `name` (string): Client name
- `fixed_ip` (string): Fixed IP address (if use_fixedip is true)
- `use_fixedip` (boolean): Enable DHCP reservation
- `network_id` (string): Network ID

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
      "_id": "691f5ce05644140db67310ab",
      "mac": "00:11:22:33:44:55",
      "site_id": "691f5ca15644140db673108c",
      "name": "Laptop",
      "note": "Work laptop",
      "fixed_ip": "192.168.1.100",
      "use_fixedip": true,
      "network_id": "691f5ce05644140db67310a6",
      "usergroup_id": ""
    }
  ]
}
```

**Notes:**
- Creates new client configuration or DHCP reservation


#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/rest/user/{user_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `user_id` (path, required): User ID to update
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f5ce05644140db67310ab",
      "mac": "00:11:22:33:44:55",
      "site_id": "691f5ca15644140db673108c",
      "name": "Laptop",
      "note": "Work laptop",
      "fixed_ip": "192.168.1.100",
      "use_fixedip": true,
      "network_id": "691f5ce05644140db67310a6",
      "usergroup_id": ""
    }
  ]
}
```

**Notes:**
- Must include `_id` field in request body
- DELETE method not supported for users

---

