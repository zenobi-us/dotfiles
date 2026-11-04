#!/usr/bin/env python3
"""Coordinate approved cleanup. Default: no cleanup-target or network access."""
import hashlib
import json
import os
from pathlib import Path
import shlex
import stat
import subprocess
import sys
import datetime

HERE = Path(__file__).resolve().parent
MANIFEST = HERE.parent / "cleanup-manifest-0035" / "manifest.json"
MANIFEST_SHA = "58e922578c95faf911f6e8740d85e31748011be44566304e9166c00dc447ebfc"
INTERFACE = "enp2s0f0u4c2"
ADDRESS = "10.11.99.10"
DEVICE = "/sys/devices/pci0000:00/0000:00:01.2/0000:02:00.0/usb1/1-4/1-4:2.0"


def main():
    if sys.argv[1:] != ["cleanup-once"]:
        refuse("EXACT_CLEANUP_ONCE_ACTION_REQUIRED")
    if os.environ.get("PI_INK_CLEANUP_APPROVED") != "cleanup-executor-0036":
        refuse("NEW_IRREVERSIBLE_APPROVAL_REQUIRED")
    if os.environ.get("PI_INK_OPERATOR_HANDOFF") != "confirmed-to-parent":
        refuse("EXCLUSIVE_OPERATOR_HANDOFF_REQUIRED")
    if os.environ.get("PI_INK_USB_READY") != "connected-and-confirmed":
        refuse("USB_READINESS_CONFIRMATION_REQUIRED")
    if any(value for key, value in os.environ.items() if key.startswith("PI_INK_")
           and key.endswith("_APPROVED") and key != "PI_INK_CLEANUP_APPROVED"):
        refuse("OTHER_SCOPE_APPROVAL_FLAGS_FORBIDDEN")
    plan_bytes = fixed_bytes(HERE / "plan.json", 32768)
    if digest(plan_bytes) != os.environ.get("PI_INK_APPROVED_PLAN_SHA256"):
        refuse("APPROVED_PLAN_HASH_REQUIRED")
    plan = json.loads(plan_bytes)
    manifest_bytes = fixed_bytes(MANIFEST, 1048576)
    if digest(manifest_bytes) != MANIFEST_SHA or plan["manifest_sha256"] != MANIFEST_SHA:
        refuse("MANIFEST_HASH_MISMATCH")
    manifest = json.loads(manifest_bytes)
    verify_pin(fixed_bytes(HERE / "cleanup.py", 32768), plan["launcher"])
    verify_pin(fixed_bytes(HERE / "cleanup-linux-amd64", 16777216), plan["host_binary"])
    device_binary = fixed_bytes(HERE / "cleanup-linux-arm64", 16777216)
    verify_pin(device_binary, plan["device_binary"])
    remote = fixed_bytes(HERE / "remote.sh", 32768)
    verify_pin(remote, plan["remote"])
    environment = dict(os.environ, PI_INK_CLEANUP_EXECUTOR_APPROVED=MANIFEST_SHA)
    attempt = HERE / "execution-0036"
    attempt.mkdir(mode=0o700)
    record = {"schema": "pi-ink-fixed-cleanup-execution/v1",
              "started_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
              "attempt_consumed": True, "retry_authorized": False,
              "manifest_sha256": MANIFEST_SHA, "plan_sha256": digest(plan_bytes), "phases": []}
    with (attempt / "attempt.json").open("x") as output:
        json.dump(record, output, indent=2)
    try:
        # Host preflight happens before device deletion. Each apply revalidates its side.
        phase = run_phase("host-check", [str(HERE / "cleanup-linux-amd64"), "check"], environment, 45)
        record["phases"].append(phase)
        if phase["exit_code"] != 0 or "ALL_TARGETS_PREFLIGHT_PASSED\n" not in phase["stdout"]:
            return finish(attempt, record, False)
        verify_usb()
        command = ["timeout", "--signal=TERM", "--kill-after=5s", "90s", "ssh", "-T",
                   "-o", "BatchMode=yes", "-o", "ConnectTimeout=8", "-o", "StrictHostKeyChecking=yes",
                   "-o", "ControlMaster=no", "-o", "ControlPath=none", "-o", "ProxyCommand=none",
                   "-o", "ProxyJump=none", "-o", "BindInterface=" + INTERFACE,
                   "-o", "BindAddress=" + ADDRESS, "root@10.11.99.1",
                   "sh -c " + shlex.quote(remote.decode("ascii"))]
        phase = run_phase("device-apply", command, environment, 100, device_binary)
        record["phases"].append(phase)
        if (phase["exit_code"] != 0
                or not valid_side(phase["stdout"], manifest["device_entries"] + manifest["device_root_directories"])
                or any(phase["stdout"].splitlines().count(token) != 1 for token in (
                    "CLEANUP_EXECUTOR_BEGIN", "CLEANUP_EXECUTOR_EXIT_ZERO",
                    "NEW_CLEANUP_HELPER_AND_DIRECTORY_REMOVED"))):
            return finish(attempt, record, False)
        phase = run_phase("host-apply", [str(HERE / "cleanup-linux-amd64"), "apply"], environment, 45)
        record["phases"].append(phase)
        return finish(attempt, record, phase["exit_code"] == 0 and valid_side(
            phase["stdout"], manifest["host_entries"] + manifest["host_directories"]))
    except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError, SystemExit):
        record["failure"] = "LOCAL_OR_TRANSPORT_GUARD_FAILED_PRESERVE_NO_RETRY"
        return finish(attempt, record, False)


