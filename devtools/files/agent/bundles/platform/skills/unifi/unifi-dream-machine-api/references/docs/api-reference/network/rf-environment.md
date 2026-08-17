# RF Environment

**Category:** Network

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/stat/current-channel`

---

#### Method: `get_current_channels`

**HTTP Method:** GET

**Endpoint:** `/stat/current-channel`

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
      "radio_table": [
        {
          "name": "wifi0",
          "radio": "ng",
          "current_antenna_gain": 3,
          "current_channel": 6,
          "ht": "20"
        },
        {
          "name": "wifi1",
          "radio": "na",
          "current_antenna_gain": 3,
          "current_channel": 44,
          "ht": "80"
        }
      ]
    }
  ]
}
```

**Notes:**
- Returns current channel assignments for all radios
- Includes antenna gain and channel width


#### Method: `get_country_codes`

**HTTP Method:** GET

**Endpoint:** `/stat/ccode`

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
      "code": 840,
      "key": "US",
      "name": "United States"
    }
  ]
}
```

**Notes:**
- Returns list of supported country codes for regulatory compliance
- Used for WiFi channel and power restrictions

---

