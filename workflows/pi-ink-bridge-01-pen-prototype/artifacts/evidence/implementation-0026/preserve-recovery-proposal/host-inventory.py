# Read-only inventory of proven host credential/code roots; never prints file contents.
import hashlib
import json
import re
import os
from pathlib import Path
import stat
import subprocess

OWNER = "a9eecd4c06a5fa0ec38a0935ad97fd29654f7b8b828493b2ca96ffe1116cbf8d"
TRUST = {"tablet-sidebar.json", "sidebar-origin-a-stderr.log", "sidebar-origin-b-stderr.log", "desktop-sidebar-b.json", "desktop-sidebar-a.json", "payload-sha256.txt", "owner.txt", "tablet.json", "b-source.pdf", "a-source.pdf", "host-client-state.json", "env-fixed-origin-b-stderr.log", "env-fixed-origin-a-stderr.log", "host-tablet.json", "final-origin-a-stderr.log", "final-origin-b-stderr.log", "origin-b-stderr.log", "origin-a-stderr.log", "desktop-b.json", "server-b.pem", "server-b-key.pem", "desktop-a.json", "server-a.pem", "server-a-key.pem"}
PAYLOAD = {"payload-sha256.txt", "tablet-qml", "trust", "pi-ink-tablet", "pi-ink-bridge.qmd", "config.json", "owner.txt", "adapter.so"}
ROOTS = {"/tmp/pi-ink-0020-trust": TRUST, "/tmp/pi-ink-0020-sidebar-reviewed-payload": PAYLOAD, "/tmp/pi-ink-0020-sidebar-payload": PAYLOAD}
ROOTS["/tmp/pi-ink-0020-native-button-repair-payload"] = {"PiInkToolbar.qml", "owner.txt", "payload-sha256.txt"}
ROOTS["/tmp/pi-ink-ui-validation-0023/payload"] = {"PiInkToolbar.qml", "pi-ink-bridge.qmd", "owner.txt", "payload-sha256.txt"}
CONFIG_PATHS = {f"/tmp/pi-ink-0020-trust/desktop{suffix}.json" for suffix in ("-a", "-b", "-sidebar-a", "-sidebar-b")}
SOURCE = "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype"


