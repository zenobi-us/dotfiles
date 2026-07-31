# Routing Table

**Category:** Network

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/stat/routing`

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
      "pfx": "0.0.0.0/0",
      "nh": [
        {
          "intf": "eth8",
          "t": "default",
          "via": "192.168.1.1"
        }
      ]
    }
  ]
}
```

**Notes:**
- Returns active routing table
- Shows current routes including static and dynamic
- Different from `/rest/routing` which shows configured static routes

---

