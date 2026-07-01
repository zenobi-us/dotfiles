#!/usr/bin/env python3
"""Drain queued snapshot events and publish real commits.

This worker runs once per worktree or git dir. It reads pending events from the
SQLite queue, replays them onto the current branch tip with a temporary git
index, then publishes the result with ``git update-ref`` compare-and-swap.
When the queue stays idle long enough, it exits.

Crash safety is two-phase. Before moving the branch, the worker marks each
prepared event as ``publishing`` and stores its target commit OID. On startup,
any leftover ``publishing`` rows are reconciled by checking whether that target
commit already landed in branch history.

Replay is batched on purpose. The worker keeps index state in memory, reads the
index with one ``git ls-files -s -z`` call, applies each event with one
``git update-index -z --index-info`` call, and fetches blob contents for diffs
through ``git cat-file --batch``.

Built-in AI commit messages are also batched now. When AI is enabled and the
backlog is within ``SNAPSHOTD_AI_MAX_QUEUE_DEPTH``, the worker generates and
stores messages in chunks before the commit loop. If AI is off, skipped, or a
chunk fails, it falls back to ``SNAPSHOTD_COMMIT_MESSAGE_CMD`` if configured,
otherwise deterministic commit messages, for the affected events.

Contract note: pending rows are keyed by branch name, but safe replay depends on
branch generation as well. ``events.base_head`` is the capture-time ancestry
anchor, and later implementation also needs an explicit branch-incarnation
signal to make
delete-and-recreate detection trustworthy. Best-effort applies only to
incomplete payload surfaces. Unsupported same-branch multi-worktree topologies
or stale generations must be quarantined instead of replayed optimistically.
Pre-enqueue detection should reject early; once a row exists, the worker should
settle unsupported topology as ``blocked_conflict``. These notes describe the
target contract for future work; the current worker still needs explicit
generation and topology enforcement.
"""

from __future__ import annotations

import argparse
import difflib
import errno
import fcntl
import json
import os
import re
import shlex
import signal
import sqlite3
import subprocess
import sys
import textwrap
import time
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple
from urllib import error as urllib_error
from urllib import request as urllib_request

from snapshot_shared import (
    IncompatibleLocalStateError,
    LOCAL_STATE_SCHEMA_VERSION,
    ensure_branch_registry,
    quarantine_incompatible_local_state,
    resolve_repo_paths,
)


STATE_SUBDIR = "ai-snapshotd"
DB_SUBPATH = f"{STATE_SUBDIR}/snapshotd.db"
LOCK_SUBPATH = f"{STATE_SUBDIR}/worker.lock"
INDEX_SUBPATH = f"{STATE_SUBDIR}/worker.index"
LOG_SUBPATH = f"{STATE_SUBDIR}/logs/worker.log"

QUIET_SECONDS = float(os.environ.get("SNAPSHOTD_QUIET_SECONDS", "1.0"))
IDLE_SECONDS = float(os.environ.get("SNAPSHOTD_IDLE_SECONDS", "30.0"))
POLL_SECONDS = float(os.environ.get("SNAPSHOTD_POLL_SECONDS", "0.35"))
AI_MAX_QUEUE_DEPTH = int(os.environ.get("SNAPSHOTD_AI_MAX_QUEUE_DEPTH", "2"))
AI_CHUNK_SIZE = max(1, min(100, int(os.environ.get("SNAPSHOTD_AI_CHUNK_SIZE", "20"))))
RETENTION_SECONDS = float(os.environ.get("SNAPSHOTD_RETENTION_SECONDS", str(7 * 86400)))
LOG_MAX_BYTES = int(os.environ.get("SNAPSHOTD_LOG_MAX_BYTES", str(2 * 1024 * 1024)))
LOG_KEEP = int(os.environ.get("SNAPSHOTD_LOG_KEEP", "3"))
RECONCILE_RETRY_ATTEMPTS = max(
    1, int(os.environ.get("SNAPSHOTD_RECONCILE_RETRY_ATTEMPTS", "3"))
)
RECONCILE_RETRY_SLEEP = float(os.environ.get("SNAPSHOTD_RECONCILE_RETRY_SLEEP", "0.2"))
RECONCILE_ABSENT = ("__snapshot_absent__", "__snapshot_absent__")

DEBUG = os.environ.get("SNAPSHOTD_DEBUG", "").lower() not in {"", "0", "false", "no"}

COMMIT_CMD = os.environ.get("SNAPSHOTD_COMMIT_MESSAGE_CMD", "").strip()
AI_ENABLE = os.environ.get("SNAPSHOTD_AI_ENABLE", "").lower() in {"1", "true", "yes"}
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-5.4-mini")
OPENAI_API_TIMEOUT = float(os.environ.get("OPENAI_API_TIMEOUT", "15"))

SENSITIVE_PATTERNS = tuple(
    p.strip()
    for p in os.environ.get(
        "SNAPSHOTD_SENSITIVE_GLOBS",
        ".env,.env.*,**/.env,**/.env.*,**/id_rsa*,**/*.pem,**/*.key,**/*.p12,**/*.pfx,**/secrets/*,**/credentials*",
    ).split(",")
    if p.strip()
)

AI_SYSTEM_PROMPT = (
    "You are a git commit message generator.\n"
    "Line 1: imperative subject, max 50 chars, no trailing period.\n"
    "Blank line, then body bullets starting with '- ', wrapped at 72 chars.\n"
    "Describe WHAT changed and WHY. No questions, no preamble.\n"
    "Output only the commit message."
)

BATCH_SYSTEM_PROMPT = (
    "You are a git commit message generator for a batch of snapshot events.\n"
    "Input: one JSON payload listing events with seq, tool, paths, and diffs.\n"
    "Output: a JSON object matching the provided schema with a 'messages'\n"
    "array. Produce one item per input event, preserving its seq verbatim.\n"
    "For each item:\n"
    "- 'subject': imperative, max 50 chars, no trailing period.\n"
    "- 'body': bullet list ('- ' prefix) describing WHAT changed and WHY,\n"
    "  wrapped at 72 chars. One line per bullet. No preamble, no questions.\n"
    "Do not emit any text outside the JSON object."
)

BATCH_RESPONSE_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": ["messages"],
    "properties": {
        "messages": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["seq", "subject", "body"],
                "properties": {
                    "seq": {"type": "integer"},
                    "subject": {"type": "string"},
                    "body": {"type": "string"},
                },
            },
        },
    },
}

_LOG_PATH: Optional[Path] = None


def _rotate_log(path: Path) -> None:
    try:
        if path.stat().st_size < LOG_MAX_BYTES:
            return
    except OSError:
        return
    try:
        for i in range(LOG_KEEP, 0, -1):
            src = path.with_suffix(path.suffix + f".{i}")
            dst = path.with_suffix(path.suffix + f".{i + 1}")
            if src.exists():
                if i == LOG_KEEP:
                    src.unlink(missing_ok=True)
                else:
                    src.replace(dst)
        path.replace(path.with_suffix(path.suffix + ".1"))
    except OSError:
        pass


def debug(message: str) -> None:
    if not DEBUG or _LOG_PATH is None:
        return
    try:
        _LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        _rotate_log(_LOG_PATH)
        with _LOG_PATH.open("a", encoding="utf-8") as fh:
            fh.write(f"[{time.strftime('%H:%M:%S')}] pid={os.getpid()} {message}\n")
    except Exception:
        pass


# --------------------------------------------------------------------------- #
# Signals / singleton lock
# --------------------------------------------------------------------------- #


_wake_flag = False


def _on_wake(signum, frame) -> None:  # noqa: ARG001
    global _wake_flag
    _wake_flag = True


def consume_wake() -> bool:
    global _wake_flag
    if _wake_flag:
        _wake_flag = False
        return True
    return False


def interruptible_sleep(seconds: float) -> None:
    deadline = time.time() + seconds
    while True:
        if _wake_flag:
            return
        remaining = deadline - time.time()
        if remaining <= 0:
            return
        time.sleep(min(0.1, remaining))


