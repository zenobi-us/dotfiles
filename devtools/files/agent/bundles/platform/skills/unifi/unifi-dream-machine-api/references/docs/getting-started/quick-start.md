# Quick Start Guide

[← Back to Documentation](../../README.md)

Get up and running with the UniFi Dream Machine REST API in 5 minutes.

## Prerequisites

- UniFi Dream Machine Pro (or UDM/UDM SE)
- Admin access credentials or API key
- Network access to UDM

## Authentication

The UDM REST API supports two authentication methods:

### Option 1: API Key (Recommended)

Create an API key in the UDM web interface:
1. Navigate to **Settings** → **Admins**
2. Select your admin user
3. Click **Create API Key**
4. Copy the key (you won't be able to see it again)

Use the API key in requests:

```bash
curl -k -H "X-API-KEY: <YOUR_API_KEY>" \
  "https://<UDM_IP>/proxy/network/api/s/default/stat/device"
```

### Option 2: Username/Password

**Step 1: Login**

```bash
curl -k -c cookies.txt -X POST "https://<UDM_IP>/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"<USERNAME>","password":"<PASSWORD>"}'
```

**Step 2: Make API Calls**

```bash
curl -k -b cookies.txt "https://<UDM_IP>/proxy/network/api/s/default/stat/device"
```

**Step 3: Logout**

```bash
curl -k -b cookies.txt -X POST "https://<UDM_IP>/api/auth/logout"
```

## Quick Examples

### Get System Information

```bash
curl -k -H "X-API-KEY: <YOUR_API_KEY>" \
  "https://<UDM_IP>/proxy/network/api/s/default/stat/sysinfo"
```

### List All Devices

```bash
curl -k -H "X-API-KEY: <YOUR_API_KEY>" \
  "https://<UDM_IP>/proxy/network/api/s/default/stat/device"
```

### List Connected Clients

```bash
curl -k -H "X-API-KEY: <YOUR_API_KEY>" \
  "https://<UDM_IP>/proxy/network/api/s/default/stat/sta"
```

### Get Network Health

```bash
curl -k -H "X-API-KEY: <YOUR_API_KEY>" \
  "https://<UDM_IP>/proxy/network/api/s/default/stat/health"
```

## Python Example

See the [Python examples](../../examples/python/) for complete client implementation.

### Quick Example with API Key

```python
from examples.python.basic_client import UDMClient

# Create client with API key
client = UDMClient('192.168.1.1', api_key='your_api_key_here')
client.login()

# Get devices
devices = client.get_devices()
print(f"Found {len(devices['data'])} devices")

# Get clients
clients = client.get_clients()
print(f"Found {len(clients['data'])} connected clients")

# Get health
health = client.get_health()
for subsystem in health['data']:
    print(f"{subsystem['subsystem']}: {subsystem['status']}")

client.logout()
```

### Quick Example with Username/Password

```python
import requests
from urllib3.exceptions import InsecureRequestWarning

# Suppress SSL warnings
requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)

# Configuration
UDM_IP = "192.168.1.1"
USERNAME = "admin"
PASSWORD = "your_password"

# Create session
session = requests.Session()
session.verify = False

# Login
login_url = f"https://{UDM_IP}/api/auth/login"
login_data = {"username": USERNAME, "password": PASSWORD}
response = session.post(login_url, json=login_data)

if response.status_code == 200:
    print("✓ Logged in successfully")

    # Get devices
    devices_url = f"https://{UDM_IP}/proxy/network/api/s/default/stat/device"
    devices = session.get(devices_url).json()

    print(f"\nFound {len(devices['data'])} devices:")
    for device in devices['data']:
        print(f"  - {device.get('name', 'Unknown')}: {device.get('model', 'Unknown')}")

    # Logout
    logout_url = f"https://{UDM_IP}/api/auth/logout"
    session.post(logout_url)
    print("\n✓ Logged out")
else:
    print(f"✗ Login failed: {response.status_code}")
```

## Common Tasks

### List Networks

```bash
curl -k -H "X-API-KEY: <YOUR_API_KEY>" \
  "https://<UDM_IP>/proxy/network/api/s/default/rest/networkconf"
```

### List WiFi Networks

```bash
curl -k -H "X-API-KEY: <YOUR_API_KEY>" \
  "https://<UDM_IP>/proxy/network/api/s/default/rest/wlanconf"
```

### List Firewall Rules

```bash
curl -k -H "X-API-KEY: <YOUR_API_KEY>" \
  "https://<UDM_IP>/proxy/network/api/s/default/rest/firewallrule"
```

### List Port Forwarding Rules

```bash
curl -k -H "X-API-KEY: <YOUR_API_KEY>" \
  "https://<UDM_IP>/proxy/network/api/s/default/rest/portforward"
```

### Get System Events

```bash
curl -k -H "X-API-KEY: <YOUR_API_KEY>" \
  "https://<UDM_IP>/proxy/network/api/s/default/stat/event?_limit=100"
```

### Get Active Alarms

```bash
curl -k -H "X-API-KEY: <YOUR_API_KEY>" \
  "https://<UDM_IP>/proxy/network/api/s/default/stat/alarm"
```

## Important Notes

### API Key vs Username/Password

- **API Key** (Recommended): No session management, simpler, more secure
- **Username/Password**: Requires login/logout, session cookies

### SSL Certificates

The UDM uses a self-signed certificate by default. Use `-k` flag with cURL to skip verification, or `verify=False` in Python.

### Base URL Pattern

All API endpoints follow this pattern:
```
https://<UDM_IP>/proxy/network/api/s/<SITE>/
```

Default site is `default`.

### Response Format

All responses are JSON with this structure:
```json
{
  "meta": {
    "rc": "ok"
  },
  "data": [...]
}
```

### Placeholders

Replace these placeholders with your actual values:
- `<UDM_IP>` - Your UDM IP address (e.g., 192.168.1.1)
- `<YOUR_API_KEY>` - Your API key from UDM settings
- `<USERNAME>` - Admin username (typically "admin")
- `<PASSWORD>` - Admin password

## Next Steps

- **[Python Examples](../../examples/python/)** - Complete Python client and examples
- **[JavaScript Examples](../../examples/javascript/)** - Node.js client and examples
- **[cURL Examples](../../examples/curl/)** - Command-line examples
- **[API Reference](../api-reference/README.md)** - Complete API documentation

## Troubleshooting

### REST API Returns 403

- Verify API key is correct
- Check if account has admin privileges
- For username/password: try clearing cookies and re-authenticating

### REST API Returns 401

- API key may be invalid or expired
- Create a new API key in UDM settings
- Verify you're using the correct authentication method

### Connection Refused

- Verify network access to UDM
- Check firewall rules
- Ensure HTTPS (port 443) is accessible

### SSL Certificate Errors

- Use `-k` flag with cURL to skip verification
- Use `verify=False` in Python requests
- Or install the UDM's SSL certificate

## Need Help?

- Check the [API Reference](../api-reference/README.md)
- Review [Examples](../../examples/)
- See [Python Examples](../../examples/python/) for complete client implementation

