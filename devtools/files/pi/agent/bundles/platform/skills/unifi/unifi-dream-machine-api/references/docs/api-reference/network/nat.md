# NAT Rules

**Category:** Network Management
**API Version:** V2

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/v2/api/site/{site}/nat`

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
- Returns array of NAT rules
- Empty array if no NAT rules configured


#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication
- Request body: JSON object with NAT rule configuration

**Response:**
```json
[]
```
#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/nat/{id}`

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication
- `id` (path, required): NAT rule ID
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
[]
```
#### Method: `delete`

**HTTP Method:** DELETE

**Endpoint:** `/nat/{id}`

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication
- `id` (path, required): NAT rule ID

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": []
}
```