def main():
    if os.environ.get("PI_INK_RECOVERY_PREFLIGHT_APPROVED") != "preserve-recovery-0026":
        raise SystemExit("ABORT: exact fresh host recovery inventory approval required")
    total = 0
    unknown = 0
    hashed = 0
    private_tokens = set()
    logs_to_check = []
    for root_text, allowed in ROOTS.items():
        root = Path(root_text)
        safe_parent_chain(root)
        try:
            root_info = metadata(root)
        except (FileNotFoundError, PermissionError):
            emit(path=root_text, status="MISSING_OR_INACCESSIBLE_PRESERVE")
            continue
        emit(path=root_text, **root_info)
        if not root_info["directory"] or root_info["symlink"] or root_info["uid"] != os.getuid() or root_info["mode"] != "0o700":
            unknown += 1
            emit(path=root_text, status="UNOWNED_ROOT_PRESERVE_NO_CHILD_READ")
            continue
        marker = root / "owner.txt"
        info = marker.lstat()
        if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or info.st_size > 256 or hashlib.sha256(marker.read_bytes()).hexdigest() != OWNER:
            unknown += 1
            emit(path=root_text, status="UNKNOWN_OWNER_MARKER_PRESERVE")
            continue
        directories = [(root, allowed)]
        if root_text in ("/tmp/pi-ink-0020-sidebar-reviewed-payload", "/tmp/pi-ink-0020-sidebar-payload"):
            directories += [(root / "tablet-qml", {"PiInkToolbar.qml"}), (root / "trust", {"server-a.pem", "server-b.pem"})]
        for directory, names in directories:
            safe_parent_chain(directory)
            dir_info = metadata(directory)
            if not dir_info["directory"] or dir_info["symlink"] or dir_info["uid"] != os.getuid():
                unknown += 1
                emit(path=str(directory), status="UNKNOWN_NESTED_DIRECTORY_PRESERVE")
                continue
            with os.scandir(directory) as entries:
                for index, entry in enumerate(entries):
                    total += 1
                    if index >= 128 or total > 256:
                        raise RuntimeError("host entry cap reached; preserve all remaining paths")
                    if entry.name not in names:
                        unknown += 1
                        emit(directory=str(directory), unknown_name_sha256=hashlib.sha256(os.fsencode(entry.name)).hexdigest(), status="UNKNOWN_ENTRY_PRESERVE")
                        continue
                    path = directory / entry.name
                    info = metadata(path)
                    emit(path=str(path), **info)
                    if info["symlink"] or info["uid"] != os.getuid():
                        unknown += 1
                        emit(path=str(path), status="UNOWNED_OR_SYMLINK_PRESERVE_NO_CONTENT_READ")
                        continue
                    if not info["regular"]:
                        continue
                    if entry.name.endswith(".log"):
                        logs_to_check.append(path)
                        emit(path=str(path), status="HISTORY_PRESERVED_BOUNDED_SECRET_MATCH_ONLY_FOLLOWS")
                        continue
                    if entry.name == "host-client-state.json" or entry.name.endswith(".pdf"):
                        emit(path=str(path), status="OPAQUE_STATE_OR_DURABLE_PDF_METADATA_ONLY_PRESERVE")
                        continue
                    if info["size"] > 10485760 or hashed + info["size"] > 67108864:
                        unknown += 1
                        emit(path=str(path), status="HASH_CAP_PRESERVE_NO_READ")
                        continue
                    # Digest-only pinning includes explicit credential/config/key names.
                    # New approval must explicitly allow this; no credential bytes are output.
                    hashed += info["size"]
                    data = path.read_bytes()
                    digest = hashlib.sha256(data).hexdigest()
                    emit(path=str(path), sha256=digest, status="IDENTITY_PIN_ONLY_NO_DELETION_AUTHORITY")
                    if entry.name.endswith(".json"):
                        try:
                            collect_tokens(json.loads(data), private_tokens)
                        except (ValueError, UnicodeError):
                            unknown += 1
                            emit(path=str(path), status="CONFIG_PARSE_UNKNOWN_NO_VALUE_OUTPUT")
    binary = Path("/tmp/pi-ink-0020-offline/pi-ink-tablet")
    safe_parent_chain(binary)
    try:
        info = metadata(binary)
    except (FileNotFoundError, PermissionError):
        emit(path=str(binary), status="MISSING_OR_INACCESSIBLE_PRESERVE")
    else:
        emit(path=str(binary), **info)
        if info["regular"] and not info["symlink"] and info["uid"] == os.getuid() and info["size"] <= 10485760 and hashed + info["size"] <= 67108864:
            hashed += info["size"]
            emit(path=str(binary), sha256=hashlib.sha256(binary.read_bytes()).hexdigest(), status="EXACT_PRIOR_BUILD_PATH_IDENTITY_PIN_NO_DELETION_AUTHORITY")
        else:
            unknown += 1
            emit(path=str(binary), status="UNKNOWN_BINARY_PRESERVE_NO_READ")
    for log in logs_to_check:
        safe_parent_chain(log)
        info = metadata(log)
        if not info["regular"] or info["symlink"] or info["uid"] != os.getuid() or info["size"] > 1048576:
            unknown += 1
            emit(path=str(log), status="HISTORY_SECRET_CHECK_INCOMPLETE_PRESERVE")
            continue
        data = log.read_bytes()
        token_match = any(token in data for token in private_tokens)
        private_key_marker = b"PRIVATE KEY-----" in data
        emit(path=str(log), known_token_match=token_match, private_key_marker=private_key_marker, status="HISTORY_SECRET_PRESENCE_ONLY_NO_CONTENT_OUTPUT")
        if token_match or private_key_marker:
            unknown += 1
    for port in (9443, 9444):
        result = subprocess.run(["ss", "-H", "-ltnp", f"sport = :{port}"], capture_output=True, text=True, timeout=5)
        if result.returncode or len(result.stdout) > 65536 or len(result.stderr) > 4096:
            emit(port=port, status="HOST_LISTENER_OWNERSHIP_UNKNOWN_NO_PROCESS_ACTION")
        else:
            emit(port=port, listener_present=bool(result.stdout.strip()), status="OWNERSHIP_NOT_ESTABLISHED_NO_ARGV_OR_SECRET_OUTPUT")
            pids = sorted(set(re.findall(r"pid=(\d+)", result.stdout)))
            if len(pids) > 4:
                emit(port=port, status="HOST_LISTENER_PID_CAP_UNKNOWN")
            else:
                for pid in pids:
                    inspect_listener_owner(pid)
    emit(status="READ_ONLY_HOST_INVENTORY_COMPLETE", entry_rows=total, unknown_preserve_gates=unknown, hashed_bytes=hashed, preserved_durable_root="~/.local/share/omp/image-annotator", host_process_stop_authorized=False)


