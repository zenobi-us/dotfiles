---
name: unifi-dream-machine-api
description: "Use when working with UniFi Dream Machine / UniFi Network REST APIs: API-key auth, V1 `/proxy/network/api/s/{site}` endpoints, V2 `/proxy/network/v2/api/site/{site}` endpoints, DNS records, traffic rules, firewall zones, VPN clients/servers, device/client commands, monitoring, backups, and automation scripts. Based on pmilano1/unifi-dream-machine-api unofficial docs."
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# UniFi Dream Machine API

Use this skill when automating or inspecting UniFi Dream Machine / UDM Pro / UDM SE via REST API.

Source docs copied from: `https://github.com/pmilano1/unifi-dream-machine-api/tree/master/docs`

## Source of Truth

Read these local references before giving endpoint details:

- `references/README.md` — upstream overview and coverage
- `references/docs/getting-started/quick-start.md` — auth and first calls
- `references/docs/api-reference/README.md` — API organization
- `references/docs/api-reference/API-V1-REFERENCE.md` — V1 endpoint index
- `references/docs/api-reference/API-V2-REFERENCE.md` — V2 endpoint index

## API Basics

Authentication uses API token header:

```bash
curl -k -H "X-Api-Key: <YOUR_API_KEY>" \
  "https://<UDM_IP>/proxy/network/api/s/default/stat/device"
```

V1 REST base path:

```text
/proxy/network/api/s/{site}
```

V2 REST base path:

```text
/proxy/network/v2/api/site/{site}
```

Default site is usually:

```text
default
```

## Workflow

1. Identify whether requested feature is V1 or V2.
2. Read matching reference file under `references/docs/api-reference/`.
3. Prefer API-key auth over username/password sessions.
4. Use `curl -k` for self-signed UDM certs unless user has trusted TLS configured.
5. For mutating calls, warn user to backup config first.

## High-Value Reference Areas

- DNS records: `references/docs/api-reference/network/dns-records.md`
- Traffic rules: `references/docs/api-reference/network/traffic-rules.md`
- VPN clients: `references/docs/api-reference/network/vpn-clients.md`
- VPN servers: `references/docs/api-reference/network/vpn-servers.md`
- Routing: `references/docs/api-reference/network/routing.md`
- Firewall rules/groups/zones: `references/docs/api-reference/security/`
- Device commands: `references/docs/api-reference/system/device-commands.md`
- Client commands: `references/docs/api-reference/system/client-commands.md`
- Backup/restore: `references/docs/api-reference/system/backup-restore.md`

## Safety

These docs are unofficial and reverse-engineered. Mutating endpoints can break network access. For create/update/delete operations, backup UniFi configuration first and prefer dry-run/read calls before writes.
