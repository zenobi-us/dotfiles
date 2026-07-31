# Traffic Rules

**Category:** Network Management
**API Version:** V2

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/v2/api/site/{site}/trafficrules`

---

#### Method: `list`

**HTTP Method:** GET

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication

**Response:**
```json
[]
```

**Notes:**
- Returns array of traffic rules
- Empty array if no traffic rules configured


#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication
- Request body: JSON object with traffic rule configuration

**Response:**
```json
[]
```
#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/trafficrules/{id}`

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication
- `id` (path, required): Traffic rule ID
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
[]
```
#### Method: `delete`

**HTTP Method:** DELETE

**Endpoint:** `/trafficrules/{id}`

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication
- `id` (path, required): Traffic rule ID

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": []
}
```
