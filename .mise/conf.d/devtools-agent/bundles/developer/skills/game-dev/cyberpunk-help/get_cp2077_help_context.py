#!/usr/bin/env python3
"""Discover Cyberpunk 2077 + Vortex + CET context. Signature files only; no canonical paths."""
from __future__ import annotations

import hashlib
import json
import os
import platform
import re
import sys
from datetime import datetime
from pathlib import Path

STEAM_APP_ID = "1091500"
EXE_NAME = "Cyberpunk2077.exe"
SAVE_META = "metadata.9.json"
SAVE_DAT = "sav.dat"
DEPLOY_NAME = "vortex.deployment.json"
CET_LOG_REL = Path("bin") / "x64" / "plugins" / "cyber_engine_tweaks" / "cyber_engine_tweaks.log"

SKIP_DIR_NAMES = {
    "$recycle.bin",
    "windows",
    "system32",
    "syswow64",
    "winsxs",
    "node_modules",
    ".git",
    ".svn",
    "__pycache__",
    "cache",
    "caches",
    "gpuCache",
    "code cache",
    "temp",
    "tmp",
    "proc",
    "dev",
    "shadercache",
    "downloading",
    "steamapps\\downloading",
    "appdata",
}

_VDF_PATH = re.compile(r'"path"\s*"([^"]+)"')


def _now() -> datetime:
    return datetime.now().astimezone()


def _os_info() -> dict:
    info = {
        "osCaption": None,
        "osVersion": platform.version(),
        "osBuild": None,
        "osArchitecture": platform.machine(),
        "platform": sys.platform,
    }
    if sys.platform == "win32":
        info["osCaption"] = "Windows"
        info["osBuild"] = platform.version()
        try:
            import winreg

            key = winreg.OpenKey(
                winreg.HKEY_LOCAL_MACHINE,
                r"SOFTWARE\Microsoft\Windows NT\CurrentVersion",
            )
            try:
                prod, _ = winreg.QueryValueEx(key, "ProductName")
                build, _ = winreg.QueryValueEx(key, "CurrentBuild")
                if prod:
                    info["osCaption"] = prod
                if build:
                    info["osBuild"] = str(build)
            finally:
                winreg.CloseKey(key)
        except OSError:
            info["osCaption"] = platform.platform()
    elif sys.platform == "darwin":
        info["osCaption"] = "macOS"
        try:
            import subprocess

            r = subprocess.run(["sw_vers"], capture_output=True, text=True, timeout=10)
            info["osCaption"] = " ".join(
                ln.split(":", 1)[-1].strip() for ln in r.stdout.splitlines() if ln.strip()
            )
        except Exception:
            pass
    else:
        osrel = Path("/etc/os-release")
        if osrel.is_file():
            kv = {}
            for ln in osrel.read_text(encoding="utf-8", errors="replace").splitlines():
                if "=" in ln:
                    k, v = ln.split("=", 1)
                    kv[k] = v.strip().strip('"')
            info["osCaption"] = kv.get("PRETTY_NAME") or kv.get("NAME")
            info["osVersion"] = kv.get("VERSION_ID") or info["osVersion"]
        else:
            info["osCaption"] = "Linux"
    return info


def _skip_dir(name: str) -> bool:
    return name.lower() in SKIP_DIR_NAMES or name.startswith(".")


def _walk(root: Path, max_depth: int, file_pred):
    root = Path(root)
    if not root.is_dir():
        return
    start = len(root.parts)
    for dirpath, dirnames, filenames in os.walk(root, topdown=True):
        p = Path(dirpath)
        depth = len(p.parts) - start
        dirnames[:] = [d for d in dirnames if not _skip_dir(d)]
        if depth > max_depth:
            dirnames[:] = []
            continue
        for fn in filenames:
            fp = p / fn
            if file_pred(fp, filenames):
                yield fp