class Singleton:
    def __init__(self, lock_path: Path) -> None:
        self.lock_path = lock_path
        self._fh: Optional[Any] = None

    def acquire(self, attempts: int = 10, sleep: float = 0.05) -> bool:
        self.lock_path.parent.mkdir(parents=True, exist_ok=True)
        self._fh = self.lock_path.open("a+")
        for _ in range(max(1, attempts)):
            try:
                fcntl.flock(self._fh.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                return True
            except OSError as exc:
                if exc.errno not in {errno.EAGAIN, errno.EACCES, errno.EWOULDBLOCK}:
                    raise
                time.sleep(sleep)
        self._fh.close()
        self._fh = None
        return False

    def release(self) -> None:
        if self._fh is None:
            return
        try:
            fcntl.flock(self._fh.fileno(), fcntl.LOCK_UN)
        finally:
            self._fh.close()
            self._fh = None


# --------------------------------------------------------------------------- #
# Git helpers
# --------------------------------------------------------------------------- #


def run_git(
    repo_root: Path,
    *args: str,
    input_bytes: Optional[bytes] = None,
    env: Optional[Dict[str, str]] = None,
) -> str:
    proc = subprocess.run(
        ["git", *args],
        cwd=str(repo_root),
        input=input_bytes,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            proc.stderr.decode("utf-8", errors="replace").strip()
            or f"git {' '.join(args)} failed"
        )
    return proc.stdout.decode("utf-8", errors="replace").rstrip("\n")


def maybe_git(
    repo_root: Path,
    *args: str,
    env: Optional[Dict[str, str]] = None,
    input_bytes: Optional[bytes] = None,
) -> Tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=str(repo_root),
        input=input_bytes,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
    )
    return (
        proc.returncode,
        proc.stdout.decode("utf-8", errors="replace").rstrip("\n"),
        proc.stderr.decode("utf-8", errors="replace").rstrip("\n"),
    )


def current_branch(repo_root: Path) -> Optional[str]:
    code, out, _ = maybe_git(repo_root, "symbolic-ref", "-q", "HEAD")
    if code != 0:
        return None
    return out.strip() or None


def current_head(repo_root: Path) -> Optional[str]:
    code, out, _ = maybe_git(repo_root, "rev-parse", "HEAD")
    if code != 0:
        return None
    return out.strip() or None


def ref_exists(repo_root: Path, ref: str) -> bool:
    code, _out, _err = maybe_git(repo_root, "rev-parse", "--verify", "--quiet", ref)
    return code == 0


def ref_head(repo_root: Path, ref: str) -> Optional[str]:
    code, out, _err = maybe_git(repo_root, "rev-parse", ref)
    if code != 0:
        return None
    return out.strip() or None


def repo_special_state(git_dir: Path) -> Optional[str]:
    markers = {
        "MERGE_HEAD": "merge",
        "rebase-apply": "rebase",
        "rebase-merge": "rebase",
        "CHERRY_PICK_HEAD": "cherry-pick",
        "REVERT_HEAD": "revert",
        "BISECT_LOG": "bisect",
    }
    for name, label in markers.items():
        if (git_dir / name).exists():
            return label
    return None


def is_ancestor(repo_root: Path, commit: str, descendant: str) -> bool:
    code, _out, _err = maybe_git(
        repo_root, "merge-base", "--is-ancestor", commit, descendant
    )
    return code == 0


def read_index_state(
    repo_root: Path, env: Dict[str, str]
) -> Dict[str, Tuple[str, str]]:
    """Return {path: (mode, oid)} from a git index. NUL-safe."""
    proc = subprocess.run(
        ["git", "ls-files", "-s", "-z"],
        cwd=str(repo_root),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
    )
    out: Dict[str, Tuple[str, str]] = {}
    if proc.returncode != 0:
        return out
    for chunk in proc.stdout.split(b"\x00"):
        if not chunk:
            continue
        try:
            meta_bytes, _tab, path_bytes = chunk.partition(b"\t")
            path = path_bytes.decode("utf-8", errors="replace")
            parts = meta_bytes.split()
            if len(parts) < 2:
                continue
            mode = parts[0].decode()
            oid = parts[1].decode()
            out[path] = (mode, oid)
        except Exception:  # noqa: BLE001
            continue
    return out


def apply_ops_to_index(
    repo_root: Path,
    env: Dict[str, str],
    ops: List[Dict[str, Any]],
) -> None:
    """Apply all ops for one event in a single `update-index --index-info`."""
    chunks: List[bytes] = []
    zero_oid = "0" * 40

    def add_line(mode: str, oid: str, path: str) -> None:
        chunks.append(f"{mode} {oid}\t{path}".encode("utf-8"))

    for op in ops:
        kind = op["op"]
        if kind in {"create", "modify"}:
            add_line(op["after_mode"], op["after_oid"], op["path"])
        elif kind == "delete":
            add_line("0", zero_oid, op["path"])
        elif kind == "rename":
            old_path = op.get("old_path")
            if old_path:
                add_line("0", zero_oid, old_path)
            add_line(op["after_mode"], op["after_oid"], op["path"])
    if not chunks:
        return
    payload = b"\x00".join(chunks) + b"\x00"
    code, _out, err = maybe_git(
        repo_root,
        "update-index",
        "-z",
        "--index-info",
        env=env,
        input_bytes=payload,
    )
    if code != 0:
        raise RuntimeError(f"update-index --index-info failed: {err}")


def reconcile_live_index(
    conn: sqlite3.Connection,
    branch: str,
    branch_generation: int,
    repo_root: Path,
    pre_publish_head_entries: Dict[str, Tuple[str, str]],
    post_publish_head_entries: Dict[str, Tuple[str, str]],
    paths: List[str],
) -> bool:
    """Reset only paths whose live index still looks hook-owned.

    Safe cases:
    - the live index still matches the pre-publish HEAD entry, so reset can move
      it to the new HEAD entry.
    - the live index already matches the post-publish HEAD entry, so cleanup is
      already effectively done and we can clear the pending row.

    If the live index is transiently locked, leave the paths queued for retry.
    If the user staged something else meanwhile, skip that path permanently.
    """
    if not paths:
        return True

    live_env = os.environ.copy()
    live_env.pop("GIT_INDEX_FILE", None)
    unique = sorted(set(paths))

    for attempt in range(RECONCILE_RETRY_ATTEMPTS):
        code, out, err = maybe_git(
            repo_root, "ls-files", "-s", "-z", "--", *unique, env=live_env
        )
        if code != 0:
            if "index.lock" in err:
                debug(
                    f"reconcile: live ls-files blocked by index.lock "
                    f"(attempt {attempt + 1}/{RECONCILE_RETRY_ATTEMPTS})"
                )
                if attempt + 1 < RECONCILE_RETRY_ATTEMPTS:
                    time.sleep(RECONCILE_RETRY_SLEEP * (attempt + 1))
                    continue
                return False
            debug(f"reconcile: live ls-files failed: {err}")
            return False

        live: Dict[str, Tuple[str, str]] = {}
        for chunk in out.encode("utf-8", errors="replace").split(b"\x00"):
            if not chunk:
                continue
            meta_bytes, _tab, path_bytes = chunk.partition(b"\t")
            path = path_bytes.decode("utf-8", errors="replace")
            parts = meta_bytes.split()
            if len(parts) < 2:
                continue
            live[path] = (parts[0].decode(), parts[1].decode())

        safe_paths: List[str] = []
        completed_paths: List[str] = []
        for path in unique:
            pre = pre_publish_head_entries.get(path)
            post = post_publish_head_entries.get(path)
            here = live.get(path)
            if post == RECONCILE_ABSENT and here is None:
                completed_paths.append(path)
                continue
            if here == post:
                completed_paths.append(path)
                continue
            if pre == RECONCILE_ABSENT and here is None:
                safe_paths.append(path)
                continue
            if pre == here:
                safe_paths.append(path)
                continue
            if pre == RECONCILE_ABSENT and here is not None:
                debug(f"reconcile: skip {path} (newly staged after publish)")
                completed_paths.append(path)
                continue
            if pre not in {None, RECONCILE_ABSENT} and here is None:
                debug(f"reconcile: skip {path} (index entry disappeared)")
                completed_paths.append(path)
                continue
            debug(
                f"reconcile: skip {path} (staged diverges from pre/post publish state)"
            )
            completed_paths.append(path)

        if not safe_paths:
            if completed_paths:
                conn.execute("BEGIN IMMEDIATE")
                try:
                    clear_reconcile_paths(
                        conn, branch, branch_generation, completed_paths
                    )
                    conn.execute("COMMIT")
                except Exception:
                    try:
                        conn.execute("ROLLBACK")
                    except sqlite3.OperationalError:
                        pass
                    raise
            return True

        code, _out, err = maybe_git(repo_root, "reset", "-q", "--", *safe_paths)
        if code != 0:
            if "index.lock" in err:
                debug(
                    f"reconcile reset deferred due to index.lock "
                    f"(attempt {attempt + 1}/{RECONCILE_RETRY_ATTEMPTS})"
                )
                if attempt + 1 < RECONCILE_RETRY_ATTEMPTS:
                    time.sleep(RECONCILE_RETRY_SLEEP * (attempt + 1))
                    continue
                return False
            debug(f"reconcile reset failed: {err}")
            return False

        conn.execute("BEGIN IMMEDIATE")
        try:
            clear_reconcile_paths(
                conn, branch, branch_generation, [*completed_paths, *safe_paths]
            )
            conn.execute("COMMIT")
        except Exception:
            try:
                conn.execute("ROLLBACK")
            except sqlite3.OperationalError:
                pass
            raise
        return True

    return False


