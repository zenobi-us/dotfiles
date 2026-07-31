# Authorization

**Category:** Security

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/stat/authorization`

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
      "_id": "691f5ce05644140db67310b5",
      "mac": "00:11:22:33:44:55",
      "site_id": "691f5ca15644140db673108c",
      "authorized": true,
      "auth_time": 1732291234
    }
  ]
}
```

**Notes:**
- Returns client authorization records
- Shows which clients are authorized to access the network

---

