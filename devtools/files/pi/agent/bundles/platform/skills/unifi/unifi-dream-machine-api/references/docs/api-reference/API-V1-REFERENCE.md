# UniFi API V1 REST Reference

**Category:** Reference

[← Back to API Reference](README.md)

---

**Base Path:** `/proxy/network/api/s/{site}/rest`

**Authentication:** `X-Api-Key` header required

---

## Available V1 REST Endpoints

### Core

| Resource | Endpoint | Documentation |
|----------|----------|---------------|
| Sites | `/proxy/network/api/self/sites` | [Sites](core/sites.md) |
| Accounts | `/proxy/network/api/s/{site}/rest/account` | [Accounts](core/accounts.md) |

### Network Management

| Resource | Endpoint | Documentation |
|----------|----------|---------------|
| Networks | `/rest/networkconf` | [Networks](network/networks.md) |
| WiFi | `/rest/wlanconf` | [WiFi](network/wifi.md) |
| WLAN Groups | `/rest/wlangroup` | [WLAN Groups](network/wlan-groups.md) |
| Routing | `/rest/routing` | [Routing](network/routing.md) |
| Port Forwarding | `/rest/portforward` | [Port Forwarding](network/port-forwarding.md) |
| Dynamic DNS | `/rest/dynamicdns` | [Dynamic DNS](network/dynamic-dns.md) |
| Users | `/rest/user` | [Users](network/users.md) |
| User Groups | `/rest/usergroup` | [User Groups](network/user-groups.md) |
| Port Configuration | `/rest/portconf` | [Port Config](network/port-config.md) |
| Tags | `/rest/tag` | [Tags](network/tags.md) |
| Hotspot Operators | `/rest/hotspotop` | [Guest Portal](network/guest-portal.md) |
| VPN Servers | `/rest/vpnserver` | [VPN Servers](network/vpn-servers.md) |
| VPN Clients | `/rest/vpnclient`, `/stat/vpn` | [VPN Clients](network/vpn-clients.md) |

### Security

| Resource | Endpoint | Documentation |
|----------|----------|---------------|
| Firewall Rules | `/rest/firewallrule` | [Firewall Rules](security/firewall-rules.md) |
| Firewall Groups | `/rest/firewallgroup` | [Firewall Groups](security/firewall-groups.md) |
| RADIUS Profiles | `/rest/radiusprofile` | [RADIUS](security/radius.md) |

### Monitoring

| Resource | Endpoint | Documentation |
|----------|----------|---------------|
| Events | `/stat/event` | [Events & Alarms](monitoring/events-alarms.md) |
| Alarms | `/stat/alarm` | [Events & Alarms](monitoring/events-alarms.md) |
| DPI Stats | `/stat/dpi` | [DPI & Traffic](monitoring/dpi-traffic.md) |
| Dashboard | `/stat/dashboard` | [Dashboard](monitoring/dashboard.md) |
| Health | `/stat/health` | [Health](monitoring/health.md) |
| Clients | `/stat/sta` | [Clients](monitoring/clients.md) |
| All Users | `/stat/alluser` | [All Users](monitoring/all-users.md) |
| Guest Access | `/stat/guest` | [Guest Access](monitoring/guest-access.md) |
| IPS Events | `/stat/ips/event` | [IPS Events](security/ips-events.md) |
| Rogue APs | `/stat/rogueap` | [Rogue APs](security/rogue-aps.md) |
| Statistics | `/stat/report/hourly.*` | [Statistics](monitoring/statistics.md) |

### System

| Resource | Endpoint | Documentation |
|----------|----------|---------------|
| Settings | `/rest/setting` | [Settings](system/settings.md) |
| Devices | `/stat/device` | [Devices](system/devices.md) |
| Device Basic | `/stat/device-basic` | [Device Basic](system/device-basic.md) |
| System Info | `/stat/sysinfo` | [System Info](system/system-info.md) |
| Client Commands | `/cmd/stamgr`, `/upd/user/{id}` | [Client Commands](system/client-commands.md) |
| Device Commands | `/cmd/devmgr`, `/rest/device/{id}` | [Device Commands](system/device-commands.md) |
| Backup & Restore | `/cmd/backup`, `/cmd/restore` | [Backup & Restore](system/backup-restore.md) |
| System Commands | `/cmd/system`, `/stat/status` | [System Commands](system/system-commands.md) |
| Site Management | `/api/self/sites`, `/cmd/sitemgr` | [Site Management](system/site-management.md) |
| Admin Management | `/api/stat/admin`, `/cmd/sitemgr` | [Admin Management](system/admin-management.md) |

