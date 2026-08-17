# Feature Flags

**Category:** System
**API Version:** V2

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/v2/api/site/{site}/described-features`

---

#### Method: `list`

**HTTP Method:** GET

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication
- `includeSystemFeatures` (query, optional): Include system features (boolean)

**Example:**
```bash
curl -k -X GET \
  -H "X-Api-Key: YOUR_API_KEY" \
  "https://192.168.1.1/proxy/network/v2/api/site/default/described-features?includeSystemFeatures=true"
```

**Response:**
```json
[]
```

**Notes:**
- Returns array of available feature flags
- Use `includeSystemFeatures=true` to include system-level features
- Read-only endpoint

