# Tags

**Category:** Network

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/rest/tag`

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
      "_id": "691f5ce05644140db67310ae",
      "name": "IoT Devices",
      "site_id": "691f5ca15644140db673108c",
      "member_table": []
    }
  ]
}
```

**Notes:**
- Returns device and client tags
- Tags are used to organize and group devices/clients


#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with tag configuration

**Required Fields:**
- `name` (string): Tag name

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
      "_id": "691f5ce05644140db67310ae",
      "name": "IoT Devices",
      "site_id": "691f5ca15644140db673108c",
      "member_table": []
    }
  ]
}
```

**Notes:**
- Creates new tag for organizing devices/clients


#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/rest/tag/{tag_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `tag_id` (path, required): Tag ID to update
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f5ce05644140db67310ae",
      "name": "IoT Devices",
      "site_id": "691f5ca15644140db673108c",
      "member_table": []
    }
  ]
}
```

**Notes:**
- Must include `_id` field in request body


#### Method: `delete`

**HTTP Method:** DELETE

**Endpoint:** `/rest/tag/{tag_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `tag_id` (path, required): Tag ID to delete

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

