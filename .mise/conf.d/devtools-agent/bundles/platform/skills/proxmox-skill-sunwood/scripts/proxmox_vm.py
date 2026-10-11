#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///

from __future__ import annotations

import argparse
import json
import ssl
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from urllib import error, parse, request


SCRIPT_PATH = Path(__file__).resolve()
SKILL_ROOT = SCRIPT_PATH.parents[1]
DEFAULT_ENV_FILE = SKILL_ROOT / ".env"


def load_env_file(path: Path) -> dict[str, str]:
    if not path.exists():
        raise FileNotFoundError(f".env file not found: {path}")

    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            raise ValueError(f"Invalid .env line: {raw_line}")

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        values[key] = value

    return values


def env_bool(raw: str | None, default: bool = False) -> bool:
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def normalize_username(username: str) -> str:
    stripped = username.strip()
    if "@" in stripped:
        return stripped
    return f"{stripped}@pam"


def parse_key_value(items: list[str] | None) -> dict[str, str]:
    result: dict[str, str] = {}
    for item in items or []:
        if "=" not in item:
            raise ValueError(f"Expected key=value, got: {item}")
        key, value = item.split("=", 1)
        key = key.strip()
        if not key:
            raise ValueError(f"Key is empty in: {item}")
        result[key] = value.strip()
    return result


def to_form_values(payload: dict[str, object]) -> dict[str, str]:
    form: dict[str, str] = {}
    for key, value in payload.items():
        if value is None:
            continue
        if isinstance(value, bool):
            form[key] = "1" if value else "0"
        else:
            form[key] = str(value)
    return form


def node_from_upid(upid: str, fallback: str) -> str:
    parts = upid.split(":")
    if len(parts) >= 2 and parts[0] == "UPID" and parts[1]:
        return parts[1]
    return fallback


@dataclass(slots=True)
class ProxmoxConfig:
    host: str
    username: str
    password: str
    verify_ssl: bool = False
    port: int = 8006

    @property
    def base_url(self) -> str:
        return f"https://{self.host}:{self.port}/api2/json"


class ProxmoxClient:
    def __init__(self, config: ProxmoxConfig) -> None:
        self.config = config
        self.ssl_context = (
            ssl.create_default_context()
            if config.verify_ssl
            else ssl._create_unverified_context()
        )
        self.ticket: str | None = None
        self.csrf_token: str | None = None

    def authenticate(self) -> None:
        payload = {
            "username": self.config.username,
            "password": self.config.password,
        }
        response = self._request_json("POST", "/access/ticket", payload, include_auth=False)
        data = response["data"]
        self.ticket = data["ticket"]
        self.csrf_token = data.get("CSRFPreventionToken")

    def get(self, path: str, params: dict[str, object] | None = None) -> object:
        return self._request_json("GET", path, params or {}, include_auth=True)["data"]

    def post(self, path: str, params: dict[str, object] | None = None) -> object:
        return self._request_json(
            "POST",
            path,
            params or {},
            include_auth=True,
            include_csrf=True,
        )["data"]

    def wait_for_task(
        self,
        node: str,
        upid: str,
        *,
        timeout_seconds: int,
        interval_seconds: int,
    ) -> dict[str, object]:
        deadline = time.time() + timeout_seconds
        encoded_upid = parse.quote(upid, safe="")

        while True:
            task = self.get(f"/nodes/{node}/tasks/{encoded_upid}/status")
            if not isinstance(task, dict):
                raise RuntimeError(f"Unexpected task status payload: {task!r}")

            if task.get("status") == "stopped":
                return task

            if time.time() >= deadline:
                raise TimeoutError(
                    f"Timed out waiting for task {upid} on node {node} after "
                    f"{timeout_seconds} seconds."
                )

            time.sleep(interval_seconds)

    def _request_json(
        self,
        method: str,
        path: str,
        params: dict[str, object],
        *,
        include_auth: bool,
        include_csrf: bool = False,
    ) -> dict[str, object]:
        url = f"{self.config.base_url}{path}"
        body: bytes | None = None
        form_values = to_form_values(params)

        if method == "GET":
            if form_values:
                url = f"{url}?{parse.urlencode(form_values, doseq=True)}"
        else:
            body = parse.urlencode(form_values, doseq=True).encode("utf-8")

        headers = {"Accept": "application/json"}
        if include_auth:
            if not self.ticket:
                raise RuntimeError("Authentication is required before calling the API.")
            headers["Cookie"] = f"PVEAuthCookie={self.ticket}"
        if include_csrf and self.csrf_token:
            headers["CSRFPreventionToken"] = self.csrf_token
        if body is not None:
            headers["Content-Type"] = "application/x-www-form-urlencoded"

        req = request.Request(url, data=body, headers=headers, method=method)

        try:
            with request.urlopen(req, context=self.ssl_context) as response:
                raw_body = response.read().decode("utf-8")
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(
                f"HTTP {exc.code} while calling {method} {path}: {detail}"
            ) from exc
        except error.URLError as exc:
            raise RuntimeError(f"Could not reach Proxmox API at {url}: {exc.reason}") from exc

        try:
            payload = json.loads(raw_body)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"Invalid JSON returned from {method} {path}: {raw_body}") from exc

        if not isinstance(payload, dict) or "data" not in payload:
            raise RuntimeError(f"Unexpected API response for {method} {path}: {payload!r}")
        return payload


