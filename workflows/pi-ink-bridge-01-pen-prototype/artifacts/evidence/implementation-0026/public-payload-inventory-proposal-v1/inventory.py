import hashlib
import json
import os
import stat
import sys
from pathlib import Path

class BoundedReadError(RuntimeError):
    pass


def file_stamp(info):
    return (info.st_dev, info.st_ino, info.st_uid, info.st_gid, stat.S_IFMT(info.st_mode), stat.S_IMODE(info.st_mode), info.st_size, info.st_mtime_ns, info.st_ctime_ns)


def read_owned_regular(path, cap, expected_identity=None):
    """Read at most cap+1 bytes through verified no-follow directory/file fds.

    Refuse nonregular/unowned files, replacement, growth, or a changed path.
    Error messages contain only fixed reasons, never file bytes or secret values.
    """
    path = Path(path)
    if not path.is_absolute() or ".." in path.parts or not 0 < cap <= 10485760:
        raise BoundedReadError("FIXED_PATH_OR_CAP_INVALID")
    directories = []
    links = []
    descriptor = None
    directory_flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_CLOEXEC
    try:
        parent_fd = os.open("/", directory_flags)
        directories.append(parent_fd)
        for component in path.parts[1:-1]:
            child_fd = os.open(component, directory_flags, dir_fd=parent_fd)
            directories.append(child_fd)
            info = os.fstat(child_fd)
            if not stat.S_ISDIR(info.st_mode) or info.st_uid not in (0, os.getuid()):
                raise BoundedReadError("PARENT_DIRECTORY_OWNER_REFUSED")
            links.append((parent_fd, component, child_fd))
            parent_fd = child_fd
        before_path = os.stat(path.name, dir_fd=parent_fd, follow_symlinks=False)
        if not stat.S_ISREG(before_path.st_mode) or before_path.st_uid != os.getuid():
            raise BoundedReadError("REGULAR_OWNED_FILE_REQUIRED")
        if expected_identity is not None and (before_path.st_dev, before_path.st_ino) != expected_identity:
            raise BoundedReadError("EXPECTED_FILE_IDENTITY_CHANGED")
        # Nonblocking open also prevents a replaced FIFO from blocking before fstat.
        descriptor = os.open(path.name, os.O_RDONLY | os.O_NOFOLLOW | os.O_CLOEXEC | os.O_NONBLOCK, dir_fd=parent_fd)
        before_fd = os.fstat(descriptor)
        if not stat.S_ISREG(before_fd.st_mode) or before_fd.st_uid != os.getuid() or file_stamp(before_fd) != file_stamp(before_path):
            raise BoundedReadError("OPENED_FILE_IDENTITY_OR_OWNER_CHANGED")
        remaining = cap + 1
        chunks = []
        while remaining:
            chunk = os.read(descriptor, min(65536, remaining))
            if not chunk:
                break
            chunks.append(chunk)
            remaining -= len(chunk)
        if remaining == 0:
            raise BoundedReadError("ACTUAL_READ_EXCEEDS_BYTE_CAP")
        after_fd = os.fstat(descriptor)
        after_path = os.stat(path.name, dir_fd=parent_fd, follow_symlinks=False)
        if file_stamp(after_fd) != file_stamp(before_fd) or file_stamp(after_path) != file_stamp(after_fd):
            raise BoundedReadError("FILE_CHANGED_DURING_BOUNDED_READ")
        for ancestor_fd, name, opened_fd in links:
            current = os.stat(name, dir_fd=ancestor_fd, follow_symlinks=False)
            opened = os.fstat(opened_fd)
            if not stat.S_ISDIR(current.st_mode) or current.st_uid not in (0, os.getuid()) or (current.st_dev, current.st_ino) != (opened.st_dev, opened.st_ino):
                raise BoundedReadError("PARENT_PATH_CHANGED_DURING_READ")
        return b"".join(chunks)
    except OSError:
        raise BoundedReadError("NOFOLLOW_OR_IDENTITY_READ_REFUSED") from None
    finally:
        if descriptor is not None:
            os.close(descriptor)
        for directory_fd in reversed(directories):
            os.close(directory_fd)



