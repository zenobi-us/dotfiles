# API Methods Reference

**Category:** Core

[← Back to API Reference](../README.md)

---

## Overview

The UniFi Dream Machine Pro API provides multiple endpoint patterns for accessing the same data. Understanding these patterns helps you choose the most appropriate endpoint for your use case.

---

## Endpoint Patterns

### `/rest/` Endpoints

**Pattern:** `/proxy/network/api/s/{site}/rest/{resource}`

**Purpose:** Primary REST API endpoints for CRUD operations

**HTTP Methods:**
- `GET` - List/retrieve resources
- `POST` - Create new resources
- `PUT` - Update existing resources
- `DELETE` - Remove resources

**Examples:**
- `/proxy/network/api/s/default/rest/networkconf` - Network configurations
- `/proxy/network/api/s/default/rest/wlanconf` - WiFi configurations
- `/proxy/network/api/s/default/rest/firewallrule` - Firewall rules

**Notes:**
- Full CRUD support
- Returns complete resource objects
- Preferred for configuration management

---

### `/list/` Endpoints

**Pattern:** `/proxy/network/api/s/{site}/list/{resource}`

**Purpose:** Alternative read-only endpoints (legacy compatibility)

**HTTP Methods:**
- `GET` - List resources (read-only)

**Examples:**
- `/proxy/network/api/s/default/list/networkconf` - Same as `/rest/networkconf`
- `/proxy/network/api/s/default/list/wlanconf` - Same as `/rest/wlanconf`
- `/proxy/network/api/s/default/list/firewallrule` - Same as `/rest/firewallrule`

**Notes:**
- Read-only (GET only)
- Returns identical data to `/rest/` endpoints
- Provided for backward compatibility
- Use `/rest/` endpoints for new development

---

### `/stat/` Endpoints

**Pattern:** `/proxy/network/api/s/{site}/stat/{resource}`

**Purpose:** Statistics and monitoring data

**HTTP Methods:**
- `GET` - Retrieve statistics

**Examples:**
- `/proxy/network/api/s/default/stat/device` - Device statistics
- `/proxy/network/api/s/default/stat/sta` - Client statistics
- `/proxy/network/api/s/default/stat/health` - System health

**Notes:**
- Read-only
- Real-time and historical data
- Performance metrics and monitoring

---

### `/get/` Endpoints

**Pattern:** `/proxy/network/api/s/{site}/get/{resource}`

**Purpose:** Alternative getter endpoints

**HTTP Methods:**
- `GET` - Retrieve specific resources

**Examples:**
- `/proxy/network/api/s/default/get/setting` - Get settings

**Notes:**
- Read-only
- May return different format than `/rest/` or `/stat/`

---

## Endpoint Equivalents

The following endpoints return identical data:

| REST Endpoint | LIST Equivalent | Notes |
|---------------|-----------------|-------|
| `/rest/networkconf` | `/list/networkconf` | Network configurations |
| `/rest/wlanconf` | `/list/wlanconf` | WiFi configurations |
| `/rest/routing` | `/list/routing` | Static routes |
| `/rest/portforward` | `/list/portforward` | Port forwarding rules |
| `/rest/firewallrule` | `/list/firewallrule` | Firewall rules |
| `/rest/firewallgroup` | `/list/firewallgroup` | Firewall groups |
| `/rest/portconf` | `/list/portconf` | Port configurations |
| `/rest/usergroup` | `/list/usergroup` | User groups |
| `/stat/event` | `/list/event` | Events |
| `/stat/alarm` | `/list/alarm` | Alarms |

---

## Best Practices

1. **Use `/rest/` for configuration management** - Full CRUD support
2. **Use `/stat/` for monitoring** - Real-time statistics
3. **Avoid `/list/` in new code** - Use `/rest/` instead
4. **Check HTTP methods** - Not all endpoints support all methods

---