def build_client(args: argparse.Namespace) -> ProxmoxClient:
    env_values = load_env_file(Path(args.env_file).resolve())
    host = env_values.get("IP") or env_values.get("HOST")
    username = env_values.get("USR") or env_values.get("USERNAME") or env_values.get("USER")
    password = env_values.get("PWD") or env_values.get("PASSWORD")

    missing = [
        name
        for name, value in {
            "IP": host,
            "USR": username,
            "PWD": password,
        }.items()
        if not value
    ]
    if missing:
        raise ValueError(f"Missing required .env keys: {', '.join(missing)}")

    port = int(env_values.get("PORT", "8006"))
    verify_ssl = args.verify_ssl or env_bool(env_values.get("VERIFY_SSL"), default=False)
    config = ProxmoxConfig(
        host=host,
        username=normalize_username(username),
        password=password,
        verify_ssl=verify_ssl,
        port=port,
    )

    client = ProxmoxClient(config)
    client.authenticate()
    return client


def add_common_flags(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--env-file",
        default=str(DEFAULT_ENV_FILE),
        help="Path to the .env file. Defaults to the skill root .env.",
    )
    parser.add_argument(
        "--verify-ssl",
        action="store_true",
        help="Verify the TLS certificate instead of using the common self-signed default.",
    )


def add_wait_flags(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--wait",
        action="store_true",
        help="Poll the returned Proxmox task until it stops.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=600,
        help="Maximum seconds to wait when --wait is set.",
    )
    parser.add_argument(
        "--poll-interval",
        type=int,
        default=2,
        help="Seconds between task status checks when --wait is set.",
    )


def add_common_param_flag(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--param",
        action="append",
        default=[],
        help="Extra API parameter in key=value form. Repeat as needed.",
    )


