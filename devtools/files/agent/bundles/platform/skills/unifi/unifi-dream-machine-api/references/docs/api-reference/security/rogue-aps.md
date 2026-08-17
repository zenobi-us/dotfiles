# Rogue Access Points

**Category:** Security

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/stat/rogueap`

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
      "age": 27,
      "band": "ng",
      "bssid": "d4:3f:32:ea:e9:a9",
      "bw": 20,
      "center_freq": 2412,
      "channel": 1,
      "essid": "NeighborWiFi",
      "freq": 2412,
      "is_adhoc": false,
      "is_ubnt": false,
      "noise": -96,
      "rssi": 15,
      "security": "WPA2"
    }
  ]
}
```

**Notes:**
- Returns detected nearby access points (rogue APs)
- Useful for RF planning and security monitoring
- Includes signal strength, channel, and security information

---

