---
name: proxmox-skill
description: Operate a Proxmox VE environment from this skill folder by reading connection details from the local `.env` file and using the bundled helper script to inspect nodes, QEMU VMs, and LXC containers, start existing guests, allocate a new VM or container ID, create a new VM shell, clone from a template, or create a new LXC container from a local Proxmox template. Use when Codex needs to work against this specific Proxmox host instead of only describing the API.
---

# Proxmox Guest Control

## Overview

Use this skill from the directory that contains `.env`.

Prefer the bundled helper script over ad-hoc curl snippets. The script reads `IP`, `USR`, and `PWD` from the local `.env`, normalizes usernames that omit a realm, authenticates against the Proxmox REST API, and handles the cookie plus CSRF token needed for write operations.

## Safety Rules

1. Read `.env` from disk instead of sourcing it into the shell.
   - This repo stores the password under `PWD=...`, which collides with common shell environment usage.
   - Let `scripts/proxmox_vm.py` load the file directly.

2. Normalize the Proxmox username before calling the API.
   - If `USR` already contains a realm such as `root@pam`, use it as-is.
   - If it does not contain `@`, treat it as `@pam` by default.

3. Inspect before mutating.
   - Start with `nodes`, `nextid`, or `list-vms` before `start`, `create`, or `clone`.
   - Confirm the target node name, the VM ID, and the bridge or storage name before writing anything.

4. Prefer `clone` when a template already exists.
   - Use `create` for a blank VM shell.
   - Use `clone` for faster provisioning from a prepared template.

5. Use `--verify-ssl` only when the Proxmox certificate chain is already trusted on this machine.
   - The helper defaults to the common self-signed Proxmox setup.

## Quick Start

Run all commands from this skill root so the helper can find `.env` automatically.

Inspect nodes:

```powershell
uv run .\scripts\proxmox_vm.py nodes
```

Inspect the next free VM ID:

```powershell
uv run .\scripts\proxmox_vm.py nextid
```

Inspect VMs on a node:

```powershell
uv run .\scripts\proxmox_vm.py list-vms --node pve
```

Inspect LXC containers on a node:

```powershell
uv run .\scripts\proxmox_vm.py list-cts --node pve
```

Inspect all nodes at once:

```powershell
uv run .\scripts\proxmox_vm.py list-vms
```

## Start an Existing VM

Use this flow when the VM already exists and only needs to be powered on.

1. Find the target node and VM ID.

```powershell
uv run .\scripts\proxmox_vm.py list-vms --node pve
```

2. Start the VM and wait for the task to finish when the caller needs confirmation.

```powershell
uv run .\scripts\proxmox_vm.py start --node pve --vmid 120 --wait
```

3. Re-check the VM list if the caller needs a second confirmation pass.

```powershell
uv run .\scripts\proxmox_vm.py list-vms --node pve
```

## Create a Blank VM

Use this flow when the caller wants a new VM shell with explicit CPU, memory, network, and optional disk settings.

1. Get a free VM ID.

```powershell
uv run .\scripts\proxmox_vm.py nextid
```

2. Create the VM shell.

```powershell
uv run .\scripts\proxmox_vm.py create `
  --node pve `
  --vmid 220 `
  --name app-220 `
  --memory 4096 `
  --cores 4 `
  --bridge vmbr0 `
  --storage local-lvm `
  --disk-gb 32 `
  --wait
```

3. Add any Proxmox-specific arguments with repeated `--param key=value`.
   - Use this for options that are not covered by the first-class flags.
   - Example: `--param tags=lab --param ciuser=ubuntu`

4. Start the new VM if the caller wants the shell booted immediately.

```powershell
uv run .\scripts\proxmox_vm.py start --node pve --vmid 220 --wait
```

## Clone from a Template

Use this flow when a template VM already exists on the target cluster.

1. Inspect the source template and the destination node.

```powershell
uv run .\scripts\proxmox_vm.py list-vms --node pve
```

2. Clone it to a new VM ID.

```powershell
uv run .\scripts\proxmox_vm.py clone `
  --node pve `
  --source-vmid 9000 `
  --newid 221 `
  --name app-221 `
  --full `
  --wait
```

3. Boot the cloned VM when needed.

```powershell
uv run .\scripts\proxmox_vm.py start --node pve --vmid 221 --wait
```

## Create an LXC Container

Use this flow when the caller explicitly wants a lightweight container rather than a full VM.

1. Inspect the available Proxmox templates and confirm the target node.
   - Read [references/api-notes.md](./references/api-notes.md) for the known template patterns in this environment.
   - Prefer a `local:vztmpl/...` template that already exists on the node.

2. Get a free ID.

```powershell
uv run .\scripts\proxmox_vm.py nextid
```

3. Create the container from a template and optionally boot it immediately.

```powershell
uv run .\scripts\proxmox_vm.py create-ct `
  --node pve `
  --vmid 230 `
  --hostname codex-230 `
  --ostemplate local:vztmpl/ubuntu-24.04-standard_24.04-2_amd64.tar.zst `
  --storage local-lvm `
  --memory 512 `
  --swap 512 `
  --cores 1 `
  --disk-gb 8 `
  --bridge vmbr0 `
  --ip dhcp `
  --wait `
  --start-after-create
```

4. If the container was created without `--start-after-create`, boot it with:

```powershell
uv run .\scripts\proxmox_vm.py start-ct --node pve --vmid 230 --wait
```

5. Re-check the container list when the caller wants a visible state confirmation.

```powershell
uv run .\scripts\proxmox_vm.py list-cts --node pve
```

## Verification

- Use `--wait` on `start`, `create`, `clone`, `start-ct`, and `create-ct` when the caller needs the Proxmox task result instead of only the queued task ID.
- Re-run `list-vms` after a mutation when the caller wants a visible state check.
- Re-run `list-cts` after container mutations when the caller wants a visible state check.
- Read [references/api-notes.md](./references/api-notes.md) when you need the exact API assumptions or command patterns behind the helper.

## Avoid

- Do not duplicate credentials from `.env` into logs, markdown, or chat output.
- Do not guess the node name, bridge, storage, or free VM ID.
- Do not guess the template volid for `create-ct`.
- Do not call `create` without checking whether the caller actually wanted `clone`.
