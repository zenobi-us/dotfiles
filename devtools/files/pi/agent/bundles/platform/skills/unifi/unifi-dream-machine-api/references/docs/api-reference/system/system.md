# System

**Category:** System

[← Back to API Reference](../README.md)

---

**Endpoint:** `/api/system`

---

#### Method: `get`

**HTTP Method:** GET

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication

**Response:**
```json
{
  "hardware": {
    "shortname": "UDMPRO"
  },
  "name": "UDM Pro",
  "mac": "E063DACF0661",
  "deviceState": "setup",
  "cloudConnected": false,
  "remoteAccessEnabled": false,
  "hasInternet": true,
  "isSingleUser": false,
  "isSsoEnabled": false
}
```

**Notes:**
- Returns UniFi OS system information
- Different from `/stat/sysinfo` which returns Network Application info

---

