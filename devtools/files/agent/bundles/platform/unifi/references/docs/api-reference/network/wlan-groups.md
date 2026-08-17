# WLAN Groups

**Category:** Network

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/rest/wlangroup`

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
      "_id": "691f5ce05644140db67310ad",
      "name": "Default",
      "site_id": "691f5ca15644140db673108c",
      "attr_no_delete": true,
      "attr_hidden_id": "default"
    }
  ]
}
```

**Notes:**
- Returns WLAN group configurations
- WLAN groups are used to organize WiFi networks on access points


#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with WLAN group configuration

**Required Fields:**
- `name` (string): WLAN group name

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
      "_id": "691f5ce05644140db67310ad",
      "name": "Default",
      "site_id": "691f5ca15644140db673108c",
      "attr_no_delete": true,
      "attr_hidden_id": "default"
    }
  ]
}
```

**Notes:**
- Creates new WLAN group


#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/rest/wlangroup/{group_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `group_id` (path, required): WLAN group ID to update
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f5ce05644140db67310ad",
      "name": "Default",
      "site_id": "691f5ca15644140db673108c",
      "attr_no_delete": true,
      "attr_hidden_id": "default"
    }
  ]
}
```

**Notes:**
- Must include `_id` field in request body


#### Method: `delete`

**HTTP Method:** DELETE

**Endpoint:** `/rest/wlangroup/{group_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `group_id` (path, required): WLAN group ID to delete

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
- Cannot delete default WLAN group (attr_no_delete: true)

---

