"""Offline-only, stdlib validation. Never opens a remote connection or private config."""
import hashlib
import json
import os
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parent
os.chdir(root)
env = dict(os.environ, GO111MODULE="off", GOENV="off", GOTOOLCHAIN="local", GOPROXY="off", GOSUMDB="off", CGO_ENABLED="0", GOOS="linux", GOARCH="amd64")
records = []

def run(name, command, extra=None, expected=0):
    result = subprocess.run(command, env=dict(env, **(extra or {})), capture_output=True, text=True, timeout=120)
    record = dict(name=name, command=command, environment={key: dict(env, **(extra or {}))[key] for key in ("GO111MODULE", "GOENV", "GOTOOLCHAIN", "GOPROXY", "GOSUMDB", "CGO_ENABLED", "GOOS", "GOARCH")}, exit_code=result.returncode, stdout=result.stdout, stderr=result.stderr)
    records.append(record)
    (root / "validation.json").write_text(json.dumps(dict(schema="pi-ink-offline-validation/v1", records=records), indent=2) + "\n")
    print(name, result.returncode, flush=True)
    if result.returncode != expected:
        print(result.stdout, result.stderr)
        raise SystemExit("offline validation failed")
    return result

run("format-final", ["gofmt", "-w", "main_linux.go", "reader_linux.go", "host_fixture_linux.go", "main_linux_test.go"])
run("host-tests", ["go", "test", "-count=1", "-timeout=45s", "-v", "."])
run("host-static-build", ["go", "build", "-trimpath", "-buildvcs=false", "-ldflags=-buildid=", "-o", "reader-linux-amd64", "."])
run("arm64-static-build", ["go", "build", "-trimpath", "-buildvcs=false", "-ldflags=-buildid=", "-o", "reader-linux-arm64", "."], {"GOARCH": "arm64"})
run("host-fixture-build", ["go", "build", "-tags=hostfixture", "-trimpath", "-buildvcs=false", "-ldflags=-buildid=", "-o", "host-fixture-linux-amd64", "."])
run("synthetic-host-smoke", ["./host-fixture-linux-amd64"])
result = run("production-rejects-fixture-override", ["./reader-linux-amd64", "--fixture=/unapproved"], expected=1)
assert result.stdout == "REFUSAL ARGUMENTS\n" and result.stderr == ""
run("artifact-elf-identity", ["file", "reader-linux-amd64", "reader-linux-arm64", "host-fixture-linux-amd64"])
run("arm64-program-headers", ["readelf", "-l", "reader-linux-arm64"])
for binary in ("reader-linux-amd64", "reader-linux-arm64"):
    data = (root / binary).read_bytes()
    assert data[:4] == b"\x7fELF"
index = {p.name: {"sha256": hashlib.sha256(p.read_bytes()).hexdigest(), "bytes": p.stat().st_size} for p in sorted(root.iterdir()) if p.is_file() and p.name not in ("sha256-index.json",)}
(root / "sha256-index.json").write_text(json.dumps(index, indent=2) + "\n")
print("OFFLINE_TEST_BUILD_SMOKE_PASS_NO_DEVICE_EXECUTION")
