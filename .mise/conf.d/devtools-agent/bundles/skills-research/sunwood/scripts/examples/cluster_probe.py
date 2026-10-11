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
        description="Sample probe script for non-destructive Proxmox cluster inspection.",
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
        "--node",
        help="Optional node name. When set, include node-scoped storage and guest lists.",
    )
    parser.add_argument(
        "--content-storage",
        help="Optional storage name to expand with /storage/<name>/content. Requires --node.",
    )
    return parser


def main() -> int:
    parser = make_parser()
    args = parser.parse_args()

    if args.content_storage and not args.node:
        parser.error("--content-storage requires --node")

    client = build_client(args)
    result: dict[str, object] = {
        "nodes": client.get("/nodes"),
    }

    if args.node:
        result["node"] = args.node
        result["storage"] = client.get(f"/nodes/{args.node}/storage")
        result["vms"] = client.get(f"/nodes/{args.node}/qemu")
        result["cts"] = client.get(f"/nodes/{args.node}/lxc")
        if args.content_storage:
            result["storage_content"] = client.get(
                f"/nodes/{args.node}/storage/{args.content_storage}/content"
            )

    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
