# Clients

**Category:** Monitoring

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/stat/sta`

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
      "_id": "691f5ce05644140db67310a7",
      "mac": "00:11:22:33:44:55",
      "hostname": "laptop-01",
      "ip": "192.168.1.100",
      "network_id": "691f5ce05644140db67310a6",
      "is_wired": false,
      "is_guest": false,
      "essid": "MyWiFi",
      "channel": 36,
      "rssi": 45,
      "tx_bytes": 123456789,
      "rx_bytes": 987654321,
      "uptime": 3600,
      "last_seen": 1732291234
    }
  ]
}
```

**Notes:**
- Returns all currently connected clients
- Includes both wired and wireless clients

---

