# Command Reference

## Inspection

List nodes:

```powershell
uv run .\scripts\proxmox_vm.py nodes
```

Get the next free ID:

```powershell
uv run .\scripts\proxmox_vm.py nextid
```

List QEMU VMs:

```powershell
uv run .\scripts\proxmox_vm.py list-vms --node pve
```

List LXC containers:

```powershell
uv run .\scripts\proxmox_vm.py list-cts --node pve
```

## QEMU workflows

Start an existing VM:

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

Clone from a template or VM:

```powershell
uv run .\scripts\proxmox_vm.py clone `
  --node pve `
  --source-vmid 9000 `
  --newid 221 `
  --name app-221 `
  --full `
  --wait
```

## LXC workflows

Create an LXC container:

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

## Escape hatch

Use repeated `--param key=value` flags for additional Proxmox API parameters that are not mapped to first-class CLI options.

## Sample scripts

Probe a node and one storage:

```powershell
uv run .\scripts\examples\cluster_probe.py --node pve --content-storage local
```

Inspect one guest in detail:

```powershell
uv run .\scripts\examples\guest_snapshot.py --kind lxc --node pve --vmid 230
```
