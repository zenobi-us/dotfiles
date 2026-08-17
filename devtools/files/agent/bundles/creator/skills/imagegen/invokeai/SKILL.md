---
name: invokeai
description: Operates, automates, extends, and troubleshoots a local InvokeAI instance. Use when working with InvokeAI installation, invokeai.yaml, models, workflows, graphs, queue APIs, OpenAPI, Socket.IO events, outputs, backups, upgrades, multi-user security, custom nodes, or InvokeAI source code, resulting in version-checked and reversible changes instead of guessed endpoints, paths, or node schemas.
---

# InvokeAI Local Instance

Work from facts reported by the target installation. InvokeAI's endpoints, node schemas, model support, configuration, and workflow conversion change between releases.

## Mandatory first move

Read [discover-instance.md](references/discover-instance.md) before giving exact commands, payloads, paths, or code unless the user already supplied equivalent evidence.

Do not guess:
- InvokeAI version or install type
- root/config location or active CLI/environment overrides
- REST paths, request bodies, auth mode, or Socket.IO event payloads
- invocation/node types, fields, model keys, or workflow format
- filesystem paths represented by image API records

## Task router

| Task | Read |
|---|---|
| Discover version, root, auth mode, API, hardware, or install facts | [discover-instance.md](references/discover-instance.md) |
| Install, update, launch, stop, or work on an InvokeAI source checkout | [install-update-develop.md](references/install-update-develop.md) |
| Edit `invokeai.yaml`, move storage, back up, restore, or migrate data | [configure-storage-backup.md](references/configure-storage-backup.md) |
| List, install, import, register, move, convert, or delete models | [models.md](references/models.md) |
| Build, patch, validate, export, enqueue, or debug workflows and graphs | [workflows-and-graphs.md](references/workflows-and-graphs.md) |
| Write API clients, inspect OpenAPI, authenticate, poll queues, or use Socket.IO | [api-automation.md](references/api-automation.md) |
| Create, package, test, install, or debug custom nodes/node packs | [custom-nodes.md](references/custom-nodes.md) |
| Diagnose startup, queue, graph, model, database, output, OOM, or performance failures | [troubleshooting.md](references/troubleshooting.md) |
| Expose InvokeAI to a network, enable multi-user mode, or handle credentials | [security-and-multiuser.md](references/security-and-multiuser.md) |
| Trace source code or understand backend/frontend boundaries | [architecture-source-map.md](references/architecture-source-map.md) |

## Global operating rules

1. **Local schema wins.** Inspect `GET /api/v1/app/version` and `/openapi.json` before hard-coding API or node details.
2. **Effective configuration wins.** CLI args override environment variables; environment variables override `invokeai.yaml`; defaults are last.
3. **Saved workflow is not automatically an executable graph.** The queue executes a backend graph. Confirm the conversion path for the installed release.
4. **Use model keys and discovered node types.** Display names, example filenames, and stale workflow JSON are not reliable identifiers.
5. **Copy, verify, cut over, then delete.** Never make storage migration or upgrade depend on an unverified move.
6. **Stop the app before filesystem-level database/root migration.** Preserve the complete database directory and verify SQLite integrity.
7. **Prefer API records over direct database edits.** The database couples workflows, boards, images, model records, users, and queue state.
8. **Treat node packs as arbitrary Python code.** Review before installing; restart after node definition changes.
9. **Loopback is the safe default.** Binding to `0.0.0.0` without authentication, TLS, and network controls exposes the instance.
10. **Verify the requested outcome.** Check API response, logs, queue terminal state, output/model/workflow record, and filesystem state where relevant.

## API hard stops

For an exact API script, first inspect the live OpenAPI document or require the user to supply it. If discovery cannot run, provide a schema-inspection scaffold rather than guessed endpoints/payloads.

For current queue execution:
- read enqueue IDs only from the documented `item_ids` field
- poll the queue item and treat `pending`, `in_progress`, and `waiting` as nonterminal
- read completed outputs from that queue item's `session.results`
- **never invent or call `/api/v1/sessions/{session_id}`**
- do not recursively scrape arbitrary `item_id`, `id`, or `image_name` fields

## Deterministic helpers

Run from this skill directory:

```bash
python scripts/invokeai-openapi.py --base-url http://127.0.0.1:9090 probe
python scripts/invokeai-openapi.py --base-url http://127.0.0.1:9090 routes queue
python scripts/invokeai-openapi.py --base-url http://127.0.0.1:9090 nodes flux
python scripts/invokeai-root-inventory.py --root ~/invokeai
```

Read the script help before adapting commands. The OpenAPI helper is authoritative for the live server. The root inventory helper reads YAML/environment path settings only and cannot see arbitrary launch-time CLI overrides.

## Baseline failure this skill prevents

Without local discovery, agents commonly:
- invent a `/sessions/{id}` endpoint instead of reading results from the completed queue item
- submit saved editor workflow JSON where an executable graph is required
- assume `~/invokeai` while a launcher, container, service, or `INVOKEAI_ROOT` uses another root
- put a node implementation directly in `nodes/<name>/__init__.py` without a proper importable node pack
- move only output files and lose workflow/board/model registry state stored in SQLite
