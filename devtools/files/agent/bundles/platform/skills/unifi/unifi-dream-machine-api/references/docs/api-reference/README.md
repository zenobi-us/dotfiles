# API Reference

[← Back to Documentation](../../README.md)

---

## Authentication

All API endpoints require authentication via API key in the `X-Api-Key` header.

**Create API Key:**
1. Log in to UniFi Network UI
2. Navigate to Settings → Admins
3. Select your admin account
4. Click "Create API Token"
5. Copy and save the token securely

---

## API Versions

### [API V1 REST Reference](API-V1-REFERENCE.md)

**Base Path:** `/proxy/network/api/s/{site}/rest`

Legacy REST API with 31 endpoints covering traditional UniFi features.

### [API V2 Reference](API-V2-REFERENCE.md)

**Base Path:** `/proxy/network/v2/api/site/{site}`

Modern REST API with 12 endpoints for newer features (DNS records, traffic rules, firewall zones, topology).

---

## Response Formats

**V1 REST API:**
```json
{
  "meta": {"rc": "ok"},
  "data": [{"_id": "123", "name": "example"}]
}
```

**V2 API:**
```json
[
  {"_id": "123", "name": "example"}
]
```

---

## Endpoints by Category

### Core

- **[Authentication](core/authentication.md)** - API key and session authentication
- **[Sites](core/sites.md)** - Site management
- **[Accounts](core/accounts.md)** - RADIUS accounting records
- **[API Methods](core/api-methods.md)** - REST, LIST, STAT, and GET patterns

### Network

- **[Networks](network/networks.md)** - Network and VLAN configuration
- **[WiFi](network/wifi.md)** - WiFi network configuration
- **[WLAN Groups](network/wlan-groups.md)** - WLAN group management
- **[DNS Records](network/dns-records.md)** - Static DNS (V2 API only)
- **[DHCP & DNS](network/dhcp-dns.md)** - DHCP and DNS configuration
- **[Routing](network/routing.md)** - Static route management
- **[Routing Table](network/routing-table.md)** - Active routing table
- **[Port Forwarding](network/port-forwarding.md)** - NAT port forwarding
- **[Dynamic DNS](network/dynamic-dns.md)** - Dynamic DNS configuration
- **[Users](network/users.md)** - Client configurations and DHCP reservations
- **[User Groups](network/user-groups.md)** - Client user groups and QoS
- **[Port Configuration](network/port-config.md)** - Switch port profiles
- **[Tags](network/tags.md)** - Device and client tags
- **[Guest Portal](network/guest-portal.md)** - Hotspot operators, vouchers, payments
- **[RF Environment](network/rf-environment.md)** - Channel assignments and country codes
- **[Traffic Rules](network/traffic-rules.md)** - Traffic rules (V2 API only)
- **[NAT Rules](network/nat.md)** - NAT rules (V2 API only)
- **[Network Topology](network/topology.md)** - Network topology (V2 API only)
- **[AP Groups](network/ap-groups.md)** - AP groups (V2 API only)

### Security

- **[Firewall Rules](security/firewall-rules.md)** - Firewall rule management
- **[Firewall Groups](security/firewall-groups.md)** - Address and port groups
- **[Firewall Zones](security/firewall-zones.md)** - Firewall zones (V2 API only)
- **[Firewall Zone Matrix](security/firewall-zone-matrix.md)** - Zone matrix (V2 API only)
- **[Firewall Policies](security/firewall-policies.md)** - Zone policies (V2 API only)
- **[RADIUS](security/radius.md)** - RADIUS profiles and accounts
- **[IPS Events](security/ips-events.md)** - Intrusion Prevention System events
- **[Rogue APs](security/rogue-aps.md)** - Detected nearby access points
- **[Authorization](security/authorization.md)** - Client authorization records

### Monitoring

- **[Events & Alarms](monitoring/events-alarms.md)** - System events and alarms
- **[Alerts](monitoring/alerts.md)** - Alerts (V2 API only)
- **[Notifications](monitoring/notifications.md)** - Notifications (V2 API only)
- **[DPI & Traffic](monitoring/dpi-traffic.md)** - Deep Packet Inspection statistics
- **[DPI Stats](monitoring/dpi-stats.md)** - Site and client DPI statistics
- **[Dashboard](monitoring/dashboard.md)** - Dashboard statistics and overview
- **[Health](monitoring/health.md)** - Network subsystem health status
- **[Reports](monitoring/reports.md)** - Daily and hourly statistics reports
- **[Detailed Reports](monitoring/detailed-reports.md)** - 5-minute, hourly, and daily reports
- **[Clients](monitoring/clients.md)** - Connected client information
- **[All Users](monitoring/all-users.md)** - All users (current and historical)
- **[Guest Access](monitoring/guest-access.md)** - Authorized guest users

### System

- **[System](system/system.md)** - UniFi OS system information
- **[System Info](system/system-info.md)** - Network Application system information
- **[Settings](system/settings.md)** - System settings and configuration
- **[Devices](system/devices.md)** - UniFi device management
- **[Devices V2](system/devices-v2.md)** - Devices (V2 API only)
- **[Device Basic Info](system/device-basic.md)** - Basic device information (lightweight)
- **[Feature Flags](system/feature-flags.md)** - Feature flags (V2 API only)
- **[Network Status](system/network-status.md)** - Network Application status
