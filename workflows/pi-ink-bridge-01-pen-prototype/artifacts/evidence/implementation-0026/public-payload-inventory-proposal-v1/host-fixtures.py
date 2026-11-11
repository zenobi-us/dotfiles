import ast
import hashlib
import json
import os
import tempfile
from pathlib import Path
from unittest.mock import patch

source = (Path(__file__).parent / "inventory.py").read_text()
tree = ast.parse(source)
tree.body = [node for node in tree.body if not isinstance(node, ast.If)]
namespace = {"__name__": "fixture_loaded_without_main"}
exec(compile(tree, "inventory-definitions-only", "exec"), namespace)
run_inventory = namespace["inventory"]
production_root = namespace["ROOT"]
results = []


def exercise(name, mutate=None, root_mode=0o755, wrong_identity=False, expect_code=0, hook=None):
    with tempfile.TemporaryDirectory(prefix="pi-ink-public-payload-fixture-0026-") as temporary:
        workspace = Path(temporary)
        root = workspace / "payload"
        root.mkdir(mode=root_mode)
        content = {"owner.txt": b"fixture-owned-marker\n", "PiInkToolbar.qml": b"fixture qml\n",
                   "pi-ink-bridge.qmd": b"fixture qmd\n", "payload-sha256.txt": b"fixture manifest\n"}
        for leaf, data in content.items():
            (root / leaf).write_bytes(data)
        pins = {leaf: hashlib.sha256(data).hexdigest() for leaf, data in content.items()}
        context = {"root": root, "workspace": workspace, "pins": pins}
        if mutate:
            mutate(context)
        chosen_root = context.get("chosen_root", root)
        assert chosen_root != production_root
        identity = root.stat().st_dev, root.stat().st_ino + int(wrong_identity)
        opened = []
        reads = {}
        original_open, original_read, original_scandir = os.open, os.read, os.scandir
        scandir_count = 0

        def tracked_open(path, flags, *args, **kwargs):
            opened.append(os.fsdecode(path))
            return original_open(path, flags, *args, **kwargs)

        def tracked_read(descriptor, count):
            info = os.fstat(descriptor)
            if hook:
                hook(context, info)
            data = original_read(descriptor, count)
            reads[info.st_ino] = reads.get(info.st_ino, 0) + len(data)
            return data

        def tracked_scandir(*args, **kwargs):
            nonlocal scandir_count
            scandir_count += 1
            return original_scandir(*args, **kwargs)

        with patch.object(os, "open", tracked_open), patch.object(os, "read", tracked_read), patch.object(os, "scandir", tracked_scandir):
            rows, code = run_inventory(chosen_root, identity, os.getuid(), os.getgid(), pins)
        assert code == expect_code, (name, code, rows)
        result = {"case": name, "passed": True, "exit_code": code, "read_bytes": sum(reads.values())}
        if name == "four_known_public_files":
            assert rows[-1]["four_public_leaf_facts_complete"] and rows[-1]["known_public_pin_matches"] == 4
        elif name == "unknown_fifo_redacted_unopened":
            sentinel = context["unknown_name"]
            assert sentinel not in json.dumps(rows) and not any(sentinel in value for value in opened)
            assert rows[-1]["unknown_children_preserved_unopened"] == 1 and not rows[-1]["four_public_leaf_facts_complete"]
        elif name in ("known_symlink_unopened", "known_fifo_unopened"):
            assert not any(value == "PiInkToolbar.qml" for value in opened)
            assert rows[-1]["refused_or_mismatched_known_leaves"] == 1
        elif name == "exact_cap_accepted":
            assert reads[(root / "PiInkToolbar.qml").stat().st_ino] == 65536
            assert rows[-1]["four_public_leaf_facts_complete"]
        elif name in ("oversize_cap_plus_one_refused", "live_growth_cap_plus_one_refused"):
            assert reads[(root / "PiInkToolbar.qml").stat().st_ino] == 65537
            assert any(row.get("status") == "ACTUAL_READ_EXCEEDS_BYTE_CAP" for row in rows)
            result["capped_leaf_actual_read_bytes"] = 65537
        elif name == "owner_marker_mismatch_stops_before_listing":
            assert scandir_count == 0 and rows[-1]["status"] == "KNOWN_OWNER_MARKER_HASH_MISMATCH_PRESERVE"
        elif name in ("root0700_refused", "wrong_root_inode_refused", "parent_symlink_refused"):
            assert not reads
        elif name in ("entry_count_cap_refused", "entry_name_bytes_cap_refused"):
            assert rows[-1]["status"] == "DIRECT_ENTRY_COUNT_OR_NAME_BYTE_CAP_REFUSED"
        assert not rows[-1].get("deletion_authorized", False)
        results.append(result)


def unknown_fifo(context):
    context["unknown_name"] = "unexamined-private-name-never-printed"
    os.mkfifo(context["root"] / context["unknown_name"])


def symlink_leaf(context):
    target = context["workspace"] / "outside-fixture-leaf"
    target.write_bytes(b"fixture-only outside value must never be read")
    (context["root"] / "PiInkToolbar.qml").unlink()
    (context["root"] / "PiInkToolbar.qml").symlink_to(target)


def fifo_leaf(context):
    (context["root"] / "PiInkToolbar.qml").unlink()
    os.mkfifo(context["root"] / "PiInkToolbar.qml")


def sized_leaf(context, size, update_pin):
    data = b"x" * size
    (context["root"] / "PiInkToolbar.qml").write_bytes(data)
    if update_pin:
        context["pins"]["PiInkToolbar.qml"] = hashlib.sha256(data).hexdigest()
    context["qml_inode"] = (context["root"] / "PiInkToolbar.qml").stat().st_ino


def grow_on_first_read(context, info):
    if info.st_ino == context.get("qml_inode") and not context.get("grown"):
        with (context["root"] / "PiInkToolbar.qml").open("ab") as stream:
            stream.write(b"g" * 100)
        context["grown"] = True


def parent_symlink(context):
    alias = context["workspace"] / "alias"
    alias.symlink_to(context["root"], target_is_directory=True)
    context["chosen_root"] = alias


def count_overflow(context):
    for index in range(13):
        (context["root"] / ("unknown-" + str(index))).touch()


def name_byte_overflow(context):
    for index in range(5):
        (context["root"] / (str(index) + "x" * 249)).touch()


exercise("four_known_public_files")
exercise("unknown_fifo_redacted_unopened", unknown_fifo)
exercise("known_symlink_unopened", symlink_leaf)
exercise("known_fifo_unopened", fifo_leaf)
exercise("exact_cap_accepted", lambda context: sized_leaf(context, 65536, True))
exercise("oversize_cap_plus_one_refused", lambda context: sized_leaf(context, 65537, False))
exercise("live_growth_cap_plus_one_refused", lambda context: sized_leaf(context, 65536, True), hook=grow_on_first_read)
exercise("owner_marker_mismatch_stops_before_listing", lambda context: (context["root"] / "owner.txt").write_bytes(b"different fixture marker"), expect_code=1)
exercise("root0700_refused", root_mode=0o700, expect_code=1)
exercise("wrong_root_inode_refused", wrong_identity=True, expect_code=1)
exercise("parent_symlink_refused", parent_symlink, expect_code=1)
exercise("entry_count_cap_refused", count_overflow, expect_code=1)
exercise("entry_name_bytes_cap_refused", name_byte_overflow, expect_code=1)
print(json.dumps({"fixtures": results, "production_root_read": False, "device_network_process_or_deletion_action": False}, indent=2))