def make_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Inspect, start, create, and clone Proxmox QEMU VMs, and create or start "
            "LXC containers by using the local .env."
        ),
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    parser_nodes = subparsers.add_parser("nodes", help="List Proxmox nodes.")
    add_common_flags(parser_nodes)

    parser_nextid = subparsers.add_parser("nextid", help="Get the next free VM ID.")
    add_common_flags(parser_nextid)

    parser_list = subparsers.add_parser("list-vms", help="List QEMU VMs.")
    add_common_flags(parser_list)
    parser_list.add_argument("--node", help="Limit the listing to one node.")

    parser_list_ct = subparsers.add_parser("list-cts", help="List LXC containers.")
    add_common_flags(parser_list_ct)
    parser_list_ct.add_argument("--node", help="Limit the listing to one node.")

    parser_start = subparsers.add_parser("start", help="Start an existing VM.")
    add_common_flags(parser_start)
    add_wait_flags(parser_start)
    parser_start.add_argument("--node", required=True, help="Node name.")
    parser_start.add_argument("--vmid", required=True, type=int, help="VM ID.")

    parser_start_ct = subparsers.add_parser("start-ct", help="Start an existing LXC container.")
    add_common_flags(parser_start_ct)
    add_wait_flags(parser_start_ct)
    parser_start_ct.add_argument("--node", required=True, help="Node name.")
    parser_start_ct.add_argument("--vmid", required=True, type=int, help="Container ID.")

    parser_create = subparsers.add_parser("create", help="Create a blank VM shell.")
    add_common_flags(parser_create)
    add_wait_flags(parser_create)
    add_common_param_flag(parser_create)
    parser_create.add_argument("--node", required=True, help="Node name.")
    parser_create.add_argument("--vmid", required=True, type=int, help="VM ID.")
    parser_create.add_argument("--name", required=True, help="VM name.")
    parser_create.add_argument("--memory", required=True, type=int, help="Memory in MiB.")
    parser_create.add_argument("--cores", required=True, type=int, help="Number of cores.")
    parser_create.add_argument("--sockets", type=int, default=1, help="Number of sockets.")
    parser_create.add_argument("--bridge", default="vmbr0", help="Bridge for net0.")
    parser_create.add_argument(
        "--net-model",
        default="virtio",
        help="Network model used for net0.",
    )
    parser_create.add_argument("--storage", help="Storage for the primary disk.")
    parser_create.add_argument("--disk-gb", type=int, help="Create scsi0 with this disk size.")
    parser_create.add_argument(
        "--cloudinit-storage",
        help="Attach cloud-init as ide2 on the given storage.",
    )
    parser_create.add_argument("--ostype", default="l26", help="Proxmox ostype value.")
    parser_create.add_argument("--cpu", default="host", help="CPU type.")
    parser_create.add_argument(
        "--scsihw",
        default="virtio-scsi-single",
        help="SCSI controller model.",
    )
    parser_create.add_argument("--agent", type=int, default=1, help="Set the QEMU agent flag.")
    parser_create.add_argument("--onboot", type=int, default=1, help="Set the onboot flag.")
    parser_create.add_argument("--description", help="Optional VM description.")

    parser_clone = subparsers.add_parser("clone", help="Clone a VM or template.")
    add_common_flags(parser_clone)
    add_wait_flags(parser_clone)
    add_common_param_flag(parser_clone)
    parser_clone.add_argument("--node", required=True, help="Source node name.")
    parser_clone.add_argument(
        "--source-vmid",
        required=True,
        type=int,
        help="Source VM or template ID.",
    )
    parser_clone.add_argument("--newid", required=True, type=int, help="Destination VM ID.")
    parser_clone.add_argument("--name", help="Destination VM name.")
    parser_clone.add_argument(
        "--target",
        help="Optional target node for the clone operation.",
    )
    parser_clone.add_argument(
        "--storage",
        help="Optional target storage for a full clone.",
    )
    parser_clone.add_argument(
        "--full",
        action="store_true",
        help="Request a full clone instead of a linked clone.",
    )
    parser_clone.add_argument(
        "--start-after-clone",
        action="store_true",
        help="Start the destination VM after the clone finishes.",
    )

    parser_create_ct = subparsers.add_parser("create-ct", help="Create an LXC container.")
    add_common_flags(parser_create_ct)
    add_wait_flags(parser_create_ct)
    add_common_param_flag(parser_create_ct)
    parser_create_ct.add_argument("--node", required=True, help="Node name.")
    parser_create_ct.add_argument("--vmid", required=True, type=int, help="Container ID.")
    parser_create_ct.add_argument("--hostname", required=True, help="Container hostname.")
    parser_create_ct.add_argument(
        "--ostemplate",
        required=True,
        help="Template volid such as local:vztmpl/ubuntu-24.04-standard_24.04-2_amd64.tar.zst.",
    )
    parser_create_ct.add_argument(
        "--storage",
        required=True,
        help="Rootfs storage such as local-lvm.",
    )
    parser_create_ct.add_argument("--memory", type=int, default=512, help="Memory in MiB.")
    parser_create_ct.add_argument("--swap", type=int, default=512, help="Swap in MiB.")
    parser_create_ct.add_argument("--cores", type=int, default=1, help="CPU cores.")
    parser_create_ct.add_argument("--disk-gb", type=int, default=8, help="Rootfs size in GiB.")
    parser_create_ct.add_argument("--bridge", default="vmbr0", help="Bridge for net0.")
    parser_create_ct.add_argument(
        "--ip",
        default="dhcp",
        help="IPv4 setting for net0. Use dhcp or a CIDR value.",
    )
    parser_create_ct.add_argument(
        "--ip6",
        help="Optional IPv6 setting for net0.",
    )
    parser_create_ct.add_argument(
        "--nameserver",
        help="Optional nameserver for the container.",
    )
    parser_create_ct.add_argument(
        "--ostype",
        default="ubuntu",
        help="Proxmox ostype value.",
    )
    parser_create_ct.add_argument(
        "--unprivileged",
        type=int,
        default=1,
        help="Set unprivileged container mode.",
    )
    parser_create_ct.add_argument(
        "--nesting",
        type=int,
        default=0,
        help="Enable nesting support when set to 1.",
    )
    parser_create_ct.add_argument(
        "--start-after-create",
        action="store_true",
        help="Start the container after creation.",
    )

    return parser


