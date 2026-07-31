# DPI Statistics

**Category:** Monitoring

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/stat/sitedpi`

---

#### Method: `get_site_dpi`

**HTTP Method:** GET

**Endpoint:** `/stat/sitedpi`

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
      "time": 1732291234,
      "app": 443,
      "cat": 3,
      "tx_bytes": 50000000,
      "rx_bytes": 200000000
    }
  ]
}
```

**Notes:**
- Returns site-wide Deep Packet Inspection statistics
- Aggregated by application and category


#### Method: `get_client_dpi`

**HTTP Method:** GET

**Endpoint:** `/stat/stadpi`

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
      "mac": "00:11:22:33:44:55",
      "app": 443,
      "cat": 3,
      "tx_bytes": 5000000,
      "rx_bytes": 20000000
    }
  ]
}
```

**Notes:**
- Returns per-client Deep Packet Inspection statistics
- Shows application usage by individual clients

---

