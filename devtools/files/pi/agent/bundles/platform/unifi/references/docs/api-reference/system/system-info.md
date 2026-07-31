# System Info

**Category:** System

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/stat/sysinfo`

---

#### Method: `get`

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
      "hostname": "UDM-Pro",
      "ip": "192.168.1.1",
      "netmask": "255.255.255.0",
      "gateway": "192.168.1.1",
      "version": "9.5.21",
      "update_available": false,
      "uptime": 183293,
      "timezone": "America/New_York",
      "autobackup": true,
      "data_retention_days": 365
    }
  ]
}
```

**Notes:**
- Returns system information and status
- Includes version, uptime, and configuration details

---

