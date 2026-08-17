# Accounts

**Category:** Core

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/rest/account`

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
      "_id": "691f5ce05644140db67310b4",
      "name": "admin",
      "site_id": "691f5ca15644140db673108c",
      "tunneled_reply": false
    }
  ]
}
```

**Notes:**
- Returns RADIUS accounting records
- Used for tracking authentication sessions


#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with RADIUS account configuration

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f5ce05644140db67310b4",
      "name": "admin",
      "site_id": "691f5ca15644140db673108c",
      "tunneled_reply": false
    }
  ]
}
```

**Notes:**
- Creates new RADIUS accounting record


#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/rest/account/{account_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `account_id` (path, required): Account ID to update
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f5ce05644140db67310b4",
      "name": "admin",
      "site_id": "691f5ca15644140db673108c",
      "tunneled_reply": false
    }
  ]
}
```

**Notes:**
- Must include `_id` field in request body


#### Method: `delete`

**HTTP Method:** DELETE

**Endpoint:** `/rest/account/{account_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `account_id` (path, required): Account ID to delete

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

