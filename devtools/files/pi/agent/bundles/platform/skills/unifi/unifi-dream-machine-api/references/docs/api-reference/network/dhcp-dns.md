# DHCP & DNS Configuration

**Category:** Network Management

[← Back to API Reference](../README.md)

---

The UniFi Dream Machine uses **dnsmasq** internally for DHCP and DNS services. Configuration is managed through the Networks API and Settings API.

**Endpoint:** `/proxy/network/api/s/default`

---

## DHCP Configuration

#### Method: `list` (Get DHCP Configuration)

**HTTP Method:** GET

**Endpoint:** `/rest/networkconf`

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
      "ip_subnet": "192.168.1.1/24",
      "networkgroup": "LAN",
      "vlan_enabled": false,
      "domain_name": "localdomain",
      "dhcpd_enabled": true,
      "dhcpd_start": "192.168.1.6",
      "dhcpd_stop": "192.168.1.254",
      "dhcpd_leasetime": 86400,
      "dhcpd_dns_enabled": true,
      "dhcpd_gateway_enabled": true,
      "dhcpguard_enabled": false,
      "dhcpdv6_enabled": false,
      "dhcpdv6_start": "::2",
      "dhcpdv6_stop": "::7d1",
      "dhcpdv6_leasetime": 86400,
      "dhcpdv6_dns_auto": true,
      "is_nat": true,
      "mdns_enabled": true,
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**DHCP Configuration Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `dhcpd_enabled` | boolean | Enable/disable DHCP server |
| `dhcpd_start` | string | DHCP pool start IP address |
| `dhcpd_stop` | string | DHCP pool end IP address |
| `dhcpd_leasetime` | integer | DHCP lease time in seconds |
| `dhcpd_dns_enabled` | boolean | Provide DNS server via DHCP |
| `dhcpd_gateway_enabled` | boolean | Provide gateway via DHCP |
| `dhcpguard_enabled` | boolean | Enable DHCP guard (prevent rogue DHCP servers) |
| `domain_name` | string | Domain name provided to DHCP clients |
| `dhcpdv6_enabled` | boolean | Enable DHCPv6 server |
| `dhcpdv6_start` | string | DHCPv6 pool start address |
| `dhcpdv6_stop` | string | DHCPv6 pool end address |
| `dhcpdv6_leasetime` | integer | DHCPv6 lease time in seconds |
| `dhcpdv6_dns_auto` | boolean | Auto-configure DHCPv6 DNS |

#### Method: `create` (Create Network with DHCP)

**HTTP Method:** POST

**Endpoint:** `/rest/networkconf`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with network and DHCP configuration

**Required Fields:**
- `name` (string): Network name
- `purpose` (string): Network purpose
- `ip_subnet` (string): Network subnet in CIDR notation
- `dhcpd_enabled` (boolean): Enable DHCP server
- `dhcpd_start` (string): DHCP pool start IP
- `dhcpd_stop` (string): DHCP pool end IP

**Optional Fields:**
See Response Fields table above for all available configuration fields.

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
      "ip_subnet": "192.168.1.1/24",
      "networkgroup": "LAN",
      "dhcpd_enabled": true,
      "dhcpd_start": "192.168.1.6",
      "dhcpd_stop": "192.168.1.254",
      "dhcpd_leasetime": 86400,
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Creates new network with DHCP configuration
- See Networks API for full field list


#### Method: `update` (Update DHCP Configuration)

**HTTP Method:** PUT

