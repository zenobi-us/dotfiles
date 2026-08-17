# AP Groups

**Category:** Network Management
**API Version:** V2

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/v2/api/site/{site}/apgroups`

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
- Returns array of AP groups
- Empty array if no AP groups configured


#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication
- Request body: JSON object with AP group configuration

**Response:**
```json
[]
```
#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/apgroups/{id}`

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication
- `id` (path, required): AP group ID
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
[]
```
#### Method: `delete`

**HTTP Method:** DELETE

**Endpoint:** `/apgroups/{id}`

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication
- `id` (path, required): AP group ID

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": []
}
```