def emit(**record):
    print(json.dumps(record, sort_keys=True))


def safe_parent_chain(path):
    for parent in reversed(path.parents):
        info = parent.lstat()
        if not stat.S_ISDIR(info.st_mode) or info.st_uid not in (0, os.getuid()):
            raise RuntimeError("unsafe fixed host parent; no link traversal or repair")


def metadata(path):
    info = path.lstat()
    return {"mode": oct(stat.S_IMODE(info.st_mode)), "uid": info.st_uid, "gid": info.st_gid, "size": info.st_size, "mtime_ns": info.st_mtime_ns, "regular": stat.S_ISREG(info.st_mode), "directory": stat.S_ISDIR(info.st_mode), "symlink": stat.S_ISLNK(info.st_mode)}


def collect_tokens(value, tokens):
    if isinstance(value, dict):
        for key, child in value.items():
            if key == "token" and isinstance(child, str) and len(child) >= 32:
                tokens.add(child.encode())
            elif isinstance(child, (dict, list)):
                collect_tokens(child, tokens)
    elif isinstance(value, list):
        for child in value:
            collect_tokens(child, tokens)


def inspect_listener_owner(pid):
    if not pid.isdigit() or len(pid) > 10 or int(pid) <= 1:
        emit(status="HOST_PID_UNKNOWN_NO_PROCESS_ACTION")
        return
    process = Path("/proc") / pid
    safe_parent_chain(process / "environ")
    info = process.lstat()
    if not stat.S_ISDIR(info.st_mode) or info.st_uid != os.getuid():
        emit(pid=int(pid), status="HOST_PROCESS_NOT_OWNED_NO_CONTENT_READ")
        return
    environment_path = process / "environ"
    env_info = environment_path.lstat()
    if not stat.S_ISREG(env_info.st_mode) or env_info.st_uid != os.getuid():
        emit(pid=int(pid), status="HOST_ENVIRONMENT_UNKNOWN_NO_READ")
        return
    with environment_path.open("rb") as handle:
        environment = handle.read(1048577)
    if len(environment) > 1048576:
        emit(pid=int(pid), status="HOST_ENVIRONMENT_CAP_UNKNOWN")
        return
    matching = [path for path in CONFIG_PATHS if b"OMP_IMAGE_ANNOTATOR_TABLET_CONFIG=" + path.encode() in environment.split(b"\0")]
    cwd_matches = os.readlink(process / "cwd") == SOURCE
    emit(pid=int(pid), uid=info.st_uid, source_cwd_match=cwd_matches, known_gateway_config_matches=sorted(matching), status="CANDIDATE_ONLY_NO_STOP_AUTHORITY")


if __name__ == "__main__":
    main()
