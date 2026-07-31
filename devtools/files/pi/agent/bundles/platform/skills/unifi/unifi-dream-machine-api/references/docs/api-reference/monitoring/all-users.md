# All Users

**Category:** Monitoring

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/stat/alluser`

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
      "_id": "691f5ce05644140db67310b6",
      "mac": "00:11:22:33:44:55",
      "site_id": "691f5ca15644140db673108c",
      "first_seen": 1732191234,
      "last_seen": 1732291234,
      "hostname": "laptop",
      "is_guest": false,
      "is_wired": false
    }
  ]
}
```

**Notes:**
- Returns all users (clients) ever seen by the controller
- Includes both currently connected and historical clients
- Different from `/stat/sta` which shows only currently connected clients

---