def _steam_vdf_seeds() -> list[Path]:
    home = Path.home()
    seeds = [
        home / ".steam/steam/steamapps/libraryfolders.vdf",
        home / ".steam/root/steamapps/libraryfolders.vdf",
        home / ".local/share/Steam/steamapps/libraryfolders.vdf",
        home / "Library/Application Support/Steam/steamapps/libraryfolders.vdf",
        home / ".var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps/libraryfolders.vdf",
    ]
    pf86 = os.environ.get("ProgramFiles(x86)") or os.environ.get("PROGRAMFILES(X86)")
    pf = os.environ.get("ProgramFiles")
    if pf86:
        seeds.append(Path(pf86) / "Steam/steamapps/libraryfolders.vdf")
    if pf:
        seeds.append(Path(pf) / "Steam/steamapps/libraryfolders.vdf")
    # Extra libraries: shallow scan of existing drive/mount roots
    extra_roots: list[Path] = []
    if sys.platform == "win32":
        extra_roots.extend(Path(f"{c}:/") for c in "CDEFGHIJKLMNOPQRSTUVWXYZ")
    else:
        extra_roots.extend(
            [
                Path("/mnt"),
                Path("/media"),
                Path("/run/media"),
                home,
            ]
        )
    found = []
    for s in seeds:
        if s.is_file():
            found.append(s)
    for r in extra_roots:
        if not r.exists():
            continue
        candidates = [
            r / "Steam" / "steamapps" / "libraryfolders.vdf",
            r / "SteamLibrary" / "steamapps" / "libraryfolders.vdf",
        ]
        try:
            for child in r.iterdir():
                if child.is_dir() and "steam" in child.name.lower():
                    candidates.append(child / "steamapps" / "libraryfolders.vdf")
        except OSError:
            pass
        for c in candidates:
            if c.is_file():
                found.append(c)
    # unique
    out = []
    seen = set()
    for f in found:
        key = str(f.resolve()) if f.exists() else str(f)
        if key not in seen:
            seen.add(key)
            out.append(f)
    return out


def _parse_libraryfolders(vdf: Path) -> list[Path]:
    try:
        text = vdf.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return []
    paths = []
    for m in _VDF_PATH.finditer(text):
        raw = m.group(1).replace("\\\\", "\\")
        p = Path(raw)
        if p.is_dir():
            paths.append(p)
    # the vdf's own steamapps parent is also a library
    try:
        steamapps = vdf.parent
        lib = steamapps.parent
        if lib.is_dir() and lib not in paths:
            paths.append(lib)
    except Exception:
        pass
    return paths


def _looks_like_game_dir(d: Path) -> bool:
    exe = d / "bin" / "x64" / EXE_NAME
    return exe.is_file()


def _find_game_dirs(libraries: list[Path]) -> list[Path]:
    """Only look at steamapps/common and appmanifest — never walk a whole Steam library."""
    found = []
    seen = set()

    def add(d: Path):
        if not d.is_dir():
            return
        try:
            key = str(d.resolve())
        except OSError:
            key = str(d)
        if key in seen:
            return
        if _looks_like_game_dir(d) or (d / "bin" / "x64").is_dir():
            seen.add(key)
            found.append(d)

    for lib in libraries:
        common = lib / "steamapps" / "common"
        try:
            add(common / "Cyberpunk 2077")
            if common.is_dir():
                for child in common.iterdir():
                    if child.is_dir() and "cyberpunk" in child.name.lower():
                        add(child)
        except OSError:
            continue
        acf = lib / "steamapps" / f"appmanifest_{STEAM_APP_ID}.acf"
        try:
            if acf.is_file():
                text = acf.read_text(encoding="utf-8", errors="replace")
                m = re.search(r'"installdir"\s*"([^"]+)"', text)
                if m:
                    add(common / m.group(1))
        except OSError:
            pass
    # Prefer a folder that already has the exe (in case of a mid-move copy)
    found.sort(key=lambda d: (not _looks_like_game_dir(d), str(d)))
    return found


def _parse_vortex_folder(name: str) -> dict:
    unix = None
    body = name
    m = re.match(r"^(.*)-(\d{9,})$", name)
    if m:
        body, unix = m.group(1), m.group(2)
    tokens = body.split("-")
    id_index = None
    for i, tok in enumerate(tokens):
        if tok.isdigit():
            id_index = i
            break
    if id_index is not None and id_index < len(tokens) - 1:
        display = "-".join(tokens[:id_index]).strip()
        ver_raw = "-".join(tokens[id_index + 1 :])
        version = re.sub(r"(?<=\d)-(?=\d)", ".", ver_raw)
        return {
            "Folder": name,
            "Name": display or name,
            "NexusId": tokens[id_index],
            "Version": version,
            "Unix": unix,
        }
    return {
        "Folder": name,
        "Name": name,
        "NexusId": None,
        "Version": None,
        "Unix": unix,
    }


def _mods_from_deploy(game: Path) -> tuple[str | None, list[dict], list[str]]:
    deploy = game / DEPLOY_NAME
    if not deploy.is_file():
        return None, [], []
    try:
        data = json.loads(deploy.read_text(encoding="utf-8", errors="replace"))
    except (OSError, json.JSONDecodeError):
        return None, [], []
    staging = data.get("stagingPath")
    files = data.get("files") or []
    sources = sorted({f.get("source") for f in files if f.get("source")})
    deployed = [_parse_vortex_folder(s) for s in sources]
    staged_not = []
    if staging and Path(staging).is_dir():
        staged = [p.name for p in Path(staging).iterdir() if p.is_dir()]
        staged_not = [
            n for n in staged if n not in sources and not n.startswith("vortex_collection")
        ]
    return staging, deployed, staged_not


