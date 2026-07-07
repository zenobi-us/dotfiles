#!/usr/bin/env python3
"""Shared branch-registry helpers for snapshot hook and worker."""

from __future__ import annotations

import fcntl
import hashlib
import json
import os
import errno
import subprocess
import time
from pathlib import Path
from typing import Any, Dict, Optional, Tuple


STATE_SUBDIR = "ai-snapshotd"
REGISTRY_SUBDIR = f"{STATE_SUBDIR}/branch-registry"
REGISTRY_SCHEMA = 1
LOCAL_STATE_SCHEMA_VERSION = 2
RESET_LOCK_NAME = f"{STATE_SUBDIR}.reset.lock"
WORKER_LOCK_SUBPATH = f"{STATE_SUBDIR}/worker.lock"


class IncompatibleLocalStateError(RuntimeError):
    """Raised when worktree-local snapshot state is from an incompatible schema."""


def run_git(cwd: Path, *args: str) -> str:
    proc = subprocess.run(
        ["git", *args],
        cwd=str(cwd),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            proc.stderr.decode("utf-8", errors="replace").strip()
            or f"git {' '.join(args)} failed"
        )
    return proc.stdout.decode("utf-8", errors="replace").rstrip("\n")


def maybe_git(cwd: Path, *args: str) -> Tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=str(cwd),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return (
        proc.returncode,
        proc.stdout.decode("utf-8", errors="replace").rstrip("\n"),
        proc.stderr.decode("utf-8", errors="replace").rstrip("\n"),
    )


def resolve_repo_paths(cwd: Path) -> Tuple[Path, Path, Path]:
    repo_root = Path(run_git(cwd, "rev-parse", "--show-toplevel"))
    git_dir = Path(run_git(cwd, "rev-parse", "--absolute-git-dir"))
    common_dir = Path(run_git(cwd, "rev-parse", "--git-common-dir"))
    if not common_dir.is_absolute():
        common_dir = (cwd.resolve() / common_dir).resolve()
    return repo_root, git_dir, common_dir


def current_head(cwd: Path) -> Optional[str]:
    code, out, _err = maybe_git(cwd, "rev-parse", "HEAD")
    if code != 0:
        return None
    return out.strip() or None


def is_ancestor(cwd: Path, commit: str, descendant: str) -> bool:
    code, _out, _err = maybe_git(cwd, "merge-base", "--is-ancestor", commit, descendant)
    return code == 0


def registry_dir(common_dir: Path) -> Path:
    return common_dir / REGISTRY_SUBDIR


def registry_path(common_dir: Path, branch_ref: str) -> Path:
    digest = hashlib.sha256(branch_ref.encode("utf-8")).hexdigest()[:16]
    return registry_dir(common_dir) / f"{digest}.json"


def registry_lock_path(common_dir: Path, branch_ref: str) -> Path:
    digest = hashlib.sha256(branch_ref.encode("utf-8")).hexdigest()[:16]
    return registry_dir(common_dir) / f"{digest}.lock"


def reset_lock_path(git_dir: Path) -> Path:
    return git_dir / RESET_LOCK_NAME


def worker_lock_path(git_dir: Path) -> Path:
    return git_dir / WORKER_LOCK_SUBPATH


def local_state_dir(git_dir: Path) -> Path:
    return git_dir / STATE_SUBDIR