def retry_deferred_reconcile(
    conn: sqlite3.Connection, repo_root: Path, branch: str, branch_generation: int
) -> bool:
    rows = fetch_reconcile_pending(conn, branch, branch_generation)
    if not rows:
        return True
    pre_publish_head_entries: Dict[str, Tuple[str, str]] = {}
    post_publish_head_entries: Dict[str, Tuple[str, str]] = {}
    for row in rows:
        if (
            row["pre_mode"] == RECONCILE_ABSENT[0]
            and row["pre_oid"] == RECONCILE_ABSENT[1]
        ):
            pre_publish_head_entries[row["path"]] = RECONCILE_ABSENT
        elif row["pre_mode"] is not None and row["pre_oid"] is not None:
            pre_publish_head_entries[row["path"]] = (row["pre_mode"], row["pre_oid"])
        if (
            row["post_mode"] == RECONCILE_ABSENT[0]
            and row["post_oid"] == RECONCILE_ABSENT[1]
        ):
            post_publish_head_entries[row["path"]] = RECONCILE_ABSENT
        elif row["post_mode"] is not None and row["post_oid"] is not None:
            post_publish_head_entries[row["path"]] = (
                row["post_mode"],
                row["post_oid"],
            )
    paths = [row["path"] for row in rows]
    ok = reconcile_live_index(
        conn,
        branch,
        branch_generation,
        repo_root,
        pre_publish_head_entries,
        post_publish_head_entries,
        paths,
    )
    if not ok:
        debug(f"reconcile: deferred cleanup still pending for {len(paths)} path(s)")
    return ok


# --------------------------------------------------------------------------- #
# DB helpers
# --------------------------------------------------------------------------- #


def _open_db_once(git_dir: Path) -> sqlite3.Connection:
    db_path = git_dir / DB_SUBPATH
    if not db_path.exists():
        raise RuntimeError(f"no snapshot database at {db_path}")
    conn = sqlite3.connect(str(db_path), timeout=10.0, isolation_level=None)
    try:
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        conn.execute("PRAGMA busy_timeout=5000")
        conn.execute("PRAGMA foreign_keys=ON")
        version = int(conn.execute("PRAGMA user_version").fetchone()[0])
        if version not in (0, LOCAL_STATE_SCHEMA_VERSION):
            raise IncompatibleLocalStateError(
                f"incompatible snapshot DB user_version={version}; expected {LOCAL_STATE_SCHEMA_VERSION}"
            )
        conn.execute(
            """CREATE TABLE IF NOT EXISTS reconcile_pending (
                   branch_ref  TEXT NOT NULL,
                   branch_generation INTEGER NOT NULL,
                   path        TEXT NOT NULL,
                   pre_mode    TEXT,
                   pre_oid     TEXT,
                   post_mode   TEXT,
                   post_oid    TEXT,
                   created_ts  REAL NOT NULL,
                   PRIMARY KEY (branch_ref, branch_generation, path)
               )"""
        )
        pending_existing = {
            row[1] for row in conn.execute("PRAGMA table_info(reconcile_pending)")
        }
        if "post_mode" not in pending_existing:
            try:
                conn.execute("ALTER TABLE reconcile_pending ADD COLUMN post_mode TEXT")
            except sqlite3.OperationalError:
                pass
        if "post_oid" not in pending_existing:
            try:
                conn.execute("ALTER TABLE reconcile_pending ADD COLUMN post_oid TEXT")
            except sqlite3.OperationalError:
                pass
        if "branch_generation" not in pending_existing:
            raise IncompatibleLocalStateError(
                "legacy snapshot DB missing reconcile_pending.branch_generation"
            )
        existing = {row[1] for row in conn.execute("PRAGMA table_info(events)")}
        if "branch_generation" not in existing:
            raise IncompatibleLocalStateError(
                "legacy snapshot DB missing events.branch_generation"
            )
        if "target_commit_oid" not in existing:
            try:
                conn.execute("ALTER TABLE events ADD COLUMN target_commit_oid TEXT")
            except sqlite3.OperationalError:
                pass
        if "message" not in existing:
            try:
                conn.execute("ALTER TABLE events ADD COLUMN message TEXT")
            except sqlite3.OperationalError:
                pass
        path_tail_existing = {
            row[1] for row in conn.execute("PRAGMA table_info(path_tail)")
        }
        if "branch_generation" not in path_tail_existing:
            raise IncompatibleLocalStateError(
                "legacy snapshot DB missing path_tail.branch_generation"
            )
        conn.execute(f"PRAGMA user_version={LOCAL_STATE_SCHEMA_VERSION}")
        return conn
    except Exception:
        conn.close()
        raise


def open_db(git_dir: Path, allow_reset: bool = False) -> sqlite3.Connection:
    last_exc: Optional[Exception] = None
    for _attempt in range(2):
        try:
            return _open_db_once(git_dir)
        except IncompatibleLocalStateError as exc:
            if not allow_reset:
                raise
            last_exc = exc
            quarantined = quarantine_incompatible_local_state(git_dir, str(exc))
            if quarantined is None:
                debug("incompatible snapshot state disappeared before reset; retrying")
            else:
                debug(f"quarantined incompatible snapshot state at {quarantined}")
    if last_exc is not None:
        raise last_exc
    raise RuntimeError("failed to open snapshot database")


def ensure_db_ready(git_dir: Path) -> None:
    conn = open_db(git_dir, allow_reset=True)
    conn.close()


def fetch_pending(conn: sqlite3.Connection, branch: str) -> List[sqlite3.Row]:
    """Return pending rows for one symbolic branch ref.

    ``base_head`` is intentionally loaded with each event because branch name
    alone is not a sufficient replay contract. Downstream replay and recovery
    logic should use it as the generation anchor for quarantine decisions once
    the later enforcement work lands.
    """
    return conn.execute(
        """SELECT seq, branch_ref, branch_generation, base_head, session_id, tool_name, source,
                  captured_ts, message
           FROM events
           WHERE state='pending' AND branch_ref=?
           ORDER BY seq""",
        (branch,),
    ).fetchall()


def fetch_ops(conn: sqlite3.Connection, event_seq: int) -> List[sqlite3.Row]:
    return conn.execute(
        """SELECT ord, op, path, old_path, before_oid, before_mode, after_oid, after_mode
           FROM event_ops WHERE event_seq=? ORDER BY ord""",
        (event_seq,),
    ).fetchall()


def pending_count_for_branch(conn: sqlite3.Connection, branch: str) -> int:
    row = conn.execute(
        "SELECT COUNT(*) AS n FROM events WHERE state='pending' AND branch_ref=?",
        (branch,),
    ).fetchone()
    return int(row["n"] if row else 0)


def latest_enqueue(conn: sqlite3.Connection) -> float:
    row = conn.execute("SELECT last_enqueue_ts FROM worker_state WHERE id=1").fetchone()
    return float(row["last_enqueue_ts"] or 0.0) if row else 0.0


def queue_reconcile_paths(
    conn: sqlite3.Connection,
    branch: str,
    branch_generation: int,
    pre_publish_head_entries: Dict[str, Tuple[str, str]],
    post_publish_head_entries: Dict[str, Tuple[str, str]],
    paths: List[str],
) -> None:
    now = time.time()
    for path in sorted(set(paths)):
        pre = pre_publish_head_entries.get(path)
        post = post_publish_head_entries.get(path)
        pre_mode, pre_oid = pre if pre is not None else RECONCILE_ABSENT
        post_mode, post_oid = post if post is not None else RECONCILE_ABSENT
        conn.execute(
            """INSERT INTO reconcile_pending(
                   branch_ref, branch_generation, path, pre_mode, pre_oid, post_mode, post_oid, created_ts
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(branch_ref, branch_generation, path) DO UPDATE SET
                   pre_mode=COALESCE(reconcile_pending.pre_mode, excluded.pre_mode),
                  pre_oid=COALESCE(reconcile_pending.pre_oid, excluded.pre_oid),
                  post_mode=excluded.post_mode,
                  post_oid=excluded.post_oid,
                  created_ts=excluded.created_ts""",
            (
                branch,
                branch_generation,
                path,
                pre_mode,
                pre_oid,
                post_mode,
                post_oid,
                now,
            ),
        )


def fetch_reconcile_pending(
    conn: sqlite3.Connection, branch: str, branch_generation: int
) -> List[sqlite3.Row]:
    return conn.execute(
        """SELECT branch_ref, branch_generation, path, pre_mode, pre_oid, post_mode, post_oid, created_ts
           FROM reconcile_pending
           WHERE branch_ref=? AND branch_generation=?
           ORDER BY created_ts, path""",
        (branch, branch_generation),
    ).fetchall()


