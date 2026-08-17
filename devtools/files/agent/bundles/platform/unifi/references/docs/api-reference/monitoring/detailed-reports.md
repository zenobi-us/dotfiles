# Detailed Reports

**Category:** Monitoring

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/stat/report/5minutes.site`

---

#### Method: `get_5min_site_stats`

**HTTP Method:** GET

**Endpoint:** `/stat/report/5minutes.site`

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
      "time": 1732291200000,
      "bytes": 100000000,
      "wan-tx_bytes": 20000000,
      "wan-rx_bytes": 80000000,
      "num_sta": 25
    }
  ]
}
```

**Notes:**
- Returns 5-minute aggregated site statistics
- High-resolution data for recent activity


#### Method: `get_hourly_ap_stats`

**HTTP Method:** GET

**Endpoint:** `/stat/report/hourly.ap`

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
      "time": 1732287600000,
      "ap": "e063dacf0662",
      "bytes": 50000000,
      "num_sta": 12
    }
  ]
}
```

**Notes:**
- Returns hourly statistics per access point


#### Method: `get_daily_ap_stats`

**HTTP Method:** GET

**Endpoint:** `/stat/report/daily.ap`

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
      "time": 1784520000000,
      "ap": "aa:bb:cc:dd:ee:ff",
      "bytes": 38004699.17,
      "rx_bytes": 35834656.91,
      "tx_bytes": 2170042.26,
      "num_sta": 5,
      "o": "ap",
      "oid": "aa:bb:cc:dd:ee:ff"
    }
  ]
}
```

**Notes:**
- Returns daily statistics per access point


#### Method: `get_hourly_user_stats`

**HTTP Method:** GET

**Endpoint:** `/stat/report/hourly.user`

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
      "user": "aa:bb:cc:dd:ee:ff",
      "rx_bytes": 193275.13,
      "tx_bytes": 248775.96,
      "o": "user",
      "oid": "aa:bb:cc:dd:ee:ff"
    }
  ]
}
```

**Notes:**
- Returns hourly statistics per user/client


#### Method: `get_daily_user_stats`

**HTTP Method:** GET

**Endpoint:** `/stat/report/daily.user`

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
      "time": 1784606400000,
      "user": "aa:bb:cc:dd:ee:ff",
      "rx_bytes": 691258.0,
      "tx_bytes": 68717.0,
      "o": "user",
      "oid": "aa:bb:cc:dd:ee:ff"
    }
  ]
}
```

**Notes:**
- Returns daily statistics per user/client

---