def _lock_is_held(lock_path: Path) -> bool:
    if not lock_path.exists():
        return False
    with lock_path.open("a+") as fh:
        try:
            fcntl.flock(fh.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError as exc:
            if exc.errno in (errno.EACCES, errno.EAGAIN):
                return True
            raise
        fcntl.flock(fh.fileno(), fcntl.LOCK_UN)
    return False


def quarantine_incompatible_local_state(git_dir: Path, reason: str) -> Optional[Path]:
    state_dir = local_state_dir(git_dir)
    if not state_dir.exists():
        return None
    lock_path = reset_lock_path(git_dir)
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open("a+") as lock_fh:
        fcntl.flock(lock_fh.fileno(), fcntl.LOCK_EX)
        if not state_dir.exists():
            return None
        if _lock_is_held(worker_lock_path(git_dir)):
            raise RuntimeError(
                "snapshot state is incompatible but worker.lock is held; retry after the active worker exits"
            )
        stamp = time.strftime("%Y%m%d-%H%M%S")
        target = git_dir / f"{STATE_SUBDIR}.incompatible-{stamp}-{os.getpid()}"
        counter = 1
        while target.exists():
            counter += 1
            target = (
                git_dir / f"{STATE_SUBDIR}.incompatible-{stamp}-{os.getpid()}-{counter}"
            )
        state_dir.replace(target)
        note = target / "INCOMPATIBLE_STATE.txt"
        note.write_text(
            f"reason: {reason}\nquarantined_ts: {time.strftime('%Y-%m-%d %H:%M:%S')}\n",
            encoding="utf-8",
        )
        return target


def _git_path(repo_root: Path, name: str) -> Path:
    return Path(run_git(repo_root, "rev-parse", "--git-path", name)).resolve()


def load_branch_registry(common_dir: Path, branch_ref: str) -> Optional[Dict[str, Any]]:
    path = registry_path(common_dir, branch_ref)
    if not path.exists():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or data.get("schema") != REGISTRY_SCHEMA:
        raise RuntimeError(f"unsupported branch registry format at {path}")
    if data.get("branch_ref") != branch_ref:
        raise RuntimeError(f"branch registry mismatch at {path}")
    return data


def write_branch_registry(
    common_dir: Path, branch_ref: str, data: Dict[str, Any]
) -> None:
    path = registry_path(common_dir, branch_ref)
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = dict(data)
    payload["schema"] = REGISTRY_SCHEMA
    payload["branch_ref"] = branch_ref
    payload["updated_ts"] = time.time()
    tmp = path.with_name(f"{path.name}.tmp.{os.getpid()}.{time.time_ns()}")
    tmp.write_text(
        json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    os.replace(tmp, path)


def branch_worktree_git_dirs(repo_root: Path, branch_ref: str) -> Tuple[Path, ...]:
    code, out, err = maybe_git(repo_root, "worktree", "list", "--porcelain")
    if code != 0:
        raise RuntimeError(err or "git worktree list --porcelain failed")
    matches = []
    worktree_path: Optional[Path] = None
    worktree_branch: Optional[str] = None
    for line in out.splitlines() + [""]:
        if not line:
            if worktree_path is not None and worktree_branch == branch_ref:
                matches.append(
                    Path(
                        run_git(worktree_path, "rev-parse", "--absolute-git-dir")
                    ).resolve()
                )
            worktree_path = None
            worktree_branch = None
            continue
        if line.startswith("worktree "):
            worktree_path = Path(line.split(" ", 1)[1]).resolve()
            continue
        if line.startswith("branch "):
            worktree_branch = line.split(" ", 1)[1].strip()
    return tuple(matches)


def branch_incarnation_token(repo_root: Path, branch_ref: str) -> str:
    reflog_path = _git_path(repo_root, f"logs/{branch_ref}")
    if reflog_path.exists():
        st = reflog_path.stat()
        return f"reflog:{st.st_ino}"
    ref_path = _git_path(repo_root, branch_ref)
    if ref_path.exists():
        st = ref_path.stat()
        return f"ref:{st.st_ino}"
    return "missing"


def ensure_branch_registry(
    repo_root: Path,
    git_dir: Path,
    common_dir: Path,
    branch_ref: str,
    head: str,
    claim_owner: bool = True,
) -> Dict[str, Any]:
    lock_path = registry_lock_path(common_dir, branch_ref)
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    git_dir = git_dir.resolve()
    with lock_path.open("a+") as lock_fh:
        fcntl.flock(lock_fh.fileno(), fcntl.LOCK_EX)
        checked_out_dirs = tuple(
            p.resolve() for p in branch_worktree_git_dirs(repo_root, branch_ref)
        )
        if len(set(checked_out_dirs)) > 1:
            joined = ", ".join(str(p) for p in checked_out_dirs)
            raise RuntimeError(
                f"branch {branch_ref} is checked out in multiple worktrees: {joined}"
            )
        if claim_owner and checked_out_dirs and git_dir not in checked_out_dirs:
            raise RuntimeError(
                f"branch {branch_ref} is checked out in another worktree: {checked_out_dirs[0]}"
            )

        existing = load_branch_registry(common_dir, branch_ref)
        generation = 1
        owner_git_dir: Optional[str] = None
        previous_head: Optional[str] = None
        previous_token: Optional[str] = None
        if existing is not None:
            generation = int(existing.get("generation") or 1)
            owner_git_dir = str(existing.get("owner_git_dir") or "") or None
            previous_head = str(existing.get("head") or "") or None
            previous_token = str(existing.get("incarnation_token") or "") or None

        current_token = branch_incarnation_token(repo_root, branch_ref)

        bump_generation = False
        if (
            previous_head
            and previous_head != head
            and not is_ancestor(repo_root, previous_head, head)
        ):
            bump_generation = True
        if previous_token and current_token != previous_token:
            bump_generation = True
        if claim_owner and owner_git_dir and Path(owner_git_dir).resolve() != git_dir:
            bump_generation = True
        if bump_generation:
            generation += 1

        data = {
            "generation": generation,
            "owner_git_dir": str(git_dir) if claim_owner else owner_git_dir,
            "owner_repo_root": str(repo_root),
            "head": head,
            "incarnation_token": current_token,
        }
        write_branch_registry(common_dir, branch_ref, data)
        return data
