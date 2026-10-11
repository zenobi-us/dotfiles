# コマンド一覧

## 確認系

ノード一覧:

```powershell
uv run .\scripts\proxmox_vm.py nodes
```

次の空き ID:

```powershell
uv run .\scripts\proxmox_vm.py nextid
```

QEMU VM 一覧:

```powershell
uv run .\scripts\proxmox_vm.py list-vms --node pve
```

LXC 一覧:

```powershell
uv run .\scripts\proxmox_vm.py list-cts --node pve
```

## QEMU 系

既存 VM の起動:

```powershell
uv run .\scripts\proxmox_vm.py start --node pve --vmid 120 --wait
```

空の VM シェル作成:

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

template / VM から clone:

```powershell
uv run .\scripts\proxmox_vm.py clone `
  --node pve `
  --source-vmid 9000 `
  --newid 221 `
  --name app-221 `
  --full `
  --wait
```

## LXC 系

LXC 作成:

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

既存 LXC の起動:

```powershell
uv run .\scripts\proxmox_vm.py start-ct --node pve --vmid 230 --wait
```

## 拡張パラメータ

第一級オプションにない Proxmox API パラメータは、`--param key=value` を繰り返して渡せます。

## サンプルスクリプト

node と storage の概況確認:

```powershell
uv run .\scripts\examples\cluster_probe.py --node pve --content-storage local
```

guest の詳細確認:

```powershell
uv run .\scripts\examples\guest_snapshot.py --kind lxc --node pve --vmid 230
```
