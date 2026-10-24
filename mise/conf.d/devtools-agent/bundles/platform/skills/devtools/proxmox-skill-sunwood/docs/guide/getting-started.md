# Getting Started

## Overview

This repository is designed for two audiences at once:

- Codex, through [SKILL.md](https://github.com/Sunwood-ai-labs/proxmox-skill/blob/main/SKILL.md)
- human operators, through the README and these docs

The helper script is intentionally small and uses only Python standard-library HTTP primitives so it can stay portable.

## Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/)
- access to a Proxmox VE host
- a user that can obtain tickets and perform the intended VM or LXC actions

## Environment file

Copy `.env.example` to `.env` and fill in the values:

```powershell
Copy-Item .env.example .env
```

Expected keys:

- `IP`
- `USR`
- `PWD`
- optional `PORT`
- optional `VERIFY_SSL`

If `USR` omits a realm, the helper defaults it to `@pam`.

## First commands to run

Always inspect before mutating:

```powershell
uv run .\scripts\proxmox_vm.py nodes
uv run .\scripts\proxmox_vm.py nextid
uv run .\scripts\proxmox_vm.py list-vms --node pve
uv run .\scripts\proxmox_vm.py list-cts --node pve
```

## Where to go next

- [Command Reference](./command-reference.md)
- [Safety and Validation](./safety-and-validation.md)
