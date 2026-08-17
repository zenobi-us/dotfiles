#!/usr/bin/env python3
"""Inspect a live InvokeAI server's OpenAPI document without third-party packages."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

HTTP_METHODS = {"get", "post", "put", "patch", "delete", "head", "options", "trace"}


class InvokeAIHTTPError(RuntimeError):
    pass


def parse_header(raw: str) -> tuple[str, str]:
    if ":" not in raw:
        raise argparse.ArgumentTypeError("header must be 'Name: value'")
    name, value = raw.split(":", 1)
    name = name.strip()
    value = value.strip()
    if not name:
        raise argparse.ArgumentTypeError("header name must not be empty")
    return name, value


def build_headers(args: argparse.Namespace) -> dict[str, str]:
    headers = {"Accept": "application/json"}
    token = args.token or os.environ.get("INVOKEAI_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    for name, value in args.header:
        headers[name] = value
    return headers


def request_json(base_url: str, path: str, headers: dict[str, str], timeout: float) -> Any:
    url = f"{base_url.rstrip('/')}/{path.lstrip('/')}"
    request = Request(url, headers=headers)
    try:
        with urlopen(request, timeout=timeout) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            return json.loads(response.read().decode(charset))
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise InvokeAIHTTPError(f"GET {url} -> HTTP {exc.code}: {body[:1000]}") from exc
    except URLError as exc:
        raise InvokeAIHTTPError(f"GET {url} failed: {exc.reason}") from exc
    except json.JSONDecodeError as exc:
        raise InvokeAIHTTPError(f"GET {url} did not return JSON: {exc}") from exc


def load_schema(args: argparse.Namespace, headers: dict[str, str]) -> dict[str, Any]:
    if args.schema_file:
        data = json.loads(Path(args.schema_file).read_text(encoding="utf-8"))
    else:
        data = request_json(args.base_url, "/openapi.json", headers, args.timeout)
    if not isinstance(data, dict) or not isinstance(data.get("paths"), dict):
        raise ValueError("OpenAPI document must be an object containing a paths object")
    return data


def dump_json(value: Any) -> None:
    print(json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False))


def route_records(schema: dict[str, Any]) -> Iterable[dict[str, Any]]:
    global_security = schema.get("security")
    for path, path_item in sorted(schema.get("paths", {}).items()):
        if not isinstance(path_item, dict):
            continue
        for method, operation in path_item.items():
            if method.lower() not in HTTP_METHODS or not isinstance(operation, dict):
                continue
            security = operation.get("security", global_security)
            if security == []:
                auth = "no"
            elif security:
                auth = "yes"
            else:
                auth = "unspecified"
            yield {
                "method": method.upper(),
                "path": path,
                "operation_id": operation.get("operationId", ""),
                "summary": operation.get("summary") or operation.get("description", "").split("\n", 1)[0],
                "tags": operation.get("tags", []),
                "auth": auth,
                "operation": operation,
            }


def text_matches(query: str | None, *values: Any) -> bool:
    if not query:
        return True
    haystack = " ".join(json.dumps(value, ensure_ascii=False) if not isinstance(value, str) else value for value in values)
    return query.casefold() in haystack.casefold()


def command_probe(args: argparse.Namespace, headers: dict[str, str], schema: dict[str, Any]) -> None:
    info = schema.get("info", {})
    output: dict[str, Any] = {
        "base_url": None if args.schema_file else args.base_url.rstrip("/"),
        "schema_file": args.schema_file,
        "openapi": schema.get("openapi"),
        "title": info.get("title"),
        "schema_version": info.get("version"),
        "path_count": len(schema.get("paths", {})),
        "schema_count": len(schema.get("components", {}).get("schemas", {})),
    }
    if not args.schema_file:
        for key, path in (
            ("app_version", "/api/v1/app/version"),
            ("auth_status", "/api/v1/auth/status"),
        ):
            try:
                output[key] = request_json(args.base_url, path, headers, args.timeout)
            except InvokeAIHTTPError as exc:
                output[key] = {"error": str(exc)}
    dump_json(output)


def command_routes(args: argparse.Namespace, schema: dict[str, Any]) -> None:
    records = []
    for record in route_records(schema):
        if args.method and record["method"] != args.method.upper():
            continue
        if args.tag and args.tag.casefold() not in {str(tag).casefold() for tag in record["tags"]}:
            continue
        if not text_matches(
            args.query,
            record["method"],
            record["path"],
            record["operation_id"],
            record["summary"],
            record["tags"],
        ):
            continue
        records.append({key: value for key, value in record.items() if key != "operation"})
    if args.json:
        dump_json(records)
        return
    for record in records:
        tags = ",".join(record["tags"])
        print(
            f"{record['method']:<7} {record['path']:<60} "
            f"op={record['operation_id'] or '-'} tags={tags or '-'} auth={record['auth']}"
        )


def get_schemas(schema: dict[str, Any]) -> dict[str, Any]:
    schemas = schema.get("components", {}).get("schemas", {})
    return schemas if isinstance(schemas, dict) else {}


def command_schemas(args: argparse.Namespace, schema: dict[str, Any]) -> None:
    records = []
    for name, value in sorted(get_schemas(schema).items()):
        if not text_matches(args.query, name, value):
            continue
        if args.full:
            records.append({"name": name, "schema": value})
        else:
            records.append(
                {
                    "name": name,
                    "title": value.get("title", "") if isinstance(value, dict) else "",
                    "type": value.get("type", "") if isinstance(value, dict) else "",
                }
            )
    if args.json or args.full:
        dump_json(records)
        return
    for record in records:
        print(f"{record['name']:<64} type={record['type'] or '-'} title={record['title'] or '-'}")


def invocation_type(value: Any) -> str | None:
    if not isinstance(value, dict):
        return None
    properties = value.get("properties")
    if not isinstance(properties, dict):
        return None
    type_schema = properties.get("type")
    if not isinstance(type_schema, dict):
        return None
    candidate = type_schema.get("const", type_schema.get("default"))
    return candidate if isinstance(candidate, str) and candidate else None


def command_nodes(args: argparse.Namespace, schema: dict[str, Any]) -> None:
    records = []
    output_map = get_schemas(schema).get("InvocationOutputMap", {})
    output_properties = output_map.get("properties", {}) if isinstance(output_map, dict) else {}
    for name, value in sorted(get_schemas(schema).items()):
        node_type = invocation_type(value)
        if not node_type:
            continue
        output = value.get("output") if isinstance(value, dict) else None
        if not output and isinstance(output_properties, dict):
            output = output_properties.get(node_type)
        if not output:
            continue
        record = {
            "node_type": node_type,
            "schema": name,
            "title": value.get("title", "") if isinstance(value, dict) else "",
            "output": output,
        }
        if text_matches(args.query, record, value):
            records.append(record)
    records.sort(key=lambda item: item["node_type"])
    if args.json:
        dump_json(records)
        return
    for record in records:
        output = record["output"]
        output_text = output.get("$ref", "") if isinstance(output, dict) else str(output or "")
        print(
            f"{record['node_type']:<42} schema={record['schema']:<54} "
            f"output={output_text or '-'}"
        )


def command_operation(args: argparse.Namespace, schema: dict[str, Any]) -> None:
    method = args.method.lower()
    path_item = schema.get("paths", {}).get(args.path)
    if not isinstance(path_item, dict) or not isinstance(path_item.get(method), dict):
        candidates = [
            f"{record['method']} {record['path']}"
            for record in route_records(schema)
            if text_matches(args.path, record["path"], record["operation_id"])
        ]
        message = f"operation not found: {args.method.upper()} {args.path}"
        if candidates:
            message += "\nCandidates:\n  " + "\n  ".join(candidates[:20])
        raise KeyError(message)
    dump_json(path_item[method])


def command_schema(args: argparse.Namespace, schema: dict[str, Any]) -> None:
    schemas = get_schemas(schema)
    if args.name not in schemas:
        candidates = [name for name in schemas if args.name.casefold() in name.casefold()]
        message = f"schema not found: {args.name}"
        if candidates:
            message += "\nCandidates: " + ", ".join(candidates[:30])
        raise KeyError(message)
    dump_json(schemas[args.name])


def command_save(args: argparse.Namespace, schema: dict[str, Any]) -> None:
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(schema, indent=2, sort_keys=True, ensure_ascii=False) + "\n", encoding="utf-8")
    print(output)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--base-url",
        default=os.environ.get("INVOKEAI_URL", "http://127.0.0.1:9090"),
        help="InvokeAI public base URL, including any reverse-proxy subpath",
    )
    parser.add_argument("--schema-file", help="Read an OpenAPI JSON file instead of contacting a server")
    parser.add_argument("--token", help="Bearer token; prefer INVOKEAI_TOKEN to avoid shell history")
    parser.add_argument("--header", action="append", type=parse_header, default=[], help="Additional 'Name: value' header")
    parser.add_argument("--timeout", type=float, default=10.0, help="HTTP timeout in seconds (default: 10)")

    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("probe", help="Show app/auth/OpenAPI summary")

    routes = subparsers.add_parser("routes", help="List/filter REST operations")
    routes.add_argument("query", nargs="?", help="Case-insensitive search across path, operation ID, summary, and tags")
    routes.add_argument("--method", choices=sorted(method.upper() for method in HTTP_METHODS))
    routes.add_argument("--tag")
    routes.add_argument("--json", action="store_true")

    schemas = subparsers.add_parser("schemas", help="List/filter component schemas")
    schemas.add_argument("query", nargs="?")
    schemas.add_argument("--full", action="store_true", help="Print full matching schema objects")
    schemas.add_argument("--json", action="store_true")

    nodes = subparsers.add_parser("nodes", help="List invocation/node types discovered in component schemas")
    nodes.add_argument("query", nargs="?")
    nodes.add_argument("--json", action="store_true")

    operation = subparsers.add_parser("operation", help="Print one REST operation object")
    operation.add_argument("method", choices=sorted(method.upper() for method in HTTP_METHODS))
    operation.add_argument("path", help="Exact OpenAPI path template")

    component = subparsers.add_parser("schema", help="Print one component schema")
    component.add_argument("name")

    save = subparsers.add_parser("save", help="Save normalized OpenAPI JSON")
    save.add_argument("output")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        headers = build_headers(args)
        schema = load_schema(args, headers)
        if args.command == "probe":
            command_probe(args, headers, schema)
        elif args.command == "routes":
            command_routes(args, schema)
        elif args.command == "schemas":
            command_schemas(args, schema)
        elif args.command == "nodes":
            command_nodes(args, schema)
        elif args.command == "operation":
            command_operation(args, schema)
        elif args.command == "schema":
            command_schema(args, schema)
        elif args.command == "save":
            command_save(args, schema)
        else:
            parser.error(f"unknown command: {args.command}")
        return 0
    except (InvokeAIHTTPError, OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
