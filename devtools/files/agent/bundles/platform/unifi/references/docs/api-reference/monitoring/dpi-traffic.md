# DPI & Traffic Statistics

**Category:** Monitoring

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/stat/dpi`

---

#### Method: `get`

**HTTP Method:** GET

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body (optional): JSON object with filter parameters
  - `mac` (string): Filter by client MAC address
  - `start` (integer): Start timestamp (milliseconds)
  - `end` (integer): End timestamp (milliseconds)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "app": 5001,
      "cat": 3,
      "tx_bytes": 1234567890,
      "rx_bytes": 9876543210,
      "tx_packets": 123456,
      "rx_packets": 654321,
      "known_clients": 5,
      "time": 1732291234567
    }
  ]
}
```

**Notes:**
- Returns application-level traffic statistics from Deep Packet Inspection

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `app` | integer | Application ID |
| `cat` | integer | Category ID |
| `tx_bytes` | integer | Bytes transmitted |
| `rx_bytes` | integer | Bytes received |
| `tx_packets` | integer | Packets transmitted |
| `rx_packets` | integer | Packets received |
| `known_clients` | integer | Number of clients using this app |
| `time` | integer | Unix timestamp (milliseconds) |


## Common Application IDs

| App ID | Application |
|--------|-------------|
| 5001 | YouTube |
| 5002 | Netflix |
| 5003 | Amazon Video |
| 5010 | Spotify |
| 5020 | Facebook |
| 5021 | Instagram |
| 5030 | Zoom |
| 5031 | Microsoft Teams |
| 5040 | Steam |
| 5050 | HTTP |
| 5051 | HTTPS |

## Common Category IDs

| Cat ID | Category |
|--------|----------|
| 0 | Unclassified |
| 1 | Instant Messaging |
| 3 | Streaming Media |
| 4 | Social Networking |
| 5 | File Sharing |
| 6 | Gaming |
| 7 | VoIP |
| 8 | Email |
| 9 | Web |
| 10 | Cloud Services |
| 11 | VPN |

---
