# WiFi

**Category:** Network Management

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/rest/wlanconf`

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
      "_id": "691f799e5644140db6733e8d",
      "name": "MyWiFi",
      "enabled": true,
      "security": "wpapsk",
      "wpa_mode": "wpa2",
      "wpa_enc": "ccmp",
      "x_passphrase": "MySecurePassword",
      "usergroup_id": "691f5ce05644140db67310a6",
      "wlangroup_id": "691f5ce05644140db67310a7",
      "is_guest": false,
      "hide_ssid": false,
      "no2ghz_oui": false,
      "minrate_ng_enabled": false,
      "minrate_na_enabled": false,
      "mac_filter_enabled": false,
      "mac_filter_policy": "allow",
      "mac_filter_list": [],
      "bc_filter_enabled": false,
      "bc_filter_list": [],
      "group_rekey": 3600,
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Alternative endpoint: `/list/wlanconf` (same response)
- Returns all configured WiFi networks (WLANs)

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Unique WLAN ID |
| `name` | string | SSID name |
| `enabled` | boolean | WiFi network enabled |
| `security` | string | Security type: `open`, `wpapsk`, `wpaeap` |
| `wpa_mode` | string | WPA mode: `wpa`, `wpa2`, `wpa3` |
| `wpa_enc` | string | Encryption: `ccmp` (AES), `tkip` |
| `x_passphrase` | string | WiFi password (WPA-PSK) |
| `usergroup_id` | string | Associated network/VLAN ID |
| `wlangroup_id` | string | WLAN group ID |
| `is_guest` | boolean | Guest network |
| `hide_ssid` | boolean | Hide SSID broadcast |
| `mac_filter_enabled` | boolean | MAC filtering enabled |
| `mac_filter_policy` | string | `allow` or `deny` |
| `mac_filter_list` | array | List of MAC addresses |
| `group_rekey` | integer | Group rekey interval (seconds) |
| `site_id` | string | Site ID |


#### Method: `get`

**HTTP Method:** GET

**Endpoint:** `/rest/wlanconf/{wlan_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `wlan_id` (path, required): WLAN ID

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f799e5644140db6733e8d",
      "name": "MyWiFi",
      "enabled": true,
      "security": "wpapsk",
      "wpa_mode": "wpa2",
      "wpa_enc": "ccmp",
      "x_passphrase": "MySecurePassword",
      "usergroup_id": "691f5ce05644140db67310a6",
      "wlangroup_id": "691f5ce05644140db67310a7",
      "is_guest": false,
      "hide_ssid": false,
      "no2ghz_oui": false,
      "minrate_ng_enabled": false,
      "minrate_na_enabled": false,
      "mac_filter_enabled": false,
      "mac_filter_policy": "allow",
      "mac_filter_list": [],
      "bc_filter_enabled": false,
      "bc_filter_list": [],
      "group_rekey": 3600,
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Returns single WiFi network configuration by ID


#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with WLAN configuration

**Required Fields:**
- `name` (string): SSID name
- `enabled` (boolean): Enable/disable WiFi network
- `security` (string): Security type (`open`, `wpapsk`, `wpaeap`, `wpa-psk`, `wpa2-psk`, `wpa3`)
- `usergroup_id` (string): Associated network/VLAN ID
- `wlangroup_id` (string): WLAN group ID

**Security-Specific Required Fields:**
- For `wpapsk`/`wpa-psk`/`wpa2-psk`:
  - `wpa_mode` (string): WPA mode (`wpa`, `wpa2`, `wpa3`)
  - `wpa_enc` (string): Encryption (`ccmp` for AES, `tkip`)
  - `x_passphrase` (string): WiFi password
- For `wpaeap`:
  - `wpa_mode` (string): WPA mode (`wpa`, `wpa2`, `wpa3`)
  - `wpa_enc` (string): Encryption (`ccmp`, `tkip`)
  - `radiusprofile_id` (string): RADIUS profile ID

**Optional Fields:**
- `hide_ssid` (boolean): Hide SSID broadcast (default: `false`)
- `is_guest` (boolean): Guest network (default: `false`)
- `mac_filter_enabled` (boolean): Enable MAC filtering (default: `false`)
- `mac_filter_policy` (string): MAC filter policy (`allow` or `deny`)
- `mac_filter_list` (array): List of MAC addresses to allow/deny
- `group_rekey` (integer): Group rekey interval in seconds (default: `3600`)
- `bc_filter_enabled` (boolean): Enable broadcast filtering (default: `false`)
- `bc_filter_list` (array): Broadcast filter list
- `minrate_ng_enabled` (boolean): Enable minimum rate for 2.4GHz (default: `false`)
- `minrate_na_enabled` (boolean): Enable minimum rate for 5GHz (default: `false`)
- `no2ghz_oui` (boolean): Disable 2.4GHz for specific OUIs (default: `false`)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f799e5644140db6733e8d",
      "name": "MyWiFi",
      "enabled": true,
      "security": "wpapsk",
      "wpa_mode": "wpa2",
      "wpa_enc": "ccmp",
      "x_passphrase": "MySecurePassword",
      "usergroup_id": "691f5ce05644140db67310a6",
      "wlangroup_id": "691f5ce05644140db67310a7",
      "is_guest": false,
      "hide_ssid": false,
      "no2ghz_oui": false,
      "minrate_ng_enabled": false,
      "minrate_na_enabled": false,
      "mac_filter_enabled": false,
      "mac_filter_policy": "allow",
      "mac_filter_list": [],
      "bc_filter_enabled": false,
      "bc_filter_list": [],
      "group_rekey": 3600,
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Creates new WiFi network (SSID)
- For open networks, no security fields are required


#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/rest/wlanconf/{wlan_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `wlan_id` (path, required): WLAN ID to update
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f799e5644140db6733e8d",
      "name": "MyWiFi",
      "enabled": true,
      "security": "wpapsk",
      "wpa_mode": "wpa2",
      "wpa_enc": "ccmp",
      "x_passphrase": "MySecurePassword",
      "usergroup_id": "691f5ce05644140db67310a6",
      "wlangroup_id": "691f5ce05644140db67310a7",
      "is_guest": false,
      "hide_ssid": false,
      "no2ghz_oui": false,
      "minrate_ng_enabled": false,
      "minrate_na_enabled": false,
      "mac_filter_enabled": false,
      "mac_filter_policy": "allow",
      "mac_filter_list": [],
      "bc_filter_enabled": false,
      "bc_filter_list": [],
      "group_rekey": 3600,
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Must include `_id` field in request body
- Only include fields to update


#### Method: `delete`

**HTTP Method:** DELETE

**Endpoint:** `/rest/wlanconf/{wlan_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `wlan_id` (path, required): WLAN ID to delete

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": []
}
```

---

## WLAN Groups

**Endpoint:** `/rest/wlangroup`

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
      "_id": "691f5ce05644140db67310a7",
      "name": "Default",
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- WLAN groups control which access points broadcast which SSIDs

---

## Security Types

| Type | Description | Required Fields |
|------|-------------|-----------------|
| `open` | No security | None |
| `wpapsk` | WPA Personal (PSK) | `wpa_mode`, `wpa_enc`, `x_passphrase` |
| `wpaeap` | WPA Enterprise (802.1X) | `wpa_mode`, `wpa_enc`, `radiusprofile_id` |

## WPA Modes

| Mode | Description |
|------|-------------|
| `wpa` | WPA (legacy) |
| `wpa2` | WPA2 (recommended) |
| `wpa3` | WPA3 (most secure) |

## Encryption Types

| Type | Description |
|------|-------------|
| `ccmp` | AES-CCMP (recommended) |
| `tkip` | TKIP (legacy, insecure) |

---