def wait_payload(
    client: ProxmoxClient,
    upid: str,
    *,
    fallback_node: str,
    enabled: bool,
    timeout: int,
    interval: int,
) -> dict[str, object] | None:
    if not enabled:
        return None
    task_node = node_from_upid(upid, fallback_node)
    task = client.wait_for_task(
        task_node,
        upid,
        timeout_seconds=timeout,
        interval_seconds=interval,
    )
    return {
        "node": task_node,
        "upid": upid,
        "task": task,
    }


def run_command(args: argparse.Namespace) -> object:
    client = build_client(args)

    if args.command == "nodes":
        return client.get("/nodes")

    if args.command == "nextid":
        return {"vmid": client.get("/cluster/nextid")}

    if args.command == "list-vms":
        if args.node:
            return {
                "node": args.node,
                "vms": client.get(f"/nodes/{args.node}/qemu"),
            }

        nodes = client.get("/nodes")
        if not isinstance(nodes, list):
            raise RuntimeError(f"Unexpected node payload: {nodes!r}")

        cluster: dict[str, object] = {}
        for node in nodes:
            if not isinstance(node, dict) or "node" not in node:
                raise RuntimeError(f"Unexpected node item: {node!r}")
            node_name = str(node["node"])
            cluster[node_name] = client.get(f"/nodes/{node_name}/qemu")
        return cluster

    if args.command == "list-cts":
        if args.node:
            return {
                "node": args.node,
                "cts": client.get(f"/nodes/{args.node}/lxc"),
            }

        nodes = client.get("/nodes")
        if not isinstance(nodes, list):
            raise RuntimeError(f"Unexpected node payload: {nodes!r}")

        cluster: dict[str, object] = {}
        for node in nodes:
            if not isinstance(node, dict) or "node" not in node:
                raise RuntimeError(f"Unexpected node item: {node!r}")
            node_name = str(node["node"])
            cluster[node_name] = client.get(f"/nodes/{node_name}/lxc")
        return cluster

    if args.command == "start":
        upid = client.post(f"/nodes/{args.node}/qemu/{args.vmid}/status/start")
        result = {
            "action": "start",
            "node": args.node,
            "vmid": args.vmid,
            "upid": upid,
        }
        waited = wait_payload(
            client,
            str(upid),
            fallback_node=args.node,
            enabled=args.wait,
            timeout=args.timeout,
            interval=args.poll_interval,
        )
        if waited:
            result["wait"] = waited
        return result

    if args.command == "start-ct":
        upid = client.post(f"/nodes/{args.node}/lxc/{args.vmid}/status/start")
        result = {
            "action": "start-ct",
            "node": args.node,
            "vmid": args.vmid,
            "upid": upid,
        }
        waited = wait_payload(
            client,
            str(upid),
            fallback_node=args.node,
            enabled=args.wait,
            timeout=args.timeout,
            interval=args.poll_interval,
        )
        if waited:
            result["wait"] = waited
        return result

    if args.command == "create":
        payload = {
            "vmid": args.vmid,
            "name": args.name,
            "memory": args.memory,
            "cores": args.cores,
            "sockets": args.sockets,
            "ostype": args.ostype,
            "cpu": args.cpu,
            "scsihw": args.scsihw,
            "agent": args.agent,
            "onboot": args.onboot,
            "description": args.description,
            "net0": f"{args.net_model},bridge={args.bridge}",
        }
        if args.disk_gb is not None and not args.storage:
            raise ValueError("--storage is required when --disk-gb is set.")
        if args.storage and args.disk_gb is not None:
            payload["scsi0"] = f"{args.storage}:{args.disk_gb}"
            payload["boot"] = "order=scsi0;net0"
        if args.cloudinit_storage:
            payload["ide2"] = f"{args.cloudinit_storage}:cloudinit"

        payload.update(parse_key_value(args.param))

        upid = client.post(f"/nodes/{args.node}/qemu", payload)
        result = {
            "action": "create",
            "node": args.node,
            "vmid": args.vmid,
            "name": args.name,
            "upid": upid,
            "payload": payload,
        }
        waited = wait_payload(
            client,
            str(upid),
            fallback_node=args.node,
            enabled=args.wait,
            timeout=args.timeout,
            interval=args.poll_interval,
        )
        if waited:
            result["wait"] = waited
        return result

    if args.command == "clone":
        payload = {
            "newid": args.newid,
            "name": args.name,
            "target": args.target,
            "storage": args.storage,
            "full": 1 if args.full else 0,
        }
        payload.update(parse_key_value(args.param))

        upid = client.post(
            f"/nodes/{args.node}/qemu/{args.source_vmid}/clone",
            payload,
        )
        result = {
            "action": "clone",
            "node": args.node,
            "source_vmid": args.source_vmid,
            "newid": args.newid,
            "upid": upid,
            "payload": payload,
        }
        waited = wait_payload(
            client,
            str(upid),
            fallback_node=args.target or args.node,
            enabled=args.wait,
            timeout=args.timeout,
            interval=args.poll_interval,
        )
        if waited:
            result["wait"] = waited

        if args.start_after_clone:
            start_upid = client.post(
                f"/nodes/{args.target or args.node}/qemu/{args.newid}/status/start"
            )
            start_result: dict[str, object] = {
                "node": args.target or args.node,
                "vmid": args.newid,
                "upid": start_upid,
            }
            if args.wait:
                start_result["wait"] = wait_payload(
                    client,
                    str(start_upid),
                    fallback_node=args.target or args.node,
                    enabled=True,
                    timeout=args.timeout,
                    interval=args.poll_interval,
                )
            result["start_after_clone"] = start_result
        return result

    if args.command == "create-ct":
        net_parts = [
            "name=eth0",
            f"bridge={args.bridge}",
            f"ip={args.ip}",
            "type=veth",
        ]
        if args.ip6:
            net_parts.append(f"ip6={args.ip6}")

        payload = {
            "vmid": args.vmid,
            "hostname": args.hostname,
            "ostemplate": args.ostemplate,
            "storage": args.storage,
            "memory": args.memory,
            "swap": args.swap,
            "cores": args.cores,
            "rootfs": f"{args.storage}:{args.disk_gb}",
            "net0": ",".join(net_parts),
            "ostype": args.ostype,
            "unprivileged": args.unprivileged,
        }
        if args.nameserver:
            payload["nameserver"] = args.nameserver
        if args.nesting:
            payload["features"] = "nesting=1"

        payload.update(parse_key_value(args.param))

        upid = client.post(f"/nodes/{args.node}/lxc", payload)
        result = {
            "action": "create-ct",
            "node": args.node,
            "vmid": args.vmid,
            "hostname": args.hostname,
            "upid": upid,
            "payload": payload,
        }
        waited = wait_payload(
            client,
            str(upid),
            fallback_node=args.node,
            enabled=args.wait,
            timeout=args.timeout,
            interval=args.poll_interval,
        )
        if waited:
            result["wait"] = waited

        if args.start_after_create:
            start_upid = client.post(f"/nodes/{args.node}/lxc/{args.vmid}/status/start")
            start_result: dict[str, object] = {
                "node": args.node,
                "vmid": args.vmid,
                "upid": start_upid,
            }
            if args.wait:
                start_result["wait"] = wait_payload(
                    client,
                    str(start_upid),
                    fallback_node=args.node,
                    enabled=True,
                    timeout=args.timeout,
                    interval=args.poll_interval,
                )
            result["start_after_create"] = start_result
        return result

    raise RuntimeError(f"Unsupported command: {args.command}")


def main() -> int:
    parser = make_parser()
    args = parser.parse_args()

    try:
        result = run_command(args)
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
