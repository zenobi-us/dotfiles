# Health

**Category:** Monitoring

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/stat/health`

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
      "subsystem": "wan",
      "status": "ok",
      "num_user": 25,
      "num_guest": 3,
      "num_iot": 12,
      "tx_bytes-r": 1234567,
      "rx_bytes-r": 9876543
    },
    {
      "subsystem": "wlan",
      "status": "ok",
      "num_user": 18,
      "num_guest": 3,
      "num_iot": 10
    },
    {
      "subsystem": "lan",
      "status": "ok",
      "num_user": 7
    }
  ]
}
```

**Notes:**
- Returns health status for each network subsystem
- Subsystems include: wan, wlan, lan, vpn, www

---