def clear_reconcile_paths(
    conn: sqlite3.Connection, branch: str, branch_generation: int, paths: Iterable[str]
) -> None:
    unique = sorted(set(paths))
    if not unique:
        return
    conn.executemany(
        "DELETE FROM reconcile_pending WHERE branch_ref=? AND branch_generation=? AND path=?",
        [(branch, branch_generation, path) for path in unique],
    )


def update_heartbeat(conn: sqlite3.Connection, pid: int) -> None:
    conn.execute(
        "UPDATE worker_state SET pid=?, heartbeat_ts=? WHERE id=1",
        (pid, time.time()),
    )


def clear_worker_state(conn: sqlite3.Connection) -> None:
    try:
        conn.execute(
            "UPDATE worker_state SET pid=0, heartbeat_ts=? WHERE id=1",
            (time.time(),),
        )
    except Exception:  # noqa: BLE001
        pass


def reset_tails_for_paths(
    conn: sqlite3.Connection,
    branch: str,
    branch_generation: int,
    paths_with_seqs: Iterable[Tuple[str, int]],
) -> None:
    """Delete path_tail entries only if they still point at the given
    source_seq. Guards against races with newer captures."""
    for path, seq in paths_with_seqs:
        conn.execute(
            "DELETE FROM path_tail WHERE branch_ref=? AND branch_generation=? AND path=? AND source_seq=?",
            (branch, branch_generation, path, seq),
        )


def retention_prune(conn: sqlite3.Connection) -> None:
    if RETENTION_SECONDS <= 0:
        return
    cutoff = time.time() - RETENTION_SECONDS
    try:
        conn.execute(
            """DELETE FROM events
               WHERE state IN ('published','failed','blocked_conflict')
                 AND settled_ts IS NOT NULL AND settled_ts < ?""",
            (cutoff,),
        )
    except sqlite3.OperationalError as exc:
        debug(f"retention prune failed: {exc}")


def cleanup_orphan_branches(conn: sqlite3.Connection, repo_root: Path) -> None:
    """Quarantine pending rows whose branch ref no longer exists.

    Target contract: branch recreation under the same name is a new generation,
    not a signal to replay stale pending work. This function currently handles
    only the missing-ref case.
    """
    rows = conn.execute(
        "SELECT DISTINCT branch_ref FROM events WHERE state='pending'"
    ).fetchall()
    for row in rows:
        branch = row["branch_ref"]
        if ref_exists(repo_root, branch):
            continue
        conn.execute("BEGIN IMMEDIATE")
        try:
            conn.execute(
                """UPDATE events SET state='blocked_conflict',
                                     error='branch gone', settled_ts=?
                   WHERE state='pending' AND branch_ref=?""",
                (time.time(), branch),
            )
            conn.execute("DELETE FROM path_tail WHERE branch_ref=?", (branch,))
            conn.execute("COMMIT")
            debug(f"marked pending events on missing branch {branch} as blocked")
        except Exception:
            try:
                conn.execute("ROLLBACK")
            except sqlite3.OperationalError:
                pass
            raise


def quarantine_pending_branch(
    conn: sqlite3.Connection, branch: str, error: str
) -> None:
    conn.execute("BEGIN IMMEDIATE")
    try:
        now = time.time()
        conn.execute(
            """UPDATE events SET state='blocked_conflict', error=?, settled_ts=?
               WHERE state='pending' AND branch_ref=?""",
            (error, now, branch),
        )
        conn.execute("DELETE FROM path_tail WHERE branch_ref=?", (branch,))
        conn.execute("DELETE FROM reconcile_pending WHERE branch_ref=?", (branch,))
        conn.execute("COMMIT")
    except Exception:
        try:
            conn.execute("ROLLBACK")
        except sqlite3.OperationalError:
            pass
        raise


def recover_publishing(
    conn: sqlite3.Connection, repo_root: Path, git_dir: Path, common_dir: Path
) -> None:
    """On startup, reconcile any leftover `publishing` events from a prior
    worker that crashed between update-ref and settlement.

    Target contract: this recovery path becomes generation-sensitive once
    future implementation adds the explicit branch-generation checks. Until
    then, this function performs the current restart behavior.
    """
    rows = conn.execute(
        """SELECT seq, branch_ref, branch_generation, base_head, target_commit_oid
           FROM events WHERE state='publishing'
           ORDER BY branch_ref, branch_generation, seq"""
    ).fetchall()
    for row in rows:
        seq = int(row["seq"])
        branch = row["branch_ref"]
        branch_generation = int(row["branch_generation"])
        base_head = str(row["base_head"])
        target = row["target_commit_oid"]
        ops = ops_as_dicts(fetch_ops(conn, seq))
        tail_invalidations = [(path, seq) for path in paths_touched(ops)]
        reconcile_pre, reconcile_post = reconcile_states_for_ops(ops)
        reconcile_paths = paths_touched(ops)
        next_state = "blocked_conflict"
        next_commit_oid: Optional[str] = None
        next_error = "publish recovery target missing from history"
        should_clear_tails = True
        if not target or not ref_exists(repo_root, branch):
            next_error = "branch gone during publish recovery"
        else:
            try:
                branch_head = ref_head(repo_root, branch)
                if not branch_head:
                    next_error = "branch gone during publish recovery"
                else:
                    branch_state = ensure_branch_registry(
                        repo_root,
                        git_dir,
                        common_dir,
                        branch,
                        branch_head,
                        claim_owner=False,
                    )
                    if branch_generation != int(branch_state["generation"]):
                        next_error = f"stale branch generation {branch_generation} != {branch_state['generation']}"
                    elif not is_ancestor(repo_root, base_head, branch_head):
                        next_error = "stale branch ancestry during publish recovery"
                    elif is_ancestor(repo_root, target, branch):
                        next_state = "published"
                        next_commit_oid = target
                        next_error = None
                    else:
                        next_state = "pending"
                        next_error = None
                        should_clear_tails = False
            except RuntimeError as exc:
                next_error = str(exc)

        conn.execute("BEGIN IMMEDIATE")
        try:
            if next_state == "published":
                conn.execute(
                    """UPDATE events SET state='published', commit_oid=?,
                                         target_commit_oid=?, error=NULL, settled_ts=?
                       WHERE seq=?""",
                    (next_commit_oid, target, time.time(), seq),
                )
                queue_reconcile_paths(
                    conn,
                    branch,
                    branch_generation,
                    reconcile_pre,
                    reconcile_post,
                    reconcile_paths,
                )
            elif next_state == "pending":
                conn.execute(
                    """UPDATE events SET state='pending', target_commit_oid=NULL,
                                         error=NULL WHERE seq=?""",
                    (seq,),
                )
            else:
                conn.execute(
                    """UPDATE events SET state='blocked_conflict', target_commit_oid=NULL,
                                         error=?, settled_ts=? WHERE seq=?""",
                    (next_error, time.time(), seq),
                )
            if should_clear_tails and tail_invalidations:
                reset_tails_for_paths(
                    conn, branch, branch_generation, tail_invalidations
                )
            conn.execute("COMMIT")
        except Exception:
            try:
                conn.execute("ROLLBACK")
            except sqlite3.OperationalError:
                pass
            raise

        if next_state == "published":
            debug(f"recover: seq={seq} already published at {target}")
        elif next_state == "pending":
            debug(f"recover: seq={seq} target {target} requeued")
        else:
            debug(f"recover: seq={seq} target {target} quarantined")


# --------------------------------------------------------------------------- #
# Commit message generation
# --------------------------------------------------------------------------- #


def _path_matches_sensitive(path: str) -> bool:
    from fnmatch import fnmatch

    for pattern in SENSITIVE_PATTERNS:
        if fnmatch(path, pattern):
            return True
    return False


def decode_blob_text(data: bytes) -> Optional[str]:
    if b"\x00" in data:
        return None
    return data.decode("utf-8", errors="replace")


