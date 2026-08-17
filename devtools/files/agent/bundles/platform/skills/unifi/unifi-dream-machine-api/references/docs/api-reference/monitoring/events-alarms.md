# Events & Alarms

**Category:** Monitoring

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/stat/event`

---

#### Method: `list`

**HTTP Method:** GET

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body (optional): JSON object with filter parameters
  - `within` (integer): Hours to look back
  - `_limit` (integer): Maximum number of results
  - `_sort` (string): Sort field (prefix with `-` for descending)
  - `key` (string): Filter by event type key

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f9e1a5644140db6735abc",
      "key": "EVT_WU_Connected",
      "time": 1732291234567,
      "datetime": "2024-11-22T15:30:34Z",
      "msg": "User[00:11:22:33:44:55] has connected to AP[Living Room]",
      "user": "00:11:22:33:44:55",
      "hostname": "iPhone",
      "ap": "Living Room",
      "ap_name": "Living Room",
      "ssid": "MyWiFi",
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Alternative endpoint: `/list/event` (same response)
- Returns system events (device connections, configuration changes, etc.)

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Unique event ID |
| `key` | string | Event type key |
| `time` | integer | Unix timestamp (milliseconds) |
| `datetime` | string | ISO 8601 datetime |
| `msg` | string | Human-readable message |
| `user` | string | User/device MAC address |
| `hostname` | string | Device hostname |
| `ap` | string | Access point name |
| `ssid` | string | WiFi SSID |
| `site_id` | string | Site ID |

---

## Common Event Types

| Key | Description |
|-----|-------------|
| `EVT_WU_Connected` | Wireless user connected |
| `EVT_WU_Disconnected` | Wireless user disconnected |
| `EVT_LU_Connected` | Wired user connected |
| `EVT_LU_Disconnected` | Wired user disconnected |
| `EVT_AP_Connected` | Access point connected |
| `EVT_AP_Disconnected` | Access point disconnected |
| `EVT_AP_Upgraded` | Access point upgraded |
| `EVT_AP_Restarted` | Access point restarted |
| `EVT_GW_WANTransition` | WAN failover/transition |
| `EVT_GW_Upgraded` | Gateway upgraded |
| `EVT_GW_Restarted` | Gateway restarted |
| `EVT_SW_Connected` | Switch connected |
| `EVT_SW_Disconnected` | Switch disconnected |
| `EVT_IPS_IpsAlert` | IPS/IDS alert |
| `EVT_AD_Login` | Admin login |

---

## Alarms

**Endpoint:** `/list/alarm`

#### Method: `list`

**HTTP Method:** GET

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body (optional): JSON object with filter parameters
  - `archived` (boolean): Filter by archived status

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f9f2b5644140db6735bcd",
      "key": "EVT_AP_Disconnected",
      "time": 1732291234567,
      "datetime": "2024-11-22T15:30:34Z",
      "msg": "Access Point[Bedroom] was disconnected",
      "ap": "Bedroom",
      "ap_name": "Bedroom",
      "archived": false,
      "handled": false,
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Alternative endpoint: `/stat/alarm` (same response)
- Returns active and archived alarms

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Unique alarm ID |
| `key` | string | Alarm type key |
| `time` | integer | Unix timestamp (milliseconds) |
| `datetime` | string | ISO 8601 datetime |
| `msg` | string | Human-readable message |
| `archived` | boolean | Alarm archived |
| `handled` | boolean | Alarm handled |
| `site_id` | string | Site ID |


#### Method: `archive`

**HTTP Method:** POST

**Endpoint:** `/cmd/evtmgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with command
  - `cmd` (required): `archive-alarm`
  - `_id` (required): Alarm ID to archive

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": []
}
```

**Notes:**
- Archives single alarm by ID


#### Method: `archive_all`

**HTTP Method:** POST

**Endpoint:** `/cmd/evtmgr`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with command
  - `cmd` (required): `archive-all-alarms`

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": []
}
```

**Notes:**
- Archives all active alarms

---

## Query Parameters

### Time Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| `within` | integer | Events within last N hours |
| `start` | integer | Start timestamp (milliseconds) |
| `end` | integer | End timestamp (milliseconds) |

### Pagination

| Parameter | Type | Description |
|-----------|------|-------------|
| `_limit` | integer | Maximum results to return |
| `_skip` | integer | Number of results to skip |
| `_sort` | string | Sort field (prefix with `-` for descending) |

### Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | string | Filter by event type |
| `user` | string | Filter by MAC address |
| `ap` | string | Filter by AP name |
| `archived` | boolean | Filter archived alarms |

---
