# UniFi API V2 Reference

**Category:** Reference

[← Back to API Reference](README.md)

---

**Base Path:** `/proxy/network/v2/api/site/{site}`

**Authentication:** `X-Api-Key` header required

---

## Available V2 Endpoints

### Network Management

| Resource | Endpoint | Documentation |
|----------|----------|---------------|
| DNS Records | `/proxy/network/v2/api/site/{site}/static-dns` | [DNS Records](network/dns-records.md) |
| Traffic Rules | `/proxy/network/v2/api/site/{site}/trafficrules` | [Traffic Rules](network/traffic-rules.md) |
| NAT Rules | `/proxy/network/v2/api/site/{site}/nat` | [NAT](network/nat.md) |
| Network Topology | `/proxy/network/v2/api/site/{site}/topology` | [Topology](network/topology.md) |
| AP Groups | `/proxy/network/v2/api/site/{site}/apgroups` | [AP Groups](network/ap-groups.md) |
| QoS Rules | `/proxy/network/v2/api/site/{site}/qos-rules` | [QoS Rules](network/qos-rules.md) |

### Security

| Resource | Endpoint | Documentation |
|----------|----------|---------------|
| Firewall Zones | `/proxy/network/v2/api/site/{site}/firewall/zone` | [Firewall Zones](security/firewall-zones.md) |
| Firewall Zone Matrix | `/proxy/network/v2/api/site/{site}/firewall/zone-matrix` | [Zone Matrix](security/firewall-zone-matrix.md) |
| Firewall Policies | `/proxy/network/v2/api/site/{site}/firewall-policies` | [Firewall Policies](security/firewall-policies.md) |
| IP Groups | `/proxy/network/v2/api/site/{site}/ip-groups` | [IP Groups](security/ip-groups.md) |

### Monitoring

| Resource | Endpoint | Documentation |
|----------|----------|---------------|
| Alerts | `/proxy/network/v2/api/site/{site}/alert` | [Alerts](monitoring/alerts.md) |
| Notifications | `/proxy/network/v2/api/site/{site}/notifications` | [Notifications](monitoring/notifications.md) |

### System

| Resource | Endpoint | Documentation |
|----------|----------|---------------|
| Devices | `/proxy/network/v2/api/site/{site}/device` | [Devices V2](system/devices-v2.md) |
| Feature Flags | `/proxy/network/v2/api/site/{site}/described-features` | [Feature Flags](system/feature-flags.md) |