def batch_cat_file(repo_root: Path, oids: Iterable[str]) -> Dict[str, bytes]:
    """Resolve many blob OIDs in one `git cat-file --batch` call."""
    unique = sorted({oid for oid in oids if oid and oid != "0" * 40})
    if not unique:
        return {}
    proc = subprocess.Popen(
        ["git", "cat-file", "--batch"],
        cwd=str(repo_root),
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    assert proc.stdin is not None and proc.stdout is not None
    try:
        proc.stdin.write(("\n".join(unique) + "\n").encode("utf-8"))
        proc.stdin.close()
    except Exception:  # noqa: BLE001
        proc.kill()
        proc.wait(timeout=2)
        return {}

    out: Dict[str, bytes] = {}
    try:
        for _ in unique:
            header = proc.stdout.readline()
            if not header:
                break
            header = header.rstrip(b"\n")
            parts = header.split(b" ")
            if len(parts) < 3 or parts[1] != b"blob":
                continue
            oid = parts[0].decode()
            size = int(parts[2])
            data = b""
            while len(data) < size:
                chunk = proc.stdout.read(size - len(data))
                if not chunk:
                    break
                data += chunk
            proc.stdout.read(1)  # trailing newline
            out[oid] = data
    finally:
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
    return out


def op_diff_text(op: Dict[str, Any], blobs: Dict[str, bytes]) -> str:
    kind = op["op"]
    if kind == "create":
        before_label, after_label = "/dev/null", op["path"]
        before_bytes, after_bytes = b"", blobs.get(op.get("after_oid") or "", b"")
    elif kind == "modify":
        before_label = after_label = op["path"]
        before_bytes = blobs.get(op.get("before_oid") or "", b"")
        after_bytes = blobs.get(op.get("after_oid") or "", b"")
    elif kind == "delete":
        before_label, after_label = op["path"], "/dev/null"
        before_bytes = blobs.get(op.get("before_oid") or "", b"")
        after_bytes = b""
    else:  # rename
        before_label = op.get("old_path") or op["path"]
        after_label = op["path"]
        before_bytes = blobs.get(op.get("before_oid") or "", b"")
        after_bytes = blobs.get(op.get("after_oid") or "", b"")

    before_text = decode_blob_text(before_bytes)
    after_text = decode_blob_text(after_bytes)
    if before_text is None or after_text is None:
        return "<binary content changed>"

    diff = list(
        difflib.unified_diff(
            before_text.splitlines(),
            after_text.splitlines(),
            fromfile=before_label,
            tofile=after_label,
            lineterm="",
            n=3,
        )
    )
    if not diff:
        return "<no textual diff>"
    return "\n".join(diff)[:4000]


def _basename(path: Optional[str]) -> str:
    if not path:
        return ""
    name = path.rstrip("/").rsplit("/", 1)[-1]
    return name or path


def _trim_subject(subject: str, limit: int = 50) -> str:
    """Trim a commit subject to `limit` characters, preferring a word
    boundary and adding an ellipsis. Never cuts mid-token."""
    subject = subject.strip()
    if len(subject) <= limit:
        return subject
    head = subject[: limit - 1]
    boundary = max(head.rfind(" "), head.rfind("/"), head.rfind("."))
    if boundary >= limit // 2:
        return head[:boundary].rstrip(" /.") + "…"
    return head.rstrip() + "…"


def _common_dir(paths: List[str]) -> str:
    if not paths:
        return ""
    parts = [p.split("/") for p in paths]
    common: List[str] = []
    for segments in zip(*parts):
        first = segments[0]
        if all(s == first for s in segments):
            common.append(first)
        else:
            break
    # Drop the filename component so we get a directory prefix only.
    if common and common == parts[0][: len(common)] and len(common) == len(parts[0]):
        common = common[:-1]
    return "/".join(common)


def deterministic_message(event: sqlite3.Row, ops: List[Dict[str, Any]]) -> str:
    if len(ops) == 1:
        op = ops[0]
        kind = op["op"]
        name = _basename(op["path"])
        if kind == "create":
            subject = f"Add {name}"
        elif kind == "modify":
            subject = f"Update {name}"
        elif kind == "delete":
            subject = f"Remove {name}"
        else:
            subject = f"Rename {_basename(op.get('old_path'))} to {name}"
    else:
        paths = [op["path"] for op in ops]
        shared = _common_dir(paths)
        if shared:
            subject = f"Update {len(ops)} files in {shared}"
        else:
            subject = f"Update {len(ops)} files"
    subject = _trim_subject(subject)
    lines = [subject, ""]
    for op in ops[:10]:
        if op["op"] == "rename":
            lines.append(f"- Rename {op.get('old_path')} -> {op['path']}")
        else:
            lines.append(f"- {op['op'].title()} {op['path']}")
    tool = event["tool_name"] or "unknown"
    lines.append(f"- Snapshot seq: {event['seq']} tool: {tool}")
    return "\n".join(lines)


def sanitize_message(text: str) -> str:
    raw = [line.rstrip() for line in text.splitlines()]
    lines = [line for line in raw if line.strip()]
    if not lines:
        return "Update files"
    subject = re.sub(r"^[\-*\s]+", "", lines[0]).strip().rstrip(".")
    subject = _trim_subject(subject) if subject else "Update files"
    body: List[str] = []
    current: Optional[str] = None
    for line in lines[1:]:
        stripped = line.strip()
        if not stripped:
            continue
        if re.match(r"^[\-*]\s+", stripped):
            if current:
                body.append(current)
            current = re.sub(r"^[\-*\s]+", "", stripped).strip()
        else:
            current = f"{current} {stripped}".strip() if current else stripped
    if current:
        body.append(current)
    if not body:
        return subject
    wrapped: List[str] = []
    for bullet in body:
        wrapped.extend(
            textwrap.wrap(
                bullet,
                width=72,
                initial_indent="- ",
                subsequent_indent="  ",
                break_long_words=False,
                break_on_hyphens=False,
            )
        )
    return subject + "\n\n" + "\n".join(wrapped)


def ai_message_via_command(
    event: sqlite3.Row,
    ops: List[Dict[str, Any]],
    diffs: Dict[int, str],
) -> Optional[str]:
    if not COMMIT_CMD:
        return None
    try:
        argv = shlex.split(COMMIT_CMD)
    except ValueError as exc:
        debug(f"bad SNAPSHOTD_COMMIT_MESSAGE_CMD: {exc}")
        return None
    if not argv:
        return None
    payload = {
        "seq": event["seq"],
        "branch_ref": event["branch_ref"],
        "tool_name": event["tool_name"] or "",
        "source": event["source"] or "",
        "ops": [
            {
                "op": op["op"],
                "path": op["path"],
                "old_path": op.get("old_path"),
                "diff": diffs.get(idx, ""),
            }
            for idx, op in enumerate(ops)
        ],
    }
    try:
        proc = subprocess.run(
            argv,
            input=json.dumps(payload).encode("utf-8"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=OPENAI_API_TIMEOUT,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError) as exc:
        debug(f"commit message command failed to run: {exc}")
        return None
    if proc.returncode != 0:
        debug(f"commit message command exit {proc.returncode}")
        return None
    text = proc.stdout.decode("utf-8", errors="replace").strip()
    return sanitize_message(text) if text else None


def ai_message_via_openai(
    event: sqlite3.Row,
    ops: List[Dict[str, Any]],
    diffs: Dict[int, str],
) -> Optional[str]:
    if not AI_ENABLE or not OPENAI_API_KEY:
        return None
    if not OPENAI_BASE_URL.lower().startswith("https://"):
        debug("OPENAI_BASE_URL is not https; refusing to send diffs")
        return None
    safe_sections: List[str] = []
    for idx, op in enumerate(ops[:5]):
        if _path_matches_sensitive(op["path"]):
            safe_sections.append(
                f"### {op['op']} {op['path']}\n<redacted: sensitive path>"
            )
            continue
        safe_sections.append(f"### {op['op']} {op['path']}\n{diffs.get(idx, '')}")
    user_prompt = (
        f"Tool: {event['tool_name'] or 'unknown'}\n"
        f"Branch: {event['branch_ref']}\n"
        f"Paths: {', '.join(op['path'] for op in ops)}\n\n"
        f"Diffs:\n{chr(10).join(safe_sections)}\n\nGenerate the commit message."
    )
    payload = {
        "model": OPENAI_MODEL,
        "messages": [
            {"role": "system", "content": AI_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 220,
    }
    req = urllib_request.Request(
        OPENAI_BASE_URL.rstrip("/") + "/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}",
        },
        method="POST",
    )
    try:
        with urllib_request.urlopen(req, timeout=OPENAI_API_TIMEOUT) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
    except (urllib_error.URLError, TimeoutError) as exc:
        debug(f"openai request failed: {exc}")
        return None
    try:
        parsed = json.loads(raw)
        content = parsed["choices"][0]["message"]["content"]
    except (KeyError, IndexError, json.JSONDecodeError) as exc:
        debug(f"openai response parse failed: {exc}")
        return None
    return sanitize_message(content)


def _build_batch_event_payload(
    event: sqlite3.Row,
    ops: List[Dict[str, Any]],
    diffs: Dict[int, str],
) -> Dict[str, Any]:
    """Shape one event for inclusion in a batch request, redacting any
    op diff whose path matches a sensitive glob."""
    op_entries: List[Dict[str, Any]] = []
    for idx, op in enumerate(ops):
        redact = _path_matches_sensitive(op["path"]) or (
            op["op"] == "rename"
            and op.get("old_path")
            and _path_matches_sensitive(op["old_path"])
        )
        diff_text = "<redacted: sensitive path>" if redact else diffs.get(idx, "")
        op_entries.append(
            {
                "op": op["op"],
                "path": op["path"],
                "old_path": op.get("old_path"),
                "diff": diff_text,
            }
        )
    return {
        "seq": int(event["seq"]),
        "tool_name": event["tool_name"] or "",
        "branch_ref": event["branch_ref"],
        "paths": [op["path"] for op in ops],
        "ops": op_entries,
    }


def batch_ai_messages(
    events_with_ops: List[Tuple[sqlite3.Row, List[Dict[str, Any]]]],
    diffs_by_event: Dict[int, Dict[int, str]],
) -> Dict[int, str]:
    """Generate commit messages for a batch of events via structured output.

    Chunks events into groups of ``AI_CHUNK_SIZE``, issues one POST to
    ``{OPENAI_BASE_URL}/chat/completions`` per chunk with a json_schema
    response format, then parses the returned ``messages`` array into a
    ``{seq: "subject\\n\\nbody"}`` mapping (sanitized).

    Returns an empty mapping for any chunk whose request or response fails
    validation, so callers can fall back to
    ``SNAPSHOTD_COMMIT_MESSAGE_CMD`` if configured, otherwise deterministic
    commit messages, for the affected events.
    """
    if not events_with_ops:
        return {}
    if not AI_ENABLE or not OPENAI_API_KEY:
        return {}
    if not OPENAI_BASE_URL.lower().startswith("https://"):
        debug("OPENAI_BASE_URL is not https; refusing to send diffs")
        return {}

    endpoint = OPENAI_BASE_URL.rstrip("/") + "/chat/completions"
    out: Dict[int, str] = {}

    for start in range(0, len(events_with_ops), AI_CHUNK_SIZE):
        chunk = events_with_ops[start : start + AI_CHUNK_SIZE]
        chunk_seqs = [int(ev["seq"]) for ev, _ops in chunk]
        batch_events: List[Dict[str, Any]] = []
        for event, ops in chunk:
            diffs = diffs_by_event.get(int(event["seq"]), {})
            batch_events.append(_build_batch_event_payload(event, ops, diffs))

        user_prompt = (
            "Generate commit messages for the following snapshot events.\n"
            "Return one item per event, keyed by its input seq.\n\n"
            f"{json.dumps({'events': batch_events}, ensure_ascii=False)}"
        )
        payload = {
            "model": OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": BATCH_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.3,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "commit_messages",
                    "strict": True,
                    "schema": BATCH_RESPONSE_SCHEMA,
                },
            },
        }
        req = urllib_request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_API_KEY}",
            },
            method="POST",
        )
        try:
            with urllib_request.urlopen(req, timeout=OPENAI_API_TIMEOUT) as resp:
                raw = resp.read().decode("utf-8", errors="replace")
        except (urllib_error.URLError, TimeoutError) as exc:
            debug(f"openai batch request failed for seqs {chunk_seqs}: {exc}")
            continue
        except Exception as exc:  # noqa: BLE001
            debug(f"openai batch request errored for seqs {chunk_seqs}: {exc}")
            continue

        try:
            parsed = json.loads(raw)
            content = parsed["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
            debug(f"openai batch response parse failed for seqs {chunk_seqs}: {exc}")
            continue

        try:
            structured = json.loads(content)
            items = structured["messages"]
            if not isinstance(items, list):
                raise ValueError("messages is not a list")
        except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
            debug(
                f"openai batch structured output invalid for seqs {chunk_seqs}: {exc}"
            )
            continue

        chunk_seq_set = set(chunk_seqs)
        for item in items:
            if not isinstance(item, dict):
                continue
            seq = item.get("seq")
            subject = item.get("subject")
            body = item.get("body")
            if not isinstance(seq, int) or seq not in chunk_seq_set:
                continue
            if not isinstance(subject, str) or not isinstance(body, str):
                continue
            if not subject.strip():
                continue
            composed = (
                subject.strip() + "\n\n" + body.strip()
                if body.strip()
                else subject.strip()
            )
            sanitized = sanitize_message(composed)
            if sanitized:
                out[seq] = sanitized

    return out


def build_message(
    event: sqlite3.Row,
    ops: List[Dict[str, Any]],
    diffs: Dict[int, str],
    stored_message: Optional[str] = None,
) -> str:
    if stored_message:
        stripped = stored_message.strip()
        if stripped:
            return stripped
    if COMMIT_CMD:
        try:
            msg = ai_message_via_command(event, ops, diffs)
            if msg:
                return msg
        except Exception as exc:  # noqa: BLE001
            debug(f"ai_message_via_command errored: {exc}")
    return deterministic_message(event, ops)


# --------------------------------------------------------------------------- #
# Replay / publish
# --------------------------------------------------------------------------- #


def ops_as_dicts(rows: List[sqlite3.Row]) -> List[Dict[str, Any]]:
    return [
        {
            "ord": r["ord"],
            "op": r["op"],
            "path": r["path"],
            "old_path": r["old_path"],
            "before_oid": r["before_oid"],
            "before_mode": r["before_mode"],
            "after_oid": r["after_oid"],
            "after_mode": r["after_mode"],
        }
        for r in rows
    ]


def verify_op_applies(
    op: Dict[str, Any], state: Dict[str, Tuple[str, str]]
) -> Optional[str]:
    kind = op["op"]
    path = op["path"]
    if kind == "create":
        here = state.get(path)
        if here is not None and (
            here[1] != op["after_oid"] or here[0] != op["after_mode"]
        ):
            return f"create target already exists with different content: {path}"
        return None
    if kind == "modify":
        here = state.get(path)
        expected = (op["before_mode"], op["before_oid"])
        if here != expected:
            return f"modify before-state mismatch for {path}"
        return None
    if kind == "delete":
        here = state.get(path)
        expected = (op["before_mode"], op["before_oid"])
        if here != expected:
            return f"delete before-state mismatch for {path}"
        return None
    if kind == "rename":
        old = op.get("old_path") or ""
        old_here = state.get(old)
        expected = (op["before_mode"], op["before_oid"])
        if old_here != expected:
            return f"rename source mismatch for {old}"
        if path in state:
            return f"rename target already present: {path}"
        return None
    return f"unknown op: {kind}"


def apply_state_op(op: Dict[str, Any], state: Dict[str, Tuple[str, str]]) -> None:
    kind = op["op"]
    path = op["path"]
    if kind in {"create", "modify"}:
        state[path] = (op["after_mode"], op["after_oid"])
    elif kind == "delete":
        state.pop(path, None)
    elif kind == "rename":
        old = op.get("old_path") or ""
        if old:
            state.pop(old, None)
        state[path] = (op["after_mode"], op["after_oid"])


def paths_touched(ops: List[Dict[str, Any]]) -> List[str]:
    paths: List[str] = []
    for op in ops:
        paths.append(op["path"])
        if op["op"] == "rename" and op.get("old_path"):
            paths.append(op["old_path"])
    return paths


def reconcile_states_for_ops(
    ops: List[Dict[str, Any]],
) -> Tuple[Dict[str, Tuple[str, str]], Dict[str, Tuple[str, str]]]:
    pre: Dict[str, Tuple[str, str]] = {}
    post: Dict[str, Tuple[str, str]] = {}
    for op in ops:
        before = None
        after = None
        if op.get("before_mode") is not None and op.get("before_oid") is not None:
            before = (op["before_mode"], op["before_oid"])
        if op.get("after_mode") is not None and op.get("after_oid") is not None:
            after = (op["after_mode"], op["after_oid"])
        kind = op["op"]
        path = op["path"]
        if kind == "rename":
            old_path = op.get("old_path")
            if old_path and before is not None:
                pre[old_path] = before
            if after is not None:
                post[path] = after
            continue
        if before is not None:
            pre[path] = before
        if after is not None:
            post[path] = after
    return pre, post


def replay_batch(
    conn: sqlite3.Connection,
    repo_root: Path,
    git_dir: Path,
    common_dir: Path,
    branch: str,
) -> int:
    """Replay all pending events for one branch ref.

    Target replay contract needs more than ``branch_ref == current_branch``:

    - the live branch tip must still belong to the same generation captured in
      each event's ``base_head``;
    - exact autocommit assumes one worktree owns a branch at a time;
    - stale generations or unsupported same-branch multi-worktree topologies
      should settle as quarantine-style ``blocked_conflict`` rows instead of
      being replayed against a new branch incarnation.

    The current code path is being documented toward that contract; later
    implementation still needs to add the explicit checks.
    """
    events = fetch_pending(conn, branch)
    if not events:
        return 0

    if repo_special_state(git_dir):
        debug("repo in special state; deferring")
        return 0

    head = current_head(repo_root)
    if head is None:
        debug("could not read HEAD; deferring")
        return 0
    live_branch = current_branch(repo_root)
    if live_branch != branch:
        debug(f"worker branch {branch} != live {live_branch}; deferring")
        return 0
    try:
        branch_state = ensure_branch_registry(
            repo_root, git_dir, common_dir, branch, head
        )
    except RuntimeError as exc:
        debug(f"branch registry rejected replay on {branch}: {exc}")
        quarantine_pending_branch(conn, branch, str(exc))
        return 0
    branch_generation = int(branch_state["generation"])

    index_file = git_dir / INDEX_SUBPATH
    index_file.parent.mkdir(parents=True, exist_ok=True)
    env = os.environ.copy()
    env["GIT_INDEX_FILE"] = str(index_file)

    prepared: List[Tuple[int, str, List[Dict[str, Any]]]] = []
    blocked: List[Tuple[int, str, List[Dict[str, Any]]]] = []
    failed: List[Tuple[int, str, List[Dict[str, Any]]]] = []
    head_state: Dict[str, Tuple[str, str]] = {}
    final_parent = head

    try:
        try:
            index_file.unlink(missing_ok=True)
        except OSError:
            pass
        try:
            run_git(repo_root, "read-tree", head, env=env)
        except RuntimeError as exc:
            debug(f"read-tree failed: {exc}")
            return 0

        head_state = dict(read_index_state(repo_root, env))
        state: Dict[str, Tuple[str, str]] = dict(head_state)

        backlog = pending_count_for_branch(conn, branch)
        use_batch_ai = AI_ENABLE and backlog <= AI_MAX_QUEUE_DEPTH
        need_diffs = use_batch_ai or bool(COMMIT_CMD)

        all_event_ops: List[Tuple[sqlite3.Row, List[Dict[str, Any]]]] = []
        diff_oids: List[str] = []
        for event in events:
            ops = ops_as_dicts(fetch_ops(conn, event["seq"]))
            all_event_ops.append((event, ops))
            if need_diffs:
                for op in ops:
                    for key in ("before_oid", "after_oid"):
                        oid = op.get(key)
                        if oid:
                            diff_oids.append(oid)

        blobs: Dict[str, bytes] = (
            batch_cat_file(repo_root, diff_oids) if need_diffs else {}
        )

        # Precompute diffs once per event so the batch AI call and the
        # per-event commit loop can share the same text.
        diffs_by_event: Dict[int, Dict[int, str]] = {}
        if need_diffs:
            for event, ops in all_event_ops:
                diffs_by_event[int(event["seq"])] = {
                    idx: op_diff_text(op, blobs) for idx, op in enumerate(ops)
                }

        # Batched AI pre-pass: generate messages only for events whose
        # stored message is still NULL. Persist each returned message so
        # the commit loop (and any retried batch) reads it straight from
        # the DB. On any per-chunk failure, the affected events simply
        # remain NULL and will fall back to deterministic at commit time.
        stored_messages: Dict[int, str] = {}
        if use_batch_ai:
            needs_message = [
                (event, ops)
                for event, ops in all_event_ops
                if not (event["message"] if "message" in event.keys() else None)
            ]
            # Carry forward any messages already stored from a prior attempt.
            for event, _ops in all_event_ops:
                existing = event["message"] if "message" in event.keys() else None
                if existing:
                    stored_messages[int(event["seq"])] = existing
            if needs_message:
                try:
                    generated = batch_ai_messages(needs_message, diffs_by_event)
                except Exception as exc:  # noqa: BLE001
                    debug(f"batch_ai_messages errored: {exc}")
                    generated = {}
                if generated:
                    conn.execute("BEGIN IMMEDIATE")
                    try:
                        for seq, message in generated.items():
                            conn.execute(
                                """UPDATE events SET message=?
                                   WHERE seq=? AND state='pending'""",
                                (message, seq),
                            )
                        conn.execute("COMMIT")
                    except Exception:
                        try:
                            conn.execute("ROLLBACK")
                        except sqlite3.OperationalError:
                            pass
                        debug("persisting batch messages failed; continuing")
                    stored_messages.update(generated)

        parent = head

        for event, ops in all_event_ops:
            if int(event["branch_generation"]) != branch_generation:
                blocked.append(
                    (
                        int(event["seq"]),
                        f"stale branch generation {event['branch_generation']} != {branch_generation}",
                        ops,
                    )
                )
                continue
            if not is_ancestor(repo_root, str(event["base_head"]), head):
                blocked.append((int(event["seq"]), "stale branch ancestry", ops))
                continue
            if not ops:
                failed.append((int(event["seq"]), "no ops", []))
                continue
            reason: Optional[str] = None
            for op in ops:
                reason = verify_op_applies(op, state)
                if reason is not None:
                    break
            if reason is not None:
                blocked.append((int(event["seq"]), reason, ops))
                continue

            saved_state = dict(state)
            for op in ops:
                apply_state_op(op, state)

            try:
                apply_ops_to_index(repo_root, env, ops)
                tree = run_git(repo_root, "write-tree", env=env).strip()
                diffs = diffs_by_event.get(int(event["seq"]), {}) if need_diffs else {}
                stored = stored_messages.get(int(event["seq"]))
                message = build_message(
                    event,
                    ops,
                    diffs,
                    stored_message=stored,
                )
                commit_oid = run_git(
                    repo_root,
                    "commit-tree",
                    tree,
                    "-p",
                    parent,
                    input_bytes=message.encode("utf-8"),
                    env=env,
                ).strip()
            except RuntimeError as exc:
                state = saved_state
                failed.append((int(event["seq"]), str(exc), ops))
                try:
                    index_file.unlink(missing_ok=True)
                    run_git(repo_root, "read-tree", parent, env=env)
                    state = dict(read_index_state(repo_root, env))
                except RuntimeError:
                    pass
                continue

            prepared.append((int(event["seq"]), commit_oid, ops))
            parent = commit_oid
        final_parent = parent
    finally:
        try:
            index_file.unlink(missing_ok=True)
        except OSError:
            pass

    if not prepared:
        if blocked or failed:
            settle_non_commit_results(conn, branch, branch_generation, blocked, failed)
        return 0

    seqs_to_publish = [seq for seq, _oid, _ops in prepared]

    # Phase 1: record publishing intent.
    conn.execute("BEGIN IMMEDIATE")
    try:
        for seq, commit_oid, _ops in prepared:
            conn.execute(
                """UPDATE events SET state='publishing', target_commit_oid=?
                   WHERE seq=? AND state='pending'""",
                (commit_oid, seq),
            )
        conn.execute("COMMIT")
    except Exception:
        try:
            conn.execute("ROLLBACK")
        except sqlite3.OperationalError:
            pass
        raise

    # Phase 2: move the branch.
    code, _out, err = maybe_git(repo_root, "update-ref", branch, final_parent, head)
    if code != 0:
        debug(f"update-ref CAS failed ({err}); requeuing batch")
        conn.execute("BEGIN IMMEDIATE")
        try:
            for seq in seqs_to_publish:
                conn.execute(
                    """UPDATE events SET state='pending', target_commit_oid=NULL
                       WHERE seq=? AND state='publishing'""",
                    (seq,),
                )
            conn.execute("COMMIT")
        except Exception:
            try:
                conn.execute("ROLLBACK")
            except sqlite3.OperationalError:
                pass
        return -1

    # Phase 3: settle.
    touched: List[str] = []
    for _seq, _oid, ops in prepared:
        for p in paths_touched(ops):
            touched.append(p)
    post_publish_state = {
        path: state[path] for path in sorted(set(touched)) if path in state
    }
    conn.execute("BEGIN IMMEDIATE")
    try:
        now = time.time()
        published_tail_invalidations: List[Tuple[str, int]] = []
        for seq, commit_oid, _ops in prepared:
            conn.execute(
                """UPDATE events SET state='published', commit_oid=?,
                                     settled_ts=? WHERE seq=?""",
                (commit_oid, now, seq),
            )
            for path in paths_touched(_ops):
                published_tail_invalidations.append((path, seq))
        if published_tail_invalidations:
            reset_tails_for_paths(
                conn, branch, branch_generation, published_tail_invalidations
            )
        _settle_blocked_failed(conn, branch, branch_generation, blocked, failed, now)
        queue_reconcile_paths(
            conn,
            branch,
            branch_generation,
            head_state,
            post_publish_state,
            touched,
        )
        conn.execute("COMMIT")
    except Exception:
        try:
            conn.execute("ROLLBACK")
        except sqlite3.OperationalError:
            pass
        raise

    try:
        ensure_branch_registry(repo_root, git_dir, common_dir, branch, final_parent)
    except RuntimeError as exc:
        debug(f"branch registry refresh failed after publish on {branch}: {exc}")

    retry_deferred_reconcile(conn, repo_root, branch, branch_generation)
    debug(f"published {len(prepared)} commit(s) to {branch}: tip={final_parent}")
    return len(prepared)


def _settle_blocked_failed(
    conn: sqlite3.Connection,
    branch: str,
    branch_generation: int,
    blocked: List[Tuple[int, str, List[Dict[str, Any]]]],
    failed: List[Tuple[int, str, List[Dict[str, Any]]]],
    now: float,
) -> None:
    tail_invalidations: List[Tuple[str, int]] = []
    for seq, reason, ops in blocked:
        conn.execute(
            """UPDATE events SET state='blocked_conflict', error=?, settled_ts=?
               WHERE seq=?""",
            (reason, now, seq),
        )
        for path in paths_touched(ops):
            tail_invalidations.append((path, seq))
    for seq, reason, ops in failed:
        conn.execute(
            """UPDATE events SET state='failed', error=?, settled_ts=?
               WHERE seq=?""",
            (reason, now, seq),
        )
        for path in paths_touched(ops):
            tail_invalidations.append((path, seq))
    if tail_invalidations:
        reset_tails_for_paths(conn, branch, branch_generation, tail_invalidations)


def settle_non_commit_results(
    conn: sqlite3.Connection,
    branch: str,
    branch_generation: int,
    blocked: List[Tuple[int, str, List[Dict[str, Any]]]],
    failed: List[Tuple[int, str, List[Dict[str, Any]]]],
) -> None:
    conn.execute("BEGIN IMMEDIATE")
    try:
        _settle_blocked_failed(
            conn, branch, branch_generation, blocked, failed, time.time()
        )
        conn.execute("COMMIT")
    except Exception:
        try:
            conn.execute("ROLLBACK")
        except sqlite3.OperationalError:
            pass
        raise


# --------------------------------------------------------------------------- #
# Main loop
# --------------------------------------------------------------------------- #


def worker_loop(repo_root: Path, git_dir: Path) -> int:
    _repo_root, _git_dir, common_dir = resolve_repo_paths(repo_root)
    conn = open_db(git_dir)
    try:
        update_heartbeat(conn, os.getpid())
        recover_publishing(conn, repo_root, git_dir, common_dir)
        cleanup_orphan_branches(conn, repo_root)
        retention_prune(conn)

        last_maint = time.time()
        idle_since: Optional[float] = None

        while True:
            consume_wake()
            update_heartbeat(conn, os.getpid())
            now = time.time()
            last_enq = latest_enqueue(conn)

            if now - last_maint > 3600:
                retention_prune(conn)
                cleanup_orphan_branches(conn, repo_root)
                last_maint = now

            if now - last_enq < QUIET_SECONDS:
                interruptible_sleep(POLL_SECONDS)
                idle_since = None
                continue

            branch = current_branch(repo_root)
            if branch is None:
                interruptible_sleep(POLL_SECONDS)
                continue

            head = current_head(repo_root)
            if head is not None:
                try:
                    branch_state = ensure_branch_registry(
                        repo_root, git_dir, common_dir, branch, head
                    )
                    retry_deferred_reconcile(
                        conn, repo_root, branch, int(branch_state["generation"])
                    )
                except RuntimeError as exc:
                    debug(f"branch registry rejected reconcile on {branch}: {exc}")

            pending = fetch_pending(conn, branch)
            if not pending:
                if idle_since is None:
                    idle_since = now
                if now - idle_since >= IDLE_SECONDS and now - last_enq >= IDLE_SECONDS:
                    debug("idle timeout reached, exiting")
                    return 0
                interruptible_sleep(POLL_SECONDS)
                continue

            idle_since = None
            result = replay_batch(conn, repo_root, git_dir, common_dir, branch)
            if result == -1:
                interruptible_sleep(POLL_SECONDS)
                continue
            interruptible_sleep(POLL_SECONDS)
    finally:
        clear_worker_state(conn)
        conn.close()


def run_worker(repo_root: Path, git_dir: Path) -> int:
    ensure_db_ready(git_dir)
    lock = Singleton(git_dir / LOCK_SUBPATH)
    if not lock.acquire(attempts=10, sleep=0.05):
        debug("another worker holds the lock; exiting")
        return 0
    try:
        signal.signal(signal.SIGUSR1, _on_wake)
        signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
        return worker_loop(repo_root, git_dir)
    finally:
        lock.release()


# --------------------------------------------------------------------------- #
# CLI: status / flush
# --------------------------------------------------------------------------- #


def cmd_status(git_dir: Path) -> int:
    conn = open_db(git_dir, allow_reset=False)
    try:
        counts = {
            state: conn.execute(
                "SELECT COUNT(*) AS n FROM events WHERE state=?", (state,)
            ).fetchone()["n"]
            for state in (
                "pending",
                "publishing",
                "published",
                "blocked_conflict",
                "failed",
            )
        }
        worker_row = conn.execute(
            "SELECT pid, heartbeat_ts, last_enqueue_ts FROM worker_state WHERE id=1"
        ).fetchone()
        tails = conn.execute("SELECT COUNT(*) AS n FROM path_tail").fetchone()["n"]
        print(
            json.dumps(
                {
                    "db": str(git_dir / DB_SUBPATH),
                    "counts": counts,
                    "path_tails": tails,
                    "worker": {
                        "pid": worker_row["pid"] if worker_row else 0,
                        "heartbeat_ts": worker_row["heartbeat_ts"] if worker_row else 0,
                        "last_enqueue_ts": worker_row["last_enqueue_ts"]
                        if worker_row
                        else 0,
                    },
                },
                indent=2,
            )
        )
        return 0
    finally:
        conn.close()


def cmd_flush(repo_root: Path, git_dir: Path) -> int:
    ensure_db_ready(git_dir)
    lock = Singleton(git_dir / LOCK_SUBPATH)
    if not lock.acquire(attempts=20, sleep=0.1):
        print("another worker is running; could not acquire lock", file=sys.stderr)
        return 2
    try:
        conn = open_db(git_dir)
        try:
            _repo_root, _git_dir, common_dir = resolve_repo_paths(repo_root)
            recover_publishing(conn, repo_root, git_dir, common_dir)
            branch = current_branch(repo_root)
            if branch is None:
                print("detached HEAD, nothing to flush", file=sys.stderr)
                return 1
            head = current_head(repo_root)
            if head is None:
                print("could not resolve HEAD, nothing to flush", file=sys.stderr)
                return 1
            branch_state = ensure_branch_registry(
                repo_root, git_dir, common_dir, branch, head
            )
            branch_generation = int(branch_state["generation"])
            retry_deferred_reconcile(conn, repo_root, branch, branch_generation)
            for _ in range(20):
                result = replay_batch(conn, repo_root, git_dir, common_dir, branch)
                if result == 0:
                    break
                if result == -1:
                    time.sleep(0.1)
                    continue
                retry_deferred_reconcile(conn, repo_root, branch, branch_generation)
            retry_deferred_reconcile(conn, repo_root, branch, branch_generation)
            remaining = pending_count_for_branch(conn, branch)
            if remaining > 0:
                print(
                    f"{remaining} event(s) remain pending on {branch}",
                    file=sys.stderr,
                )
                return 2
            return 0
        finally:
            conn.close()
    finally:
        lock.release()


def resolve_git_dir(repo: Path, explicit_git_dir: Optional[Path]) -> Path:
    if explicit_git_dir is not None:
        return explicit_git_dir
    out = run_git(repo, "rev-parse", "--absolute-git-dir")
    return Path(out.strip())


def main(argv: Optional[List[str]] = None) -> int:
    global _LOG_PATH
    parser = argparse.ArgumentParser(description="Snapshot autocommit worker")
    parser.add_argument("--repo", required=False, help="repo path (working directory)")
    parser.add_argument("--git-dir", required=False, help="explicit git dir override")
    parser.add_argument(
        "--status", action="store_true", help="print queue status and exit"
    )
    parser.add_argument(
        "--flush", action="store_true", help="drain queue immediately and exit"
    )
    args = parser.parse_args(argv)

    repo_input = Path(args.repo).expanduser() if args.repo else Path(os.getcwd())
    try:
        repo_root = Path(run_git(repo_input, "rev-parse", "--show-toplevel")).resolve()
        git_dir = (
            Path(args.git_dir).expanduser().resolve()
            if args.git_dir
            else resolve_git_dir(repo_input, None)
        )
    except RuntimeError as exc:
        print(f"not a git repository: {exc}", file=sys.stderr)
        return 1

    _LOG_PATH = git_dir / LOG_SUBPATH

    try:
        if args.status:
            return cmd_status(git_dir)
        if args.flush:
            return cmd_flush(repo_root, git_dir)
        return run_worker(repo_root, git_dir)
    except Exception as exc:  # noqa: BLE001
        debug(f"worker fatal: {exc}")
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
