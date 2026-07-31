# Device Basic Info

**Category:** System

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/stat/device-basic`

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
      "_id": "691f5ce05644140db67310b7",
      "mac": "e0:63:da:cf:06:62",
      "model": "U6LR",
      "type": "uap",
      "version": "6.5.55.14277",
      "adopted": true,
      "state": 1,
      "ip": "192.168.1.10"
    }
  ]
}
```

**Notes:**
- Returns basic device information (lightweight version)
- Faster than `/stat/device` for simple device lists
- Useful for device discovery and status checks

---

