"""Exercise real sh processes with synthetic paths and helper bytes, never SSH."""
import hashlib
import importlib.util
import os
from pathlib import Path
import subprocess
import sys
import tempfile

HERE = Path(__file__).resolve().parent


def main(case):
    if case in ("host-gate", "route", "success-parser"):
        return check_host(case)
    with tempfile.TemporaryDirectory(prefix="pi-ink-deploy-smoke-") as temporary:
        root = Path(temporary)
        home = root / "home"
        user = home / "root"
        user.mkdir(parents=True)
        staging = user / "pi-ink-offline-reader-0029"
        counter = root / "invoked"
        body = "#!/bin/sh\nprintf 'run\\n' >> '" + str(counter) + "'\n"
        if case == "reader-failure":
            body += "exit 7\n"
        elif case == "helper-changed":
            body += 'chmod 700 "$0"\n'
        elif case == "unexpected-file":
            body += "printf 'retain\\n' > '" + str(staging / "unexpected") + "'\n"
        body += "printf '%s\\n' SYNTHETIC_READER_COMPLETE\n"
        payload = body.encode()
        # Only throwaway test copies change fixed roots/UIDs/hash. Production has no override.
        script = (HERE / "remote.sh").read_text()
        script = script.replace("expected_uid=0", "expected_uid=" + str(os.getuid()))
        script = script.replace("expected_gid=0", "expected_gid=" + str(os.getgid()))
        script = script.replace("ancestors='/ /home /home/root'", "ancestors='" + str(home) + " " + str(user) + "'")
        script = script.replace("staging=/home/root/pi-ink-offline-reader-0029", "staging=" + str(staging))
        script = script.replace("expected_sha=03016b9c35aeecd82362fe34e4187037a7ee5ebf76014fd7df2f6264aca228d6", "expected_sha=" + hashlib.sha256(payload).hexdigest())
        script = script.replace("expected_size=2489186", "expected_size=" + str(len(payload)))
        if case == "occupied":
            staging.mkdir()
            (staging / "retain").write_text("owned elsewhere")
        elif case == "dangling":
            staging.symlink_to(root / "absent")
        elif case == "ancestor-link":
            user.rmdir()
            user.symlink_to(root)
        elif case == "bad-transfer":
            payload = b"X" * len(payload)
        elif case == "oversize":
            payload += b"extra"
        result = subprocess.run(["sh", "-c", script], input=payload,
                                capture_output=True, timeout=5, check=False)
        output = result.stdout.decode()
        invocations = counter.read_text().splitlines() if counter.exists() else []
        if case == "success":
            assert result.returncode == 0, (output, result.stderr)
            assert not staging.exists() and invocations == ["run"]
            assert "HELPER_REMOVED_AND_DIRECTORY_EMPTY_REMOVED" in output
        else:
            assert result.returncode != 0, output
            assert "HELPER_REMOVED_AND_DIRECTORY_EMPTY_REMOVED" not in output
            if case == "occupied":
                assert (staging / "retain").read_text() == "owned elsewhere" and not invocations
            elif case == "dangling":
                assert staging.is_symlink() and not invocations
            elif case == "ancestor-link":
                assert not staging.exists() and not invocations
            elif case in ("bad-transfer", "oversize"):
                assert (staging / "reader").read_bytes() == payload and not invocations
            elif case in ("reader-failure", "helper-changed"):
                assert (staging / "reader").exists() and invocations == ["run"]
            elif case == "unexpected-file":
                assert (staging / "unexpected").read_text() == "retain\n" and invocations == ["run"]
                assert not (staging / "reader").exists()
            else:
                raise AssertionError("unknown case")
        print(case + ": PASS (synthetic local sh only)")


def check_host(case):
    if case == "host-gate":
        environment = {key: value for key, value in os.environ.items() if not key.startswith("PI_INK_")}
        result = subprocess.run([sys.executable, str(HERE / "deploy.py"), "deploy-once"],
                                env=environment, capture_output=True, text=True, timeout=5)
        assert result.returncode != 0 and result.stderr.strip() == "DEPLOYMENT_REFUSAL NEW_EXECUTION_APPROVAL_REQUIRED"
        assert not (HERE / "execution-0031").exists()
    else:
        specification = importlib.util.spec_from_file_location("deployment", HERE / "deploy.py")
        module = importlib.util.module_from_spec(specification)
        specification.loader.exec_module(module)
        if case == "route":
            valid = {"dev": module.INTERFACE, "prefsrc": module.ADDRESS}
            module.verify_route([valid])
            for rows in ([], [valid, valid], [dict(valid, gateway="10.11.99.254")],
                         [dict(valid, dev="wlan0")], [dict(valid, prefsrc="192.168.1.2")]):
                try:
                    module.verify_route(rows)
                except SystemExit:
                    pass
                else:
                    raise AssertionError("unsafe route accepted")
        else:
            rows = ["READER_INVOCATION_BEGIN", "READER_EXIT_ZERO",
                    "TWO_FIXED_CONFIG_DIGESTS_COMPLETE_NO_DELETION_AUTHORITY",
                    "HELPER_REMOVED_AND_DIRECTORY_EMPTY_REMOVED"]
            for role in ("private-stage-config", "private-backup-config"):
                rows.append("CONFIG_SHA256 ROLE=" + role + " SHA256=" + "a" * 64)
            assert module.valid_success("\n".join(rows))
            assert not module.valid_success("\n".join(rows[:-1]))
            assert not module.valid_success("\n".join(rows + [rows[-1]]))
            assert not module.valid_success("\n".join(row for row in rows if row != "READER_EXIT_ZERO"))
    print(case + ": PASS (no device access)")


if __name__ == "__main__":
    main(sys.argv[1])