**Endpoint:** `/rest/networkconf/{network_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `network_id` (path, required): Network ID to update
- Request body: JSON object with DHCP configuration fields

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
      "dhcpd_enabled": true,
      "dhcpd_start": "192.168.1.6",
      "dhcpd_stop": "192.168.1.254",
      "dhcpd_leasetime": 86400,
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Only include fields you want to update
- Changes take effect immediately
- Existing DHCP leases are not affected until renewal

---

## DHCP Reservations

#### Method: `list` (Get DHCP Reservations)

**HTTP Method:** GET

**Endpoint:** `/rest/user`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication

**Response:**

Returns all clients. Filter by `use_fixedip == true` for DHCP reservations.

```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f5d165644140db67310c4",
      "mac": "aa:bb:cc:dd:ee:ff",
      "name": "My Device",
      "hostname": "my-device",
      "use_fixedip": true,
      "fixed_ip": "192.168.1.114",
      "last_connection_network_id": "691f5ce05644140db67310a6",
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**DHCP Reservation Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `mac` | string | Client MAC address (identifier) |
| `use_fixedip` | boolean | Enable static IP assignment |
| `fixed_ip` | string | Reserved IP address |
| `name` | string | Client name/alias |
| `hostname` | string | Client hostname |
| `network_id` | string | Network ID for VLAN assignment |

#### Method: `set` (Create/Update DHCP Reservation)

**HTTP Method:** PUT

**Endpoint:** `/rest/user/{mac_address}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `mac_address` (path, required): Client MAC address (format: aa:bb:cc:dd:ee:ff)
- Request body: JSON object with reservation fields

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f5d165644140db67310c4",
      "mac": "aa:bb:cc:dd:ee:ff",
      "use_fixedip": true,
      "fixed_ip": "192.168.1.114",
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Set `use_fixedip: false` to remove reservation
- MAC address must be in lowercase with colon separators

---

## DNS Verification Settings

#### Method: `get` (Get DNS Verification Settings)

**HTTP Method:** GET

**Endpoint:** `/get/setting`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication

**Response:**
Filter response by `key == "connectivity"` for DNS verification settings.

```json
{
  "key": "connectivity",
  "enabled": true,
  "dns_verification": {
    "setting_preference": "auto",
    "primary_dns_server": "1.1.1.1",
    "secondary_dns_server": "8.8.8.8",
    "domain": "ui.com"
  }
}
```

**DNS Verification Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `dns_verification.setting_preference` | string | DNS preference: "auto" or "manual" |
| `dns_verification.primary_dns_server` | string | Primary DNS server for verification |
| `dns_verification.secondary_dns_server` | string | Secondary DNS server for verification |
| `dns_verification.domain` | string | Domain for DNS verification tests |

#### Method: `set` (Update DNS Verification Settings)

**HTTP Method:** PUT

**Endpoint:** `/rest/setting/connectivity`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with dns_verification fields

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "key": "connectivity",
      "enabled": true,
      "dns_verification": {
        "setting_preference": "auto",
        "primary_dns_server": "1.1.1.1",
        "secondary_dns_server": "8.8.8.8",
        "domain": "ui.com"
      }
    }
  ]
}
```

---

## DHCP Snooping

#### Method: `get` (Get DHCP Snooping Settings)

**HTTP Method:** GET

**Endpoint:** `/get/setting`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication

**Response:**
Filter response by `key == "switch"` for DHCP snooping settings.

```json
{
  "key": "switch",
  "dhcp_snoop": true,
  "flood_known_protocols": true,
  "site_id": "691f5ca15644140db673108c"
}
```

**DHCP Snooping Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `dhcp_snoop` | boolean | Enable DHCP snooping on switches |
| `flood_known_protocols` | boolean | Flood known protocols |

---

## Limitations

### DHCP Leases
- **Active DHCP leases cannot be queried via REST API**
- Endpoints `/stat/dhcp_lease` and `/list/dhcp_lease` return 404/400 errors
- Use SSH access: `/var/lib/misc/dnsmasq.leases`
- Or MongoDB: `db.stat.find({key: "dhcp_lease"})`

---

## Related Documentation

- [DNS Records (Static DNS)](dns-records.md) - **API V2 for managing custom DNS records**
- [Networks API](networks.md) - Full network configuration
- [Settings API](../system/settings.md) - System-wide settings

