# User Groups

**Category:** Network

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/rest/usergroup`

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
      "_id": "691f5ce05644140db67310b3",
      "name": "Default",
      "site_id": "691f5ca15644140db673108c",
      "qos_rate_max_down": -1,
      "qos_rate_max_up": -1,
      "attr_no_delete": true,
      "attr_hidden_id": "default"
    }
  ]
}
```

**Notes:**
- Returns client user groups
- User groups can have QoS bandwidth limits
- Used to organize and apply policies to groups of clients
- Alternative endpoint: `/api/s/default/list/usergroup` (same response)


#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with user group configuration

**Required Fields:**
- `name` (string): User group name
- `qos_rate_max_down` (integer): Max download speed in Kbps (-1 for unlimited)
- `qos_rate_max_up` (integer): Max upload speed in Kbps (-1 for unlimited)

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
      "_id": "691f5ce05644140db67310b3",
      "name": "Default",
      "site_id": "691f5ca15644140db673108c",
      "qos_rate_max_down": -1,
      "qos_rate_max_up": -1,
      "attr_no_delete": true,
      "attr_hidden_id": "default"
    }
  ]
}
```

**Notes:**
- Creates new user group with QoS settings


#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/rest/usergroup/{group_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `group_id` (path, required): User group ID to update
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f5ce05644140db67310b3",
      "name": "Default",
      "site_id": "691f5ca15644140db673108c",
      "qos_rate_max_down": -1,
      "qos_rate_max_up": -1,
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

**Endpoint:** `/rest/usergroup/{group_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `group_id` (path, required): User group ID to delete

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
- Cannot delete default user group (attr_no_delete: true)

---

