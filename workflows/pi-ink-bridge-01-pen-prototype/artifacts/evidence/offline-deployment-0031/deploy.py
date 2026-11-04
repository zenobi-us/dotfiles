#!/usr/bin/env python3
"""Run one approved cable-SSH transaction. No approval means no route or SSH call."""
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import subprocess
import sys

BASE = Path(__file__).resolve().parent
READER = BASE.parent / "offline-reader-0029" / "reader-linux-arm64"
DESTINATION = "root@10.11.99.1"
INTERFACE = "enp2s0f0u4c2"
ADDRESS = "10.11.99.10"
PHYSICAL_DEVICE = "/sys/devices/pci0000:00/0000:00:01.2/0000:02:00.0/usb1/1-4/1-4:2.0"


def main():
    if sys.argv[1:] != ["deploy-once"]:
        refuse("EXACT_DEPLOY_ONCE_ACTION_REQUIRED")
    if os.environ.get("PI_INK_DEPLOYMENT_APPROVED") != "offline-deployment-0031":
        refuse("NEW_EXECUTION_APPROVAL_REQUIRED")
    if os.environ.get("PI_INK_OPERATOR_HANDOFF") != "confirmed-to-parent":
        refuse("EXCLUSIVE_OPERATOR_HANDOFF_REQUIRED")
    if os.environ.get("PI_INK_USB_READY") != "connected-and-confirmed":
        refuse("NEW_USB_READINESS_CONFIRMATION_REQUIRED")
    if any(os.environ.get(name) for name in (
        "PI_INK_RECOVERY_PREFLIGHT_APPROVED", "PI_INK_STAGE_BC_APPROVED",
        "PI_INK_EXACT_PLAN_APPROVED", "PI_INK_PUBLIC_PAYLOAD_INVENTORY_APPROVED",
        "PI_INK_CONFIG_DIGEST_APPROVED",
    )):
        refuse("OTHER_SCOPE_APPROVAL_FLAGS_FORBIDDEN")
    plan_bytes = read_regular(BASE / "plan.json", 32768)
    if hashlib.sha256(plan_bytes).hexdigest() != os.environ.get("PI_INK_APPROVED_PLAN_SHA256"):
        refuse("APPROVED_PLAN_HASH_REQUIRED")
    plan = json.loads(plan_bytes)
    verify_pin(read_regular(BASE / "deploy.py", 32768), plan["host"])
    remote = read_regular(BASE / "remote.sh", 32768)
    verify_pin(remote, plan["remote"])
    payload = read_regular(READER, 2489186)
    verify_pin(payload, plan["reader"])
    route_result = subprocess.run(["ip", "-j", "route", "get", "10.11.99.1"],
                                  capture_output=True, timeout=8, check=False)
    if route_result.returncode:
        refuse("USB_ROUTE_UNAVAILABLE")
    verify_route(json.loads(route_result.stdout))
    interface = Path("/sys/class/net") / INTERFACE
    if (interface / "wireless").exists() or (interface / "phy80211").exists():
        refuse("WIRELESS_INTERFACE_REFUSED")
    if str((interface / "device").resolve(strict=True)) != PHYSICAL_DEVICE:
        refuse("USB_PHYSICAL_DEVICE_MISMATCH")
    # The local reservation prevents repeating an interrupted transaction.
    run_directory = BASE / "execution-0031"
    run_directory.mkdir(mode=0o700)
    command = ["timeout", "--signal=TERM", "--kill-after=5s", "45s", "ssh", "-T",
               "-o", "BatchMode=yes", "-o", "ConnectTimeout=8",
               "-o", "StrictHostKeyChecking=yes", "-o", "ControlMaster=no",
               "-o", "ControlPath=none", "-o", "ProxyCommand=none",
               "-o", "ProxyJump=none", "-o", "BindInterface=" + INTERFACE,
               "-o", "BindAddress=" + ADDRESS, DESTINATION,
               "sh -c " + shlex.quote(remote.decode("ascii"))]
    record = {"schema": "pi-ink-deployment-execution/v1", "attempt_consumed": True,
              "plan_sha256": hashlib.sha256(plan_bytes).hexdigest(),
              "remote_state": "UNKNOWN_UNTIL_RESULT", "retry_authorized": False}
    with (run_directory / "attempt.json").open("x") as target:
        json.dump(record, target, indent=2)
    try:
        completed = subprocess.run(command, input=payload, capture_output=True, timeout=55, check=False)
        record.update(exit_code=completed.returncode,
                      stdout=completed.stdout.decode("utf-8", errors="replace"),
                      stderr=completed.stderr.decode("utf-8", errors="replace"))
        success = completed.returncode == 0 and valid_success(record["stdout"])
        record["remote_state"] = "TRANSACTION_COMPLETE" if success else "FAILED_OR_UNKNOWN_PRESERVE_NO_RETRY"
    except subprocess.TimeoutExpired:
        record.update(exit_code=None, remote_state="REMOTE_PROCESS_STATE_UNKNOWN", success=False)
        success = False
    record["success"] = success
    with (run_directory / "result.json").open("x") as target:
        json.dump(record, target, indent=2)
    print("DEPLOYMENT_COMPLETE" if success else "DEPLOYMENT_STOPPED_PRESERVE_NO_RETRY")
    return 0 if success else 1


def refuse(reason):
    raise SystemExit("DEPLOYMENT_REFUSAL " + reason)


def read_regular(path, limit):
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(descriptor, "rb") as source:
        import stat
        metadata = os.fstat(source.fileno())
        if not stat.S_ISREG(metadata.st_mode) or metadata.st_size > limit:
            refuse("LOCAL_FILE_TYPE_OR_SIZE")
        data = source.read(limit + 1)
        if len(data) > limit:
            refuse("LOCAL_FILE_SIZE_CAP")
        return data


def verify_pin(data, pin):
    if len(data) != pin["bytes"] or hashlib.sha256(data).hexdigest() != pin["sha256"]:
        refuse("FROZEN_ARTIFACT_MISMATCH")


def verify_route(rows):
    if (not isinstance(rows, list) or len(rows) != 1 or rows[0].get("gateway") is not None
            or rows[0].get("dev") != INTERFACE or rows[0].get("prefsrc") != ADDRESS):
        refuse("DIRECT_USB_ROUTE_MISMATCH")


def valid_success(output):
    lines = output.splitlines()
    for role in ("private-stage-config", "private-backup-config"):
        if len(re.findall(r"^CONFIG_SHA256 ROLE=" + role + r" SHA256=[0-9a-f]{64}$", output, re.M)) != 1:
            return False
    return all(lines.count(token) == 1 for token in (
        "READER_INVOCATION_BEGIN", "READER_EXIT_ZERO",
        "TWO_FIXED_CONFIG_DIGESTS_COMPLETE_NO_DELETION_AUTHORITY",
        "HELPER_REMOVED_AND_DIRECTORY_EMPTY_REMOVED",
    ))


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError):
        refuse("LOCAL_OR_TRANSPORT_FAILURE_PRESERVE_NO_RETRY")