def run_phase(name, command, environment, seconds, payload=None):
    try:
        result = subprocess.run(command, env=environment, input=payload,
                                capture_output=True, timeout=seconds, check=False)
        return {"name": name, "exit_code": result.returncode,
                "stdout": result.stdout.decode("utf-8", errors="replace"),
                "stderr": result.stderr.decode("utf-8", errors="replace")}
    except subprocess.TimeoutExpired as error:
        return {"name": name, "exit_code": None, "process_state": "UNKNOWN_AFTER_TIMEOUT",
                "stdout": (error.stdout or b"").decode("utf-8", errors="replace"),
                "stderr": (error.stderr or b"").decode("utf-8", errors="replace")}


def finish(attempt, record, success):
    record["success"] = success
    record["state"] = "MANIFEST_SCOPE_FINISHED_WITH_RETAINED_STATE" if success else "STOPPED_POSSIBLE_PARTIAL_REMOVAL_PRESERVE_NO_RETRY"
    record["finished_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with (attempt / "result.json").open("x") as output:
        json.dump(record, output, indent=2)
    print(record["state"])
    return 0 if success else 1


def fixed_bytes(path, cap):
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(descriptor, "rb") as source:
        info = os.fstat(source.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_size > cap:
            refuse("LOCAL_ARTIFACT_TYPE_OR_SIZE")
        data = source.read(cap + 1)
        if len(data) > cap:
            refuse("LOCAL_ARTIFACT_CAP")
        return data


def digest(data):
    return hashlib.sha256(data).hexdigest()


def verify_pin(data, pin):
    if len(data) != pin["bytes"] or digest(data) != pin["sha256"]:
        refuse("FROZEN_ARTIFACT_MISMATCH")


def verify_usb():
    route = subprocess.run(["ip", "-j", "route", "get", "10.11.99.1"], capture_output=True, timeout=8, check=False)
    if route.returncode:
        refuse("USB_ROUTE_UNAVAILABLE")
    rows = json.loads(route.stdout)
    if (len(rows) != 1 or rows[0].get("gateway") is not None
            or rows[0].get("dev") != INTERFACE or rows[0].get("prefsrc") != ADDRESS):
        refuse("DIRECT_USB_ROUTE_MISMATCH")
    interface = Path("/sys/class/net") / INTERFACE
    if (interface / "wireless").exists() or (interface / "phy80211").exists():
        refuse("WIRELESS_INTERFACE")
    if str((interface / "device").resolve(strict=True)) != DEVICE:
        refuse("PHYSICAL_USB_DEVICE_MISMATCH")


def valid_side(output, entries):
    rows = output.splitlines()
    if rows.count("FIXED_MANIFEST_SIDE_COMPLETE") != 1:
        return False
    dispositions = {}
    for prefix in ("REMOVED_FILE ", "REMOVED_DIRECTORY ", "RETAINED_MARKER ", "RETAINED_DIRECTORY "):
        values = [line[len(prefix):] for line in rows if line.startswith(prefix)]
        if len(values) != len(set(values)):
            return False
        dispositions[prefix] = set(values)
    removed = dispositions["REMOVED_FILE "]
    required = {row["path"] for row in entries if row["action"] == "unlink_regular_file"}
    markers = {row["path"] for row in entries if row["action"].startswith("unlink_marker")}
    directories = {row["path"] for row in entries if row["action"].startswith("rmdir")}
    removed_markers = removed & markers
    kept_markers = dispositions["RETAINED_MARKER "]
    removed_directories = dispositions["REMOVED_DIRECTORY "]
    kept_directories = dispositions["RETAINED_DIRECTORY "]
    return (required.issubset(removed) and removed.issubset(required | markers)
            and not (removed_markers & kept_markers) and removed_markers | kept_markers == markers
            and not (removed_directories & kept_directories)
            and removed_directories | kept_directories == directories)


def refuse(reason):
    raise SystemExit("CLEANUP_REFUSAL " + reason)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError):
        refuse("LOCAL_PREPARATION_FAILURE_NO_RETRY")
