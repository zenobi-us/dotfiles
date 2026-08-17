# Settings

**Category:** System

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/rest/setting`

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
      "_id": "691f5ce05644140db67310a9",
      "key": "mgmt",
      "site_id": "691f5ca15644140db673108c",
      "auto_upgrade": false,
      "led_enabled": true,
      "alert_enabled": true
    },
    {
      "_id": "691f5ce05644140db67310aa",
      "key": "connectivity",
      "enabled": true,
      "uplink_type": "gateway"
    }
  ]
}
```

**Notes:**
- Returns all system settings
- Settings are organized by key (mgmt, connectivity, etc.)

---

