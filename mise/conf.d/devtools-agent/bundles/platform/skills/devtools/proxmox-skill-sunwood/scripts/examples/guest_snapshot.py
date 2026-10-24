#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from proxmox_vm import DEFAULT_ENV_FILE, build_client  # noqa: E402


def make_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Sample guest inspection script for status and config snapshots.",
    )
    parser.add_argument(
        "--env-file",
        default=str(DEFAULT_ENV_FILE),
        help="Path to the local .env file.",
    )
    parser.add_argument(
        "--verify-ssl",
        action="store_true",
        help="Verify the TLS certificate instead of using the self-signed default.",
    )
    parser.add_argument(
        "--kind",
        choices=("qemu", "lxc"),
        required=True,
        help="Guest type to inspect.",
    )
    parser.add_argument("--node", required=True, help="Node name.")
    parser.add_argument("--vmid", required=True, type=int, help="Guest ID.")
    return parser


def main() -> int:
    args = make_parser().parse_args()
    client = build_client(args)
    base = f"/nodes/{args.node}/{args.kind}/{args.vmid}"
    result = {
        "kind": args.kind,
        "node": args.node,
        "vmid": args.vmid,
        "status": client.get(f"{base}/status/current"),
        "config": client.get(f"{base}/config"),
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
