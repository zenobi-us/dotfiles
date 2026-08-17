# Networks

**Category:** Network Management

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/rest/networkconf`

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
      "_id": "691f5ce05644140db67310a6",
      "name": "Default",
      "purpose": "corporate",
      "vlan_enabled": false,
      "dhcpd_enabled": true,
      "dhcpd_start": "192.168.1.6",
      "dhcpd_stop": "192.168.1.254",
      "dhcpguard_enabled": false,
      "dhcpd_leasetime": 86400,
      "dhcpd_dns_enabled": true,
      "dhcpd_gateway_enabled": true,
      "dhcpd_time_offset_enabled": false,
      "ipv6_interface_type": "none",
      "domain_name": "localdomain",
      "is_nat": true,
      "enabled": true,
      "ip_subnet": "192.168.1.1/24",
      "networkgroup": "LAN",
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Alternative endpoint: `/list/networkconf` (same response)
- Returns all configured networks and VLANs

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Unique network ID |
| `name` | string | Network name |
| `purpose` | string | Network purpose: `corporate`, `guest`, `wan`, `vlan-only`, `remote-user-vpn` |
| `vlan_enabled` | boolean | Whether VLAN tagging is enabled |
| `vlan` | integer | VLAN ID (if vlan_enabled) |
| `dhcpd_enabled` | boolean | DHCP server enabled |
| `dhcpd_start` | string | DHCP range start IP |
| `dhcpd_stop` | string | DHCP range end IP |
| `dhcpd_leasetime` | integer | DHCP lease time in seconds |
| `dhcpd_dns_enabled` | boolean | Provide DNS via DHCP |
| `dhcpd_gateway_enabled` | boolean | Provide gateway via DHCP |
| `ip_subnet` | string | Network subnet in CIDR notation |
| `is_nat` | boolean | NAT enabled |
| `enabled` | boolean | Network enabled |
| `networkgroup` | string | Network group: `LAN`, `WAN` |
| `site_id` | string | Site ID |


#### Method: `get`

**HTTP Method:** GET

**Endpoint:** `/rest/networkconf/{network_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `network_id` (path, required): Network ID

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f5ce05644140db67310a6",
      "name": "Default",
      "purpose": "corporate",
      "vlan_enabled": false,
      "dhcpd_enabled": true,
      "dhcpd_start": "192.168.1.6",
      "dhcpd_stop": "192.168.1.254",
      "dhcpguard_enabled": false,
      "dhcpd_leasetime": 86400,
      "dhcpd_dns_enabled": true,
      "dhcpd_gateway_enabled": true,
      "dhcpd_time_offset_enabled": false,
      "ipv6_interface_type": "none",
      "domain_name": "localdomain",
      "is_nat": true,
      "enabled": true,
      "ip_subnet": "192.168.1.1/24",
      "networkgroup": "LAN",
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Returns single network configuration by ID


#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with network configuration

**Required Fields:**
- `name` (string): Network name
- `purpose` (string): Network purpose (`corporate`, `guest`, `wan`, `vlan-only`, `remote-user-vpn`)
- `ip_subnet` (string): Network subnet in CIDR notation (e.g., `192.168.10.1/24`)
- `networkgroup` (string): Network group (`LAN` or `WAN`)

**Optional Fields:**
- `vlan_enabled` (boolean): Enable VLAN tagging (default: `false`)
- `vlan` (integer): VLAN ID (required if `vlan_enabled` is `true`)
- `dhcpd_enabled` (boolean): Enable DHCP server (default: `true`)
- `dhcpd_start` (string): DHCP range start IP (e.g., `192.168.10.10`)
- `dhcpd_stop` (string): DHCP range end IP (e.g., `192.168.10.254`)
- `dhcpd_leasetime` (integer): DHCP lease time in seconds (default: `86400`)
- `dhcpd_dns_enabled` (boolean): Provide DNS via DHCP (default: `true`)
- `dhcpd_gateway_enabled` (boolean): Provide gateway via DHCP (default: `true`)
- `is_nat` (boolean): Enable NAT (default: `true`)
- `enabled` (boolean): Network enabled (default: `true`)
- `domain_name` (string): Domain name for DHCP clients (default: `localdomain`)
- `ipv6_interface_type` (string): IPv6 interface type (`none`, `static`, `pd`)
- `dhcpguard_enabled` (boolean): Enable DHCP guard (default: `false`)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f5ce05644140db67310a6",
      "name": "Default",
      "purpose": "corporate",
      "vlan_enabled": false,
      "dhcpd_enabled": true,
      "dhcpd_start": "192.168.1.6",
      "dhcpd_stop": "192.168.1.254",
      "dhcpguard_enabled": false,
      "dhcpd_leasetime": 86400,
      "dhcpd_dns_enabled": true,
      "dhcpd_gateway_enabled": true,
      "dhcpd_time_offset_enabled": false,
      "ipv6_interface_type": "none",
      "domain_name": "localdomain",
      "is_nat": true,
      "enabled": true,
      "ip_subnet": "192.168.1.1/24",
      "networkgroup": "LAN",
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Creates new network/VLAN configuration


#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/rest/networkconf/{network_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `network_id` (path, required): Network ID to update
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f5ce05644140db67310a6",
      "name": "Default",
      "purpose": "corporate",
      "vlan_enabled": false,
      "dhcpd_enabled": true,
      "dhcpd_start": "192.168.1.6",
      "dhcpd_stop": "192.168.1.254",
      "dhcpguard_enabled": false,
      "dhcpd_leasetime": 86400,
      "dhcpd_dns_enabled": true,
      "dhcpd_gateway_enabled": true,
      "dhcpd_time_offset_enabled": false,
      "ipv6_interface_type": "none",
      "domain_name": "localdomain",
      "is_nat": true,
      "enabled": true,
      "ip_subnet": "192.168.1.1/24",
      "networkgroup": "LAN",
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

**Endpoint:** `/rest/networkconf/{network_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `network_id` (path, required): Network ID to delete

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
- Cannot delete default networks (attr_no_delete: true)

---