def _manual_mods(game: Path) -> list[dict]:
    names = []
    rels = [
        Path("archive/pc/mod"),
        Path("red4ext/plugins"),
        Path("r6/scripts"),
        Path("bin/x64/plugins/cyber_engine_tweaks/mods"),
    ]
    for rel in rels:
        d = game / rel
        if not d.is_dir():
            continue
        for child in d.iterdir():
            if child.name.startswith("__"):
                continue
            names.append(
                {
                    "Folder": child.name,
                    "Name": child.name,
                    "NexusId": None,
                    "Version": None,
                    "Unix": None,
                    "kind": rel.as_posix(),
                }
            )
    return names


def _is_cp_save_dir(d: Path) -> bool:
    meta = d / SAVE_META
    dat = d / SAVE_DAT
    if not (meta.is_file() and dat.is_file()):
        return False
    try:
        raw = meta.read_text(encoding="utf-8", errors="replace")[:800]
    except OSError:
        return False
    return "saveMetadataContainer" in raw or "trackedQuest" in raw or "playthroughTime" in raw


def _find_save_dirs(home: Path, libraries: list[Path], games: list[Path]) -> list[Path]:
    hits: list[Path] = []
    seen = set()

    def add(d: Path):
        try:
            key = str(d.resolve())
        except OSError:
            key = str(d)
        if key not in seen:
            seen.add(key)
            hits.append(d)

    def scan(root: Path, depth: int):
        if not root.is_dir():
            return
        try:
            for fp in _walk(
                root,
                depth,
                lambda f, names: f.name.lower() == SAVE_META.lower() and SAVE_DAT in names,
            ):
                if _is_cp_save_dir(fp.parent):
                    add(fp.parent)
        except (PermissionError, OSError):
            return

    # Only scan home children whose names look save-related — never the whole profile
    # and never an entire Steam library (that hangs while a game is being copied).
    name_hits = ("save", "saves", "cd projekt", "cyberpunk", "games")
    try:
        for child in home.iterdir():
            if not child.is_dir() or _skip_dir(child.name):
                continue
            n = child.name.lower()
            if any(k in n for k in name_hits):
                scan(child, 5)
    except OSError:
        pass
    for lib in libraries:
        scan(lib / "steamapps" / "compatdata" / STEAM_APP_ID, 10)
    for g in games:
        scan(g / "saves", 3)

    return hits


def _latest_save(save_dirs: list[Path]) -> tuple[Path | None, dict | None]:
    if not save_dirs:
        return None, None
    # group by parent (the playthrough folder that holds ManualSave-*)
    newest = max(save_dirs, key=lambda p: p.stat().st_mtime)
    meta = None
    mf = newest / SAVE_META
    try:
        blob = json.loads(mf.read_text(encoding="utf-8", errors="replace"))
        meta = (blob.get("Data") or {}).get("metadata") or blob.get("metadata")
    except (OSError, json.JSONDecodeError):
        meta = None
    return newest, meta


def _cet_from_log(game: Path) -> tuple[str | None, str | None]:
    log = game / CET_LOG_REL
    if not log.is_file():
        # search under game
        try:
            for fp in _walk(game, 8, lambda f, names: f.name.lower() == "cyber_engine_tweaks.log"):
                log = fp
                break
            else:
                return None, None
        except OSError:
            return None, None
    cet = game_ver = None
    try:
        lines = log.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return None, None
    for ln in lines:
        m = re.search(r"CET version\s+(v[\d.]+)", ln)
        if m:
            cet = m.group(1)
        m = re.search(r"Game version\s+([\d.]+)", ln)
        if m:
            game_ver = m.group(1)
    return cet, game_ver


def _state_dir() -> Path:
    if sys.platform == "win32":
        base = os.environ.get("LOCALAPPDATA") or str(Path.home() / "AppData" / "Local")
        return Path(base) / "grok-cyberpunk-help"
    xdg = os.environ.get("XDG_STATE_HOME")
    if xdg:
        return Path(xdg) / "grok-cyberpunk-help"
    return Path.home() / ".local" / "state" / "grok-cyberpunk-help"


def _process_running() -> bool:
    if sys.platform == "win32":
        try:
            import subprocess

            r = subprocess.run(
                ["tasklist", "/FI", "IMAGENAME eq Cyberpunk2077.exe"],
                capture_output=True,
                text=True,
                timeout=10,
            )
            return "Cyberpunk2077.exe" in (r.stdout or "")
        except Exception:
            return False
    try:
        import subprocess

        r = subprocess.run(["pgrep", "-f", "Cyberpunk2077"], capture_output=True, timeout=10)
        return r.returncode == 0
    except Exception:
        return False


