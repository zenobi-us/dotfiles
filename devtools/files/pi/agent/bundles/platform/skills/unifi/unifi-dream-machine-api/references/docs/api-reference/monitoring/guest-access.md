# Guest Access

**Category:** Monitoring

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/stat/guest`

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
      "_id": "691f5ce05644140db67310b2",
      "mac": "00:11:22:33:44:55",
      "site_id": "691f5ca15644140db673108c",
      "authorized": true,
      "start": 1732291234,
      "end": 1732377634,
      "voucher_id": "691f5ce05644140db67310b1"
    }
  ]
}
```

**Notes:**
- Returns currently authorized guest users
- Includes voucher-based and portal-authorized guests

---

