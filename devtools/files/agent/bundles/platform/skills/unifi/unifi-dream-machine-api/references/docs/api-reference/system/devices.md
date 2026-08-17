# Devices

**Category:** System

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/stat/device`

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
      "_id": "691f5ce05644140db67310a8",
      "mac": "aa:bb:cc:dd:ee:ff",
      "model": "U6-Pro",
      "type": "uap",
      "name": "Living Room AP",
      "version": "6.5.54.14277",
      "state": 1,
      "adopted": true,
      "ip": "192.168.1.10",
      "uptime": 183293,
      "num_sta": 12,
      "user-num_sta": 10,
      "guest-num_sta": 2
    }
  ]
}
```

**Notes:**
- Returns all UniFi devices (APs, switches, gateways)
- Includes device status, client counts, and configuration

---

