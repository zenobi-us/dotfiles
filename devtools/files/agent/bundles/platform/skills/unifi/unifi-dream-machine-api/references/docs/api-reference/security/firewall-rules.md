# Firewall Rules

**Category:** Security

[← Back to API Reference](../README.md)

---

**Endpoint:** `/proxy/network/api/s/default/rest/firewallrule`

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
      "_id": "691f8a2e5644140db6734567",
      "name": "Allow HTTPS",
      "enabled": true,
      "action": "accept",
      "protocol": "tcp",
      "dst_port": "443",
      "src_firewallgroup_ids": [],
      "dst_firewallgroup_ids": [],
      "src_networkconf_id": "691f5ce05644140db67310a6",
      "dst_networkconf_id": "WAN",
      "ruleset": "LAN_IN",
      "rule_index": 2000,
      "logging": false,
      "state_established": true,
      "state_invalid": false,
      "state_new": true,
      "state_related": true,
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Alternative endpoint: `/list/firewallrule` (same response)
- Returns all configured firewall rules

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Unique rule ID |
| `name` | string | Rule name/description |
| `enabled` | boolean | Rule enabled |
| `action` | string | Action: `accept`, `drop`, `reject` |
| `protocol` | string | Protocol: `tcp`, `udp`, `icmp`, `all` |
| `src_address` | string | Source IP/CIDR |
| `dst_address` | string | Destination IP/CIDR |
| `src_port` | string | Source port(s) |
| `dst_port` | string | Destination port(s) |
| `src_firewallgroup_ids` | array | Source firewall group IDs |
| `dst_firewallgroup_ids` | array | Destination firewall group IDs |
| `src_networkconf_id` | string | Source network ID |
| `dst_networkconf_id` | string | Destination network ID or `WAN` |
| `ruleset` | string | Ruleset (see Rulesets table below) |
| `rule_index` | integer | Rule priority (lower = higher priority) |
| `logging` | boolean | Enable logging for this rule |
| `state_established` | boolean | Match established connections |
| `state_invalid` | boolean | Match invalid connections |
| `state_new` | boolean | Match new connections |
| `state_related` | boolean | Match related connections |
| `site_id` | string | Site ID |


#### Method: `get`

**HTTP Method:** GET

**Endpoint:** `/rest/firewallrule/{rule_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `rule_id` (path, required): Firewall rule ID

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f8a2e5644140db6734567",
      "name": "Allow HTTPS",
      "enabled": true,
      "action": "accept",
      "protocol": "tcp",
      "dst_port": "443",
      "src_firewallgroup_ids": [],
      "dst_firewallgroup_ids": [],
      "src_networkconf_id": "691f5ce05644140db67310a6",
      "dst_networkconf_id": "WAN",
      "ruleset": "LAN_IN",
      "rule_index": 2000,
      "logging": false,
      "state_established": true,
      "state_invalid": false,
      "state_new": true,
      "state_related": true,
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Returns single firewall rule by ID


#### Method: `create`

**HTTP Method:** POST

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- Request body: JSON object with firewall rule configuration

**Required Fields:**
- `name` (string): Rule name/description
- `enabled` (boolean): Enable/disable rule
- `action` (string): Action to take (`accept`, `drop`, `reject`)
- `ruleset` (string): Ruleset to apply rule to (see Rulesets table below)
- `rule_index` (integer): Rule priority (lower = higher priority, e.g., `2000`)

**Optional Fields:**
- `protocol` (string): Protocol (`tcp`, `udp`, `icmp`, `all`)
- `src_address` (string): Source IP/CIDR (e.g., `192.168.1.0/24`)
- `dst_address` (string): Destination IP/CIDR
- `src_port` (string): Source port(s) (e.g., `80`, `80-443`, `80,443`)
- `dst_port` (string): Destination port(s)
- `src_firewallgroup_ids` (array): Source firewall group IDs
- `dst_firewallgroup_ids` (array): Destination firewall group IDs
- `src_networkconf_id` (string): Source network ID
- `dst_networkconf_id` (string): Destination network ID or `WAN`
- `logging` (boolean): Enable logging for this rule (default: `false`)
- `state_established` (boolean): Match established connections (default: `true`)
- `state_invalid` (boolean): Match invalid connections (default: `false`)
- `state_new` (boolean): Match new connections (default: `true`)
- `state_related` (boolean): Match related connections (default: `true`)
- `icmp_typename` (string): ICMP type name (if protocol is `icmp`)
- `ipsec` (string): IPsec mode (`match-ipsec`, `match-none`)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f8a2e5644140db6734567",
      "name": "Allow HTTPS",
      "enabled": true,
      "action": "accept",
      "protocol": "tcp",
      "dst_port": "443",
      "src_firewallgroup_ids": [],
      "dst_firewallgroup_ids": [],
      "src_networkconf_id": "691f5ce05644140db67310a6",
      "dst_networkconf_id": "WAN",
      "ruleset": "LAN_IN",
      "rule_index": 2000,
      "logging": false,
      "state_established": true,
      "state_invalid": false,
      "state_new": true,
      "state_related": true,
      "site_id": "691f5ca15644140db673108c"
    }
  ]
}
```

**Notes:**
- Creates new firewall rule


#### Method: `update`

**HTTP Method:** PUT

**Endpoint:** `/rest/firewallrule/{rule_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `rule_id` (path, required): Firewall rule ID to update
- Request body: JSON object with fields to update (see Response Fields table above for available fields)

**Response:**
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [
    {
      "_id": "691f8a2e5644140db6734567",
      "name": "Allow HTTPS",
      "enabled": true,
      "action": "accept",
      "protocol": "tcp",
      "dst_port": "443",
      "src_firewallgroup_ids": [],
      "dst_firewallgroup_ids": [],
      "src_networkconf_id": "691f5ce05644140db67310a6",
      "dst_networkconf_id": "WAN",
      "ruleset": "LAN_IN",
      "rule_index": 2000,
      "logging": false,
      "state_established": true,
      "state_invalid": false,
      "state_new": true,
      "state_related": true,
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

**Endpoint:** `/rest/firewallrule/{rule_id}`

**Parameters:**
- `X-API-KEY` (header, required): API key for authentication
- `rule_id` (path, required): Firewall rule ID to delete

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

## Rulesets

| Ruleset | Description | Direction |
|---------|-------------|-----------|
| `LAN_IN` | Traffic from LAN to other networks | Inbound to LAN |
| `LAN_OUT` | Traffic from LAN to WAN | Outbound from LAN |
| `LAN_LOCAL` | Traffic from LAN to UDM itself | To UDM |
| `WAN_IN` | Traffic from WAN to LAN | Inbound from Internet |
| `WAN_OUT` | Traffic from WAN to other networks | Outbound to Internet |
| `WAN_LOCAL` | Traffic from WAN to UDM itself | To UDM from Internet |
| `GUEST_IN` | Traffic from Guest network | Inbound to Guest |
| `GUEST_OUT` | Traffic from Guest to WAN | Outbound from Guest |

## Actions

| Action | Description |
|--------|-------------|
| `accept` | Allow traffic |
| `drop` | Silently drop traffic |
| `reject` | Drop traffic and send ICMP reject |

## Protocols

| Protocol | Description |
|----------|-------------|
| `tcp` | TCP protocol |
| `udp` | UDP protocol |
| `icmp` | ICMP protocol |
| `all` | All protocols |

---
