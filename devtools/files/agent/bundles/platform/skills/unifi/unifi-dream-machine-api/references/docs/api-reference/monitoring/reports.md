# Reports

**Category:** Monitoring

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/stat/report/daily.site`

---

#### Method: `get_daily`

**HTTP Method:** GET

**Endpoint:** `/stat/report/daily.site`

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
      "time": 1732147200000,
      "bytes": 50000000000,
      "wan-tx_bytes": 10000000000,
      "wan-rx_bytes": 40000000000,
      "num_sta": 25
    }
  ]
}
```

**Notes:**
- Returns daily aggregated statistics


#### Method: `get_hourly`

**HTTP Method:** GET

**Endpoint:** `/stat/report/hourly.site`

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
      "time": 1732147200000,
      "bytes": 2000000000,
      "wan-tx_bytes": 400000000,
      "wan-rx_bytes": 1600000000,
      "num_sta": 25
    }
  ]
}
```

**Notes:**
- Returns hourly aggregated statistics

---

