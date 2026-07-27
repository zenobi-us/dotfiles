#!/usr/bin/env python3
"""Resolve InvokeAI root-relative storage paths from invokeai.yaml and environment.

This is a planning helper, not an effective-runtime-config oracle. Arbitrary CLI
path overrides and launcher/container remapping are invisible unless supplied.
"""

from __future__ import annotations

import argparse
import ast
import json
import os
import sys
from pathlib import Path
from typing import Any

PATH_DEFAULTS: dict[str, str] = {
    "models_dir": "models",
    "convert_cache_dir": "models/.convert_cache",
    "download_cache_dir": "models/.download_cache",
    "legacy_conf_dir": "configs",
    "db_dir": "databases",
    "outputs_dir": "outputs",
    "custom_nodes_dir": "nodes",
    "style_presets_dir": "style_presets",
    "workflow_thumbnails_dir": "workflow_thumbnails",
    "profiles_dir": "profiles",
}


def default_root() -> Path:
    if value := os.environ.get("INVOKEAI_ROOT"):
        return Path(value)
    if value := os.environ.get("VIRTUAL_ENV"):
        return Path(value).parent
    return Path.home() / "invokeai"


def load_simple_top_level_yaml(text: str) -> dict[str, Any]:
    """Parse the top-level scalar fields this inventory needs when PyYAML is unavailable."""
    wanted = set(PATH_DEFAULTS) | {"schema_version"}
    result: dict[str, Any] = {}
    for line_number, line in enumerate(text.splitlines(), start=1):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if line[:1].isspace() or ":" not in line:
            continue
        key, raw = line.split(":", 1)
        key = key.strip()
        if key not in wanted:
            continue
        raw = raw.strip()
        if not raw:
            continue
        if raw[0] in {'"', "'"}:
            try:
                value = ast.literal_eval(raw)
            except (SyntaxError, ValueError) as exc:
                raise ValueError(f"invalid quoted scalar for {key} on line {line_number}") from exc
        else:
            value = raw.split(" #", 1)[0].strip()
            if value in {"null", "Null", "NULL", "~"}:
                value = None
        result[key] = value
    return result


def load_yaml(path: Path) -> tuple[dict[str, Any], str]:
    if not path.exists():
        return {}, "missing"
    text = path.read_text(encoding="utf-8")
    try:
        import yaml  # type: ignore[import-not-found]
    except ImportError:
        return load_simple_top_level_yaml(text), "stdlib-top-level-scalar-fallback"
    value = yaml.safe_load(text)
    if value is None:
        return {}, "pyyaml"
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain a top-level YAML mapping")
    return value, "pyyaml"


def resolve_path(root: Path, raw: str | Path) -> Path:
    path = Path(raw).expanduser()
    if not path.is_absolute():
        path = root / path
    return path.resolve(strict=False)


def env_value(field: str) -> str | None:
    value = os.environ.get(f"INVOKEAI_{field.upper()}")
    return value if value not in (None, "") else None


def path_record(path: Path) -> dict[str, Any]:
    exists = path.exists()
    record: dict[str, Any] = {
        "path": str(path),
        "exists": exists,
        "kind": "missing",
    }
    if exists:
        if path.is_dir():
            record["kind"] = "directory"
        elif path.is_file():
            record["kind"] = "file"
            try:
                record["bytes"] = path.stat().st_size
            except OSError:
                pass
        else:
            record["kind"] = "other"
        record["readable"] = os.access(path, os.R_OK)
        record["writable"] = os.access(path, os.W_OK)
    return record


def build_inventory(root: Path, config_path: Path, root_source: str) -> dict[str, Any]:
    config, config_parser = load_yaml(config_path)
    paths: dict[str, dict[str, Any]] = {}
    sources: dict[str, str] = {}

    for field, default in PATH_DEFAULTS.items():
        if (value := env_value(field)) is not None:
            raw = value
            source = f"environment:INVOKEAI_{field.upper()}"
        elif field in config and config[field] is not None:
            raw = config[field]
            source = f"yaml:{config_path}"
        else:
            raw = default
            source = "default"
        if not isinstance(raw, (str, Path)):
            raise ValueError(f"{field} must be a path string, got {type(raw).__name__}")
        resolved = resolve_path(root, raw)
        paths[field] = path_record(resolved)
        sources[field] = source

    db_dir = Path(paths["db_dir"]["path"])
    fixed_paths = {
        "root": path_record(root),
        "config_file": path_record(config_path),
        "api_keys_file": path_record(root / "api_keys.yaml"),
        "database_file": path_record(db_dir / "invokeai.db"),
    }

    return {
        "warning": (
            "Planning inventory only. CLI path overrides, service/container mounts, and launcher remapping "
            "may change effective runtime paths. Verify the actual process definition/runtime config."
        ),
        "root_source": root_source,
        "config_parser": config_parser,
        "fixed": fixed_paths,
        "configured_paths": paths,
        "path_sources": sources,
        "config_schema_version": config.get("schema_version"),
    }


def print_human(inventory: dict[str, Any]) -> None:
    print(f"WARNING: {inventory['warning']}")
    print(f"root source: {inventory['root_source']}")
    print("\nFixed paths:")
    for name, record in inventory["fixed"].items():
        print(f"  {name:<24} {record['path']} [{record['kind']}]")
    print("\nConfigured paths:")
    for name, record in inventory["configured_paths"].items():
        source = inventory["path_sources"][name]
        print(f"  {name:<24} {record['path']} [{record['kind']}; {source}]")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", help="Explicit InvokeAI root; otherwise mirror root discovery without CLI args")
    parser.add_argument("--config", help="Explicit invokeai.yaml path; default: <root>/invokeai.yaml")
    parser.add_argument("--json", action="store_true", help="Print machine-readable JSON")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        root_source = (
            "argument"
            if args.root is not None
            else "environment:INVOKEAI_ROOT"
            if os.environ.get("INVOKEAI_ROOT")
            else "environment:VIRTUAL_ENV-parent"
            if os.environ.get("VIRTUAL_ENV")
            else "default:~/invokeai"
        )
        root = Path(args.root).expanduser() if args.root else default_root()
        root = root.resolve(strict=False)
        config_path = Path(args.config).expanduser() if args.config else root / "invokeai.yaml"
        if not config_path.is_absolute():
            config_path = root / config_path
        config_path = config_path.resolve(strict=False)
        inventory = build_inventory(root, config_path, root_source)
        if args.json:
            print(json.dumps(inventory, indent=2, sort_keys=True))
        else:
            print_human(inventory)
        return 0
    except (OSError, RuntimeError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
