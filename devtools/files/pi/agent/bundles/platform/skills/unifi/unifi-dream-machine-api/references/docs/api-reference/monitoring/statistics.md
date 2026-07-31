# Statistics & Reports

**Category:** Monitoring

[← Back to API Reference](../README.md)

---

## Overview

Retrieve historical statistics and reports for sites, clients, and devices.

**Base Path:** `/proxy/network/api/s/{site}/stat/report`

**Authentication:** `X-Api-Key` header required

---

## Methods

### Site Statistics (Hourly)

#### Method: `site_hourly`

**HTTP Method:** POST

**Endpoint:** `/stat/report/hourly.site`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with query parameters

**Required Fields:**
- `start` (integer): Start time in milliseconds (Unix timestamp * 1000)
- `end` (integer): End time in milliseconds (Unix timestamp * 1000)
- `attrs` (array): Attributes to retrieve

**Available Attributes:**
- `bytes` - Total bytes
- `rx_bytes` - Received bytes
- `tx_bytes` - Transmitted bytes
- `num_sta` - Number of connected clients
- `num_active_user` - Number of active users

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/stat/report/hourly.site" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "start": 1704067200000,
    "end": 1704153600000,
    "attrs": ["bytes", "rx_bytes", "tx_bytes", "num_sta"]
  }'
```

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "time": 1784592000000,
      "wan-tx_bytes": 1873032981.22,
      "wan-rx_bytes": 25718006034.96,
      "num_sta": 37,
      "site": "691f5ca15644140db673108c",
      "o": "site",
      "oid": "691f5ca15644140db673108c"
    }
  ]
}
```

---

### Client Statistics (Hourly)

#### Method: `client_hourly`

**HTTP Method:** POST

**Endpoint:** `/stat/report/hourly.sta`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with query parameters

**Required Fields:**
- `mac` (string): Client MAC address
- `start` (integer): Start time in milliseconds
- `end` (integer): End time in milliseconds
- `attrs` (array): Attributes to retrieve

**Available Attributes:**
- `bytes` - Total bytes
- `rx_bytes` - Received bytes
- `tx_bytes` - Transmitted bytes

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/stat/report/hourly.sta" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mac": "aa:bb:cc:dd:ee:ff",
    "start": 1704067200000,
    "end": 1704153600000,
    "attrs": ["rx_bytes", "tx_bytes", "bytes"]
  }'
```

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "time": 1704067200000,
      "mac": "aa:bb:cc:dd:ee:ff",
      "rx_bytes": 52428800,
      "tx_bytes": 52428800,
      "bytes": 104857600
    }
  ]
}
```

---

### Device Statistics (Hourly)

#### Method: `device_hourly`

**HTTP Method:** POST

**Endpoint:** `/stat/report/hourly.dev`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with query parameters

**Required Fields:**
- `mac` (string): Device MAC address
- `start` (integer): Start time in milliseconds
- `end` (integer): End time in milliseconds
- `attrs` (array): Attributes to retrieve

**Available Attributes:**
- `bytes` - Total bytes
- `rx_bytes` - Received bytes
- `tx_bytes` - Transmitted bytes
- `num_sta` - Number of connected clients (for APs)

**Example Request:**
```bash
curl -X POST "https://192.168.1.1/proxy/network/api/s/default/stat/report/hourly.dev" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mac": "aa:bb:cc:dd:ee:ff",
    "start": 1704067200000,
    "end": 1704153600000,
    "attrs": ["rx_bytes", "tx_bytes", "bytes", "num_sta"]
  }'
```

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "time": 1704067200000,
      "mac": "aa:bb:cc:dd:ee:ff",
      "rx_bytes": 268435456,
      "tx_bytes": 268435456,
      "bytes": 536870912,
      "num_sta": 8
    }
  ]
}
```

---

## Notes

- All timestamps are in milliseconds (Unix timestamp * 1000)
- Data is aggregated hourly
- Historical data retention depends on controller settings
- Use JavaScript: `Date.now()` or `new Date().getTime()` for current timestamp
- Use JavaScript: `new Date('2024-01-01').getTime()` for specific date