ROOT = Path("/tmp/pi-ink-ui-validation-0023/payload")
ROOT_IDENTITY = (55, 24900)
OWNER_UID = 1000
OWNER_GID = 1000
MAX_ENTRIES = 16
MAX_NAME_BYTES = 1024
CAPS = {"owner.txt": 4096, "PiInkToolbar.qml": 65536, "pi-ink-bridge.qmd": 65536, "payload-sha256.txt": 4096}
PUBLIC_PINS = {'owner.txt': 'a9eecd4c06a5fa0ec38a0935ad97fd29654f7b8b828493b2ca96ffe1116cbf8d', 'payload-sha256.txt': '9ce7ecaa8bd9607e938ea75ea7cae957728e6592a7d2bdb4b329f06e0939a57c', 'pi-ink-bridge.qmd': '0dc1dad15002559d943f63fb73298aca68c570a9f46cefe38bb42c5798e8edc0', 'PiInkToolbar.qml': 'c09f7f617760b4dc839787d228a2ab2bf12ba26f1f52a6ec910124072b8db869'}


def metadata(info):
    return {"device": info.st_dev, "inode": info.st_ino, "uid": info.st_uid, "gid": info.st_gid,
            "mode": oct(stat.S_IMODE(info.st_mode)), "size": info.st_size,
            "mtime_ns": info.st_mtime_ns, "ctime_ns": info.st_ctime_ns}


