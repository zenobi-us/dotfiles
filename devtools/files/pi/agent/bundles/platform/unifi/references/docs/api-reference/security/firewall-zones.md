# Firewall Zones

**Category:** Security
**API Version:** V2

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/v2/api/site/{site}/firewall/zone`

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
- Returns array of firewall zones
- Empty array if no firewall zones configured


#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication
- Request body: JSON object with firewall zone configuration

**Response:**
```json
[]
```
#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/firewall/zone/{id}`

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication
- `id` (path, required): Firewall zone ID
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
[]
```
#### Method: `delete`

**HTTP Method:** DELETE

**Endpoint:** `/firewall/zone/{id}`

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication
- `id` (path, required): Firewall zone ID

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": []
}
```
