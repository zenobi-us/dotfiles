# Network Topology

**Category:** Network Management
**API Version:** V2

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/v2/api/site/{site}/topology`

---

#### Method: `list`

**HTTP Method:** GET

**Parameters:**
- `X-Api-Key` (header, required): API key for authentication

**Response:**
```json
{
  "edges": [
    {
      "downlinkMac": "e0:63:da:c1:a0:b2",
      "duplex": "FULL_DUPLEX",
      "networkId": "691f5ce05644140db67310a6",
      "rateMbps": 1000,
      "type": "WIRED",
      "uplinkMac": "e0:63:da:c6:6d:8a",
      "uplinkPortNumber": 1
    },
    {
      "channel": 157,
      "downlinkMac": "68:9a:87:77:d1:a1",
      "essid": "WiFiNetwork",
      "experienceScore": 97,
      "networkId": "691f5ce05644140db67310a6",
      "protocol": "ac",
      "radioBand": "na",
      "type": "WIRELESS",
      "uplinkMac": "e0:63:da:c1:a0:b2"
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `edges` | array | Array of network connections/edges |
| `downlinkMac` | string | MAC address of downstream device |
| `uplinkMac` | string | MAC address of upstream device |
| `type` | string | Connection type: `WIRED`, `WIRELESS` |
| `duplex` | string | Duplex mode: `FULL_DUPLEX`, `HALF_DUPLEX` (wired only) |
| `rateMbps` | integer | Link speed in Mbps (wired only) |
| `uplinkPortNumber` | integer | Port number on upstream device (wired only) |
| `downlinkPortNumber` | integer | Port number on downstream device (wired only) |
| `channel` | integer | WiFi channel (wireless only) |
| `essid` | string | WiFi SSID (wireless only) |
| `protocol` | string | WiFi protocol: `ac`, `ax`, `n` (wireless only) |
| `radioBand` | string | Radio band: `na` (5GHz), `ng` (2.4GHz) (wireless only) |
| `experienceScore` | integer | Client experience score 0-100 (wireless only) |
| `networkId` | string | Network/VLAN ID |

**Notes:**
- Returns network topology showing connections between devices
- Includes both wired and wireless connections
- Read-only endpoint

