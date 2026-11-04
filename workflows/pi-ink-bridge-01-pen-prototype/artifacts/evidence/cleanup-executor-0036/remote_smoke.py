"""Run the real remote shell with synthetic roots and a host-only fixture binary."""
import hashlib
import importlib.util
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile

HERE = Path(__file__).resolve().parent


def main(case):
    if case == "completion-boundaries":
        specification = importlib.util.spec_from_file_location("fixed_cleanup", HERE / "cleanup.py")
        module = importlib.util.module_from_spec(specification)
        specification.loader.exec_module(module)
        entries = [{"path": "/tmp/owned/key", "action": "unlink_regular_file"},
                   {"path": "/tmp/owned/owner.txt", "action": "unlink_marker_last_if_no_retained_children"}]
        good = "REMOVED_FILE /tmp/owned/key\nRETAINED_MARKER /tmp/owned/owner.txt\nFIXED_MANIFEST_SIDE_COMPLETE\n"
        assert module.valid_side(good, entries)
        assert not module.valid_side(good.replace("REMOVED_FILE /tmp/owned/key\n", ""), entries)
        assert not module.valid_side(good + "REMOVED_FILE /tmp/unapproved\n", entries)
        assert not module.valid_side(good + "REMOVED_FILE /tmp/owned/key\n", entries)
        assert not module.valid_side(good.replace("FIXED_MANIFEST_SIDE_COMPLETE", "REFUSAL"), entries)
        print("COMPLETION_BOUNDARIES_PASS")
        return
    with tempfile.TemporaryDirectory(prefix="pi-ink-cleanup-shell-fixture-") as temporary:
        base = Path(temporary)
        home = base / "home"
        user = home / "root"
        user.mkdir(parents=True)
        staging = user / "pi-ink-cleanup-executor-0036"
        partial = base / "synthetic-eligible-file"
        partial.write_text("synthetic")
        payload = (HERE / "fixture-linux-amd64").read_bytes()
        if case == "partial-failure":
            payload = ("#!/bin/sh\nrm -- '" + str(partial) + "'\nexit 7\n").encode()
        script = (HERE / "remote.sh").read_text()
        # Changes apply only to the temporary fixture copy. Production has no overrides.
        script = script.replace("expected_uid=0", "expected_uid=" + str(os.getuid()))
        script = script.replace("expected_gid=0", "expected_gid=" + str(os.getgid()))
        script = script.replace("ancestors='/ /home /home/root'", "ancestors='" + str(home) + " " + str(user) + "'")
        script = script.replace("staging=/home/root/pi-ink-cleanup-executor-0036", "staging=" + str(staging))
        script = re.sub(r"(?m)^expected_sha=[0-9a-f]+$", "expected_sha=" + hashlib.sha256(payload).hexdigest(), script)
        script = re.sub(r"(?m)^expected_size=[0-9]+$", "expected_size=" + str(len(payload)), script)
        if case == "occupied":
            staging.mkdir()
            (staging / "retained").write_text("keep")
        elif case == "bad-transfer":
            payload = b"X" * len(payload)
        result = subprocess.run(["sh", "-c", script], input=payload,
                                capture_output=True, timeout=10, check=False)
        output = result.stdout.decode()
        if case == "success":
            assert result.returncode == 0, (output, result.stderr)
            assert "HOST_SYNTHETIC_APPLY_PASS_NO_REAL_TARGET_ACCESS" in output
            assert output.splitlines().count("CLEANUP_EXECUTOR_BEGIN") == 1
            assert output.splitlines().count("NEW_CLEANUP_HELPER_AND_DIRECTORY_REMOVED") == 1
            assert not staging.exists() and partial.read_text() == "synthetic"
        elif case == "occupied":
            assert result.returncode != 0 and (staging / "retained").read_text() == "keep"
            assert "CLEANUP_EXECUTOR_BEGIN" not in output
        elif case == "bad-transfer":
            assert result.returncode != 0 and (staging / "executor").read_bytes() == payload
            assert "CLEANUP_EXECUTOR_BEGIN" not in output
        elif case == "partial-failure":
            assert result.returncode != 0 and not partial.exists()
            assert (staging / "executor").exists()
            assert "NEW_CLEANUP_HELPER_AND_DIRECTORY_REMOVED" not in output
        else:
            raise AssertionError("unknown fixture case")
        print(case + ": SYNTHETIC_REMOTE_TRANSACTION_PASS")


if __name__ == "__main__":
    main(sys.argv[1])