def main() -> int:
    now = _now()
    osinfo = _os_info()
    home = Path.home()

    vdfs = _steam_vdf_seeds()
    libraries: list[Path] = []
    for v in vdfs:
        libraries.extend(_parse_libraryfolders(v))
    # unique libs
    lib_u = []
    seen_l = set()
    for lib in libraries:
        k = str(lib)
        if k not in seen_l:
            seen_l.add(k)
            lib_u.append(lib)
    libraries = lib_u

    games = _find_game_dirs(libraries)
    game = games[0] if games else None

    staging = None
    deployed: list[dict] = []
    staged_not: list[str] = []
    if game:
        staging, deployed, staged_not = _mods_from_deploy(game)
        if not deployed:
            deployed = _manual_mods(game)

    save_dirs = _find_save_dirs(home, libraries, games)
    latest, meta = _latest_save(save_dirs)

    cet_log, game_from_cet = (None, None)
    cet_vortex = None
    if game:
        cet_log, game_from_cet = _cet_from_log(game)
        for m in deployed:
            folder = (m.get("Folder") or "") + " " + (m.get("Name") or "")
            if re.search(r"CET|cyber.?engine.?tweaks", folder, re.I):
                cet_vortex = m.get("Version")
                break

    def sha_inventory(mods: list[dict]) -> str:
        src = "\n".join(
            f"{m.get('Folder')}|{m.get('NexusId')}|{m.get('Version')}" for m in mods
        ).encode("utf-8")
        return hashlib.sha256(src).hexdigest()

    inv_hash = sha_inventory(deployed)
    state = _state_dir()
    snap_path = state / "last-inventory.json"
    inventory_changed = True
    previous_at = None
    added, removed = [], []
    if snap_path.is_file():
        try:
            prev = json.loads(snap_path.read_text(encoding="utf-8"))
            previous_at = prev.get("localDateTime")
            inventory_changed = prev.get("inventoryHash") != inv_hash
            prev_f = {m.get("Folder") for m in (prev.get("deployedMods") or [])}
            now_f = {m.get("Folder") for m in deployed}
            added = sorted(now_f - prev_f)
            removed = sorted(prev_f - now_f)
        except (OSError, json.JSONDecodeError):
            inventory_changed = True

    out = {
        "localDate": now.strftime("%Y-%m-%d"),
        "localDateTime": now.replace(microsecond=0).isoformat(),
        "day": now.day,
        "month": now.month,
        "year": now.year,
        "osCaption": osinfo["osCaption"],
        "osVersion": osinfo["osVersion"],
        "osBuild": osinfo["osBuild"],
        "osArchitecture": osinfo["osArchitecture"],
        "platform": osinfo["platform"],
        "pythonVersion": platform.python_version(),
        "gamePath": str(game) if game else None,
        "stagingPath": staging,
        "processRunning": _process_running(),
        "gamePatchFromSave": (meta or {}).get("buildPatch") if meta else None,
        "gameVersionFromCet": game_from_cet,
        "cetVersionFromLog": cet_log,
        "cetVersionFromVortex": cet_vortex,
        "latestSave": (
            {
                "name": latest.name,
                "time": datetime.fromtimestamp(latest.stat().st_mtime).isoformat(
                    timespec="seconds"
                ),
            }
            if latest
            else None
        ),
        "trackedQuestEntry": (meta or {}).get("trackedQuestEntry") if meta else None,
        "trackedQuest": (meta or {}).get("trackedQuest") if meta else None,
        "locationName": (meta or {}).get("locationName") if meta else None,
        "playerPosition": (meta or {}).get("playerPosition") if meta else None,
        "lifePath": (meta or {}).get("lifePath") if meta else None,
        "level": (meta or {}).get("level") if meta else None,
        "streetCred": (meta or {}).get("streetCred") if meta else None,
        "isModded": (meta or {}).get("isModded") if meta else None,
        "dlc": (meta or {}).get("additionalContentIds") or [],
        "deployedMods": deployed,
        "stagedNotDeployed": staged_not,
        "inventoryHash": inv_hash,
        "inventoryChanged": inventory_changed,
        "previousSnapshotAt": previous_at,
        "addedSinceSnapshot": added,
        "removedSinceSnapshot": removed,
        "saveDirCount": len(save_dirs),
        "gameDirCount": len(games),
    }

    try:
        state.mkdir(parents=True, exist_ok=True)
        snap_path.write_text(json.dumps(out, indent=2), encoding="utf-8")
    except OSError:
        pass

    json.dump(out, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
