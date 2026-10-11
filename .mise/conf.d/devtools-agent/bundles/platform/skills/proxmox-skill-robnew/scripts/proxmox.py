#!/usr/bin/env python3
"""
Proxmox Skill for OpenClaw
Author: Rob Newberry
Description: Secure Proxmox VE management via official API.
"""


import os
import sys
import json
from proxmoxer import ProxmoxAPI

def jprint(obj, code=0):
    print(json.dumps(obj, indent=2))
    sys.exit(code)

def env(name: str) -> str:
    v = os.getenv(name)
    if not v:
        jprint({"ok": False, "error": f"Missing env var: {name}"}, 2)
    return v

def connect() -> ProxmoxAPI:
    host = env("PVE_HOST").replace("https://", "").replace("http://", "")
    token_id = env("PVE_TOKEN_ID")
    token_secret = env("PVE_TOKEN_SECRET")

    if "!" not in token_id:
        jprint({"ok": False, "error": "PVE_TOKEN_ID must be user@realm!tokenname"}, 2)

    user, token_name = token_id.split("!", 1)

    return ProxmoxAPI(
        host,
        user=user,
        token_name=token_name,
        token_value=token_secret,
        verify_ssl=False,
    )

def list_nodes(p: ProxmoxAPI):
    return p.nodes.get()

def node_health(p: ProxmoxAPI, node: str):
    # Pulls CPU, RAM, Uptime, and Version info for the host
    return p.nodes(node).status.get()

def list_vms(p: ProxmoxAPI):
    # Using Cluster Resources is faster and covers all nodes at once
    return p.cluster.resources.get(type="vm")

def status_current(p: ProxmoxAPI, node: str, kind: str, vmid: str):
    # kind is usually 'qemu' or 'lxc'
    endpoint = getattr(p.nodes(node), kind)
    return endpoint(vmid).status.current.get()

def action_vm(p: ProxmoxAPI, node: str, kind: str, vmid: str, action: str):
    # action: start, stop, reboot, shutdown
    endpoint = getattr(p.nodes(node), kind)
    return getattr(endpoint(vmid).status, action).post()

def usage():
    jprint({
        "ok": False,
        "error": "usage",
        "examples": [
            "proxmox.py nodes",
            "proxmox.py node_health <node>",
            "proxmox.py vms",
            "proxmox.py status <node> <qemu|lxc> <vmid>",
            "proxmox.py <start|stop|reboot|shutdown> <node> <qemu|lxc> <vmid>"
        ]
    }, 2)

def main():
    if len(sys.argv) < 2:
        usage()

    p = connect()
    cmd = sys.argv[1].strip().lower()

    try:
        if cmd == "nodes":
            data = list_nodes(p)

        elif cmd == "node_health":
            if len(sys.argv) < 3: usage()
            data = node_health(p, sys.argv[2])

        elif cmd == "vms":
            data = list_vms(p)

        elif cmd == "status":
            if len(sys.argv) < 5: usage()
            data = status_current(p, sys.argv[2], sys.argv[3].lower(), sys.argv[4])

        elif cmd in ("start", "stop", "reboot", "shutdown"):
            if len(sys.argv) < 5: usage()
            # No manual 'CONFIRM' check here; OpenClaw handles Approval via SKILL.md
            data = action_vm(p, sys.argv[2], sys.argv[3].lower(), sys.argv[4], cmd)

        else:
            jprint({"ok": False, "error": f"unknown command: {cmd}"}, 2)

        jprint({"ok": True, "data": data}, 0)

    except Exception as e:
        jprint({"ok": False, "error": str(e)}, 1)

if __name__ == "__main__":
    main()
