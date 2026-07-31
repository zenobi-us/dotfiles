# DNS Records (Static DNS)

**Category:** Network Management
**API Version:** V2

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/v2/api/site/{site}/static-dns`

---

#### Method: `list`

**HTTP Method:** GET

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication

**Response:**
```json
[
  {
    "_id": "692300fbc462bb6a666dff19",
    "enabled": true,
    "key": "grafana.example.com",
    "port": 0,
    "priority": 0,
    "record_type": "A",
    "ttl": 300,
    "value": "192.168.1.50",
    "weight": 0
  }
]
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | DNS record ID |
| `enabled` | boolean | Whether the record is active |
| `key` | string | Fully qualified domain name (FQDN) |
| `record_type` | string | DNS record type: `A`, `AAAA`, `CNAME`, `MX`, `NS`, `PTR`, `SOA`, `SRV`, `TXT` |
| `value` | string | IP address or value for the record |
| `ttl` | integer | Time to live in seconds |
| `port` | integer | Port number (for SRV records) |
| `priority` | integer | Priority (for MX/SRV records) |
| `weight` | integer | Weight (for SRV records) |


#### Method: `get`

**HTTP Method:** GET

**Endpoint:** `/static-dns/{id}`

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication
- `id` (path, required): DNS record ID

**Response:**
```json
[
  {
    "_id": "692300fbc462bb6a666dff19",
    "enabled": true,
    "key": "grafana.example.com",
    "port": 0,
    "priority": 0,
    "record_type": "A",
    "ttl": 300,
    "value": "192.168.1.50",
    "weight": 0
  }
]
```
#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication
- Request body: JSON object with DNS record fields

**Required Fields:**
- `key` (string): Fully qualified domain name (FQDN)
- `record_type` (string): DNS record type
- `value` (string): IP address or value
- `enabled` (boolean): Whether the record is active

**Example:**
```bash
curl -k -X POST \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "key": "grafana.example.com",
    "record_type": "A",
    "value": "192.168.1.50",
    "ttl": 300
  }' \
  "https://192.168.1.1/proxy/network/v2/api/site/default/static-dns"
```

**Response:**
```json
[
  {
    "_id": "692300fbc462bb6a666dff19",
    "enabled": true,
    "key": "grafana.example.com",
    "port": 0,
    "priority": 0,
    "record_type": "A",
    "ttl": 300,
    "value": "192.168.1.50",
    "weight": 0
  }
]
```
#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/static-dns/{id}`

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication
- `id` (path, required): DNS record ID
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
[
  {
    "_id": "692300fbc462bb6a666dff19",
    "enabled": true,
    "key": "grafana.example.com",
    "port": 0,
    "priority": 0,
    "record_type": "A",
    "ttl": 300,
    "value": "192.168.1.50",
    "weight": 0
  }
]
```
#### Method: `delete`

**HTTP Method:** DELETE

**Endpoint:** `/static-dns/{id}`

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication
- `id` (path, required): DNS record ID

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": []
}
```