def inventory(root, expected_identity, uid, gid, pins):
    records = []
    descriptors = []
    links = []
    leaf_stamps = {}
    try:
        flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_CLOEXEC
        parent_fd = os.open("/", flags)
        descriptors.append(parent_fd)
        for component in root.parts[1:]:
            descriptor = os.open(component, flags, dir_fd=parent_fd)
            descriptors.append(descriptor)
            info = os.fstat(descriptor)
            if not stat.S_ISDIR(info.st_mode) or info.st_uid not in (0, uid):
                raise BoundedReadError("PARENT_OWNER_OR_TYPE_REFUSED")
            links.append((parent_fd, component, descriptor))
            parent_fd = descriptor
        root_fd = descriptors[-1]
        root_info = os.fstat(root_fd)
        if (root_info.st_dev, root_info.st_ino) != expected_identity or root_info.st_uid != uid or root_info.st_gid != gid or stat.S_IMODE(root_info.st_mode) != 0o755:
            raise BoundedReadError("ROOT0755_OWNER_OR_IDENTITY_REFUSED")
        root_stamp = file_stamp(root_info)
        records.append({"path": str(root), "status": "FIXED0755_ROOT_METADATA", **metadata(root_info)})

        def root_unchanged():
            if file_stamp(os.fstat(root_fd)) != root_stamp:
                raise BoundedReadError("ROOT_CHANGED_DURING_INVENTORY")
            for ancestor, name, opened in links:
                current = os.stat(name, dir_fd=ancestor, follow_symlinks=False)
                held = os.fstat(opened)
                if not stat.S_ISDIR(current.st_mode) or current.st_uid not in (0, uid) or (current.st_dev, current.st_ino) != (held.st_dev, held.st_ino):
                    raise BoundedReadError("PARENT_PATH_CHANGED_DURING_INVENTORY")

        def leaf_record(name):
            root_unchanged()
            before = os.stat(name, dir_fd=root_fd, follow_symlinks=False)
            if not stat.S_ISREG(before.st_mode) or before.st_uid != uid or before.st_gid != gid:
                raise BoundedReadError("KNOWN_LEAF_UNSAFE_PRESERVED_UNOPENED")
            content = read_owned_regular(root / name, CAPS[name], (before.st_dev, before.st_ino))
            after = os.stat(name, dir_fd=root_fd, follow_symlinks=False)
            if file_stamp(before) != file_stamp(after):
                raise BoundedReadError("KNOWN_LEAF_CHANGED_DURING_READ")
            root_unchanged()
            digest = hashlib.sha256(content).hexdigest()
            leaf_stamps[name] = file_stamp(after)
            return {"path": str(root / name), "status": "KNOWN_PUBLIC_LEAF_METADATA_DIGEST",
                    **metadata(after), "sha256": digest, "known_public_pin_match": digest == pins[name]}

        owner = leaf_record("owner.txt")
        records.append(owner)
        if not owner["known_public_pin_match"]:
            raise BoundedReadError("KNOWN_OWNER_MARKER_HASH_MISMATCH_PRESERVE")
        seen = set()
        rows = 0
        name_bytes = 0
        unknown = 0
        with os.scandir(root_fd) as entries:
            for entry in entries:
                rows += 1
                encoded = os.fsencode(entry.name)
                name_bytes += len(encoded)
                if rows > MAX_ENTRIES or name_bytes > MAX_NAME_BYTES:
                    raise BoundedReadError("DIRECT_ENTRY_COUNT_OR_NAME_BYTE_CAP_REFUSED")
                if entry.name in CAPS:
                    seen.add(entry.name)
                else:
                    unknown += 1
                    records.append({"unknown_entry_name_sha256": hashlib.sha256(encoded).hexdigest(),
                                    "status": "UNKNOWN_CHILD_REDACTED_PRESERVED_UNOPENED"})
        matches = 1
        refused = 0
        for name in ("PiInkToolbar.qml", "pi-ink-bridge.qmd", "payload-sha256.txt"):
            if name not in seen:
                records.append({"path": str(root / name), "status": "KNOWN_LEAF_MISSING_PRESERVED"})
                refused += 1
                continue
            try:
                row = leaf_record(name)
                records.append(row)
                matches += int(row["known_public_pin_match"])
                refused += int(not row["known_public_pin_match"])
            except (BoundedReadError, OSError) as error:
                reason = str(error) if isinstance(error, BoundedReadError) else "NOFOLLOW_OR_METADATA_REFUSED"
                records.append({"path": str(root / name), "status": reason})
                refused += 1
        for name, stamp in leaf_stamps.items():
            if file_stamp(os.stat(name, dir_fd=root_fd, follow_symlinks=False)) != stamp:
                raise BoundedReadError("KNOWN_LEAF_CHANGED_BEFORE_INVENTORY_COMPLETE")
        root_unchanged()
        records.append({"status": "PUBLIC_PAYLOAD_HOST_INVENTORY_COMPLETE", "entry_rows": rows,
                        "entry_name_bytes": name_bytes, "known_public_pin_matches": matches,
                        "unknown_children_preserved_unopened": unknown, "refused_or_mismatched_known_leaves": refused,
                        "four_public_leaf_facts_complete": matches == 4 and refused == 0 and unknown == 0 and seen == set(CAPS),
                        "deletion_authorized": False, "global_cleanup_complete": False})
        return records, 0
    except (BoundedReadError, OSError) as error:
        reason = str(error) if isinstance(error, BoundedReadError) else "NOFOLLOW_OR_METADATA_REFUSED"
        records.append({"status": reason, "inventory_complete": False, "all_files_preserved": True, "deletion_authorized": False})
        return records, 1
    finally:
        for descriptor in reversed(descriptors):
            os.close(descriptor)


def main():
    if len(sys.argv) != 1 or os.environ.get("PI_INK_PUBLIC_PAYLOAD_INVENTORY_APPROVED") != "public-payload-0026-v1":
        print(json.dumps({"status": "ABORT_NEW_EXACT_PUBLIC_PAYLOAD_SCOPE_APPROVAL_REQUIRED"}))
        return 2
    if os.getuid() != OWNER_UID or os.geteuid() != OWNER_UID:
        print(json.dumps({"status": "ABORT_FIXED_HOST_OWNER_REQUIRED"}))
        return 2
    records, code = inventory(ROOT, ROOT_IDENTITY, OWNER_UID, OWNER_GID, PUBLIC_PINS)
    for row in records:
        print(json.dumps(row, sort_keys=True))
    return code


if __name__ == "__main__":
    sys.exit(main())
