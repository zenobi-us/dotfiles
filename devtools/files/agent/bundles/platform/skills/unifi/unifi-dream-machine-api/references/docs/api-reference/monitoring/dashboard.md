# Dashboard

**Category:** Monitoring

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/stat/dashboard`

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
      "time": 1784592000000,
      "wan-rx_bytes": 25718006034.96,
      "wan-tx_bytes": 1873032981.22,
      "num_sta": 37
    }
  ]
}
```

**Notes:**
- Returns time-bucketed dashboard metrics for the site (WAN throughput and client counts)
- Each `data` entry is one time bucket; timestamps are Unix epoch milliseconds
- Byte counters are cumulative per bucket
