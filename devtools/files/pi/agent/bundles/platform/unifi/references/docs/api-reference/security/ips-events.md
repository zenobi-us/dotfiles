# IPS Events

**Category:** Security

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/stat/ips/event`

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
      "_id": "691f5ce05644140db67310af",
      "datetime": "2024-11-22T10:30:00Z",
      "src_ip": "192.168.1.100",
      "dst_ip": "203.0.113.50",
      "signature": "ET SCAN Potential SSH Scan",
      "category": "Attempted Information Leak",
      "priority": 2,
      "blocked": true
    }
  ]
}
```

**Notes:**
- Returns Intrusion Prevention System (IPS) events
- Shows detected threats and attacks

---

