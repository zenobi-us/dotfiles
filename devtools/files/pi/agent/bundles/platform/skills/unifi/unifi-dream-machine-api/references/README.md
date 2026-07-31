# UniFi Dream Machine Pro API Documentation

[![API Coverage](https://img.shields.io/badge/API%20Coverage-60+%20Endpoints-green)](docs/api-reference/)
[![V1 REST APIs](https://img.shields.io/badge/V1%20REST-42-blue)](docs/api-reference/API-V1-REFERENCE.md)
[![V2 APIs](https://img.shields.io/badge/V2%20API-14-blue)](docs/api-reference/API-V2-REFERENCE.md)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Comprehensive, unofficial REST API documentation for UniFi Dream Machine**
> Reverse-engineered through systematic testing and analysis.

## 📚 Overview

This repository contains comprehensive documentation for the UniFi Dream Machine (UDM/UDM Pro) REST API. This documentation enables programmatic management of your UniFi network infrastructure.

### What's Documented

- ✅ **V1 REST API** - 42 endpoints for traditional UniFi features
- ✅ **V2 API** - 14 endpoints for modern features (DNS records, traffic rules, firewall zones, QoS)
- ✅ **Network management** including VLANs, DHCP, DNS, routing, and VPN
- ✅ **Device management** for UniFi devices (reboot, adopt, upgrade)
- ✅ **Firewall rules** and port forwarding
- ✅ **WiFi (WLAN) configuration**
- ✅ **Client management** (block, unblock, kick, guest authorization)
- ✅ **System administration** (backup, restore, site management, admin users)
- ✅ **Monitoring & statistics** including dashboard, clients, DPI, and historical reports
- ✅ **Authentication** via API keys

## 🚀 Quick Start

### 1. Create API Key

1. Log in to UniFi Network UI
2. Navigate to Settings → Admins
3. Select your admin account
4. Click "Create API Token"
5. Copy and save the token securely

### 2. Make Your First API Call

**V1 REST API Example:**
```bash
curl -k -H "X-Api-Key: <YOUR_API_KEY>" \
  "https://<UDM_IP>/proxy/network/api/s/default/stat/device"
```

**V2 API Example:**
```bash
curl -k -H "X-Api-Key: <YOUR_API_KEY>" \
  "https://<UDM_IP>/proxy/network/v2/api/site/default/static-dns"
```

## 📖 Documentation

### API Reference
- **[API Reference Overview](docs/api-reference/README.md)** - Complete API reference with authentication and common notes
- **[API V1 REST Reference](docs/api-reference/API-V1-REFERENCE.md)** - 42 V1 REST API endpoints
- **[API V2 Reference](docs/api-reference/API-V2-REFERENCE.md)** - 14 V2 API endpoints

### Getting Started
- **[Quick Start Guide](docs/getting-started/quick-start.md)** - Get up and running in 5 minutes

## 📊 API Coverage

| API Version | Endpoints | Description |
|-------------|-----------|-------------|
| **V1 REST** | 42 | Traditional UniFi features (networks, WiFi, firewall, VPN, system management) |
| **V2** | 14 | Modern features (DNS records, traffic rules, firewall zones, QoS) |
| **Total** | **56** | **Comprehensive API coverage** |

### V1 REST API Endpoints

| Category | Endpoints | Features |
|----------|-----------|----------|
| **Network** | 13 | Networks, WiFi, routing, port forwarding, VPN servers/clients, DHCP/DNS |
| **Security** | 3 | Firewall rules, firewall groups, RADIUS profiles |
| **Monitoring** | 11 | Events, alarms, DPI, dashboard, health, clients, statistics/reports |
| **System** | 15 | Devices, settings, backup/restore, site management, admin users, client/device commands |

### V2 API Endpoints

| Category | Endpoints | Features |
|----------|-----------|----------|
| **Network** | 6 | DNS records, traffic rules, NAT, topology, AP groups, QoS rules |
| **Security** | 4 | Firewall zones, zone matrix, zone policies, IP groups |
| **Monitoring** | 2 | Alerts, notifications |
| **System** | 2 | Devices, feature flags |

## 🔑 Key Features

- **56 documented endpoints** across V1 and V2 APIs
- **Clean reference format** - API-only documentation, no verbose explanations
- **Full CRUD coverage** - All HTTP methods documented where applicable
- **Organized by category** - Core, Network, Security, Monitoring, System
- **Production ready** - All endpoints tested and verified
- **Comprehensive field documentation** - Detailed parameter descriptions with types and defaults

## 🛠️ Use Cases

- **DNS Management** - Programmatically manage custom DNS records (V2 API)
- **Network Automation** - Manage VLANs, subnets, routing, and traffic rules
- **VPN Management** - Configure VPN servers, generate client profiles, monitor connections
- **Firewall Management** - Configure firewall zones, rules, and policies
- **Device Management** - Monitor, configure, reboot, adopt, and upgrade UniFi devices
- **Client Management** - Block/unblock clients, authorize guests, force reconnects
- **System Administration** - Backup/restore configuration, manage sites and admin users
- **QoS & Traffic Shaping** - Prioritize network traffic with QoS rules
- **Monitoring & Analytics** - Access system events, alerts, and historical statistics
- **Integration** - Integrate UDM with automation platforms and custom applications

## ⚠️ Disclaimer

This is **unofficial documentation** created through reverse-engineering. It is not endorsed by or affiliated with Ubiquiti Inc. Use at your own risk. Always backup your configuration before making changes.

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 🙏 Acknowledgments

- UniFi community for sharing knowledge
- Ubiquiti for creating great networking hardware

---

**Note:** This documentation covers both V1 REST API and V2 API endpoints. All endpoints require API key authentication via the `X-Api-Key` header.
