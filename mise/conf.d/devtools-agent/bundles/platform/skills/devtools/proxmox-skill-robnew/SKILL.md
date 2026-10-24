---
name: proxmox
description: "Manage Proxmox VE nodes, VMs, and containers. Can list hardware stats, resources, and control power states (start, stop, reboot, shutdown)."
metadata:
  requires:
    bins: ["python3"]
  env: ["PVE_HOST", "PVE_TOKEN_ID", "PVE_TOKEN_SECRET"]
---

# Proxmox Skill

This skill allows the agent to interact with a Proxmox VE cluster to manage virtual machines and containers.

## Tools

### proxmox_list
List Proxmox nodes or all available VMs and containers across the entire cluster.
- Command: python3 {{skillDir}}/scripts/proxmox.py {{type}}
- Args:
  - type: "nodes" or "vms"

### proxmox_node_health
Get hardware-level health stats (CPU usage, RAM, Uptime, Version) for a specific physical node.
- Command: python3 {{skillDir}}/scripts/proxmox.py node_health {{node}}
- Args:
  - node: The name of the Proxmox host (e.g., "pve" or "hydra")

### proxmox_status
Get the real-time status of a specific VM or container.
- Command: python3 {{skillDir}}/scripts/proxmox.py status {{node}} {{kind}} {{vmid}}
- Args:
  - node: The Proxmox node name where the resource lives
  - kind: "qemu" for VMs, "lxc" for containers
  - vmid: The numerical ID of the resource (e.g., "100")

### proxmox_power_action
Perform power management actions. These actions require human approval by default.
- Approval: true
- Command: python3 {{skillDir}}/scripts/proxmox.py {{action}} {{node}} {{kind}} {{vmid}}
- Args:
  - action: "start", "stop", "reboot", or "shutdown"
  - node: The Proxmox node name
  - kind: "qemu" or "lxc"
  - vmid: The ID of the resource
