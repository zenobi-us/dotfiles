# Proxmox API Notes

## Scope

Use `scripts/proxmox_vm.py` for this skill's inspect, start, create, clone, and LXC workflows.

The helper assumes a local `.env` with:

- `IP`
- `USR`
- `PWD`

It also accepts optional `PORT` and `VERIFY_SSL`.

## Command Patterns

List nodes:

```powershell
uv run .\scripts\proxmox_vm.py nodes
```

Get the next free VM ID:

```powershell
uv run .\scripts\proxmox_vm.py nextid
```

List VMs:

```powershell
uv run .\scripts\proxmox_vm.py list-vms --node pve
```

List containers:

```powershell
uv run .\scripts\proxmox_vm.py list-cts --node pve
```

Start a VM and wait for the task result:

```powershell
uv run .\scripts\proxmox_vm.py start --node pve --vmid 120 --wait
```

Create a blank VM shell:

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

Clone from a template:

```powershell
uv run .\scripts\proxmox_vm.py clone `
  --node pve `
  --source-vmid 9000 `
  --newid 221 `
  --name app-221 `
  --full `
  --wait
```

Create a container from a Proxmox template:

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

Start an existing container:

```powershell
uv run .\scripts\proxmox_vm.py start-ct --node pve --vmid 230 --wait
```

Pass extra API values through repeated `--param key=value` flags:

```powershell
uv run .\scripts\proxmox_vm.py create `
  --node pve `
  --vmid 222 `
  --name app-222 `
  --memory 4096 `
  --cores 4 `
  --bridge vmbr0 `
  --param tags=lab `
  --param ciuser=ubuntu
```

## Important Caveats

- `USR=root` in `.env` is normalized to `root@pam` automatically.
- `.env` uses `PWD`, so prefer file loading over shell `source`.
- Proxmox write calls need both the ticket cookie and the `CSRFPreventionToken` header.
- `start`, `create`, `clone`, `start-ct`, and `create-ct` usually return a task ID immediately. Use `--wait` if the caller needs the final task state.
- The helper defaults to the common self-signed Proxmox certificate flow. Add `--verify-ssl` only after the certificate chain is trusted locally.

## API Assumptions

- Base URL: `https://<host>:8006/api2/json`
- Auth: `POST /access/ticket`
- List nodes: `GET /nodes`
- Next VM ID: `GET /cluster/nextid`
- List QEMU VMs: `GET /nodes/{node}/qemu`
- List LXC containers: `GET /nodes/{node}/lxc`
- Start VM: `POST /nodes/{node}/qemu/{vmid}/status/start`
- Create QEMU VM: `POST /nodes/{node}/qemu`
- Clone QEMU VM: `POST /nodes/{node}/qemu/{vmid}/clone`
- Start LXC container: `POST /nodes/{node}/lxc/{vmid}/status/start`
- Create LXC container: `POST /nodes/{node}/lxc`
- Task polling: `GET /nodes/{node}/tasks/{upid}/status`
