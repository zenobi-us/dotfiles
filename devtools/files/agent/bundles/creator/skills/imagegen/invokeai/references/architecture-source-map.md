# Architecture and source map

Use this when tracing behavior or changing InvokeAI source. Start from the application boundary, then follow services and runtime state. Do not jump directly into model implementation code for API/queue/storage bugs.

Research baseline: InvokeAI main commit `68b90174aafebbbba45d14b049fb6852271c76a8`. Local checkout/version remains authoritative.

## System flow

```text
Browser / external client
        |
        +--> FastAPI REST (`invokeai/app/api_app.py`, `/api/...`)
        |
        +--> Socket.IO (`invokeai/app/api/sockets.py`, `/ws/socket.io`)
        |
        v
API dependencies / Invoker
        |
        +--> session queue (durable SQLite rows)
        +--> session processor / workflow-call lifecycle
        +--> workflow/model/image/board/user services
        +--> event service
        |
        v
GraphExecutionState
        |
        v
Invocation (`invokeai/app/invocations/*`)
        |
        v
InvocationContext service interfaces
        |
        +--> model install/load/cache
        +--> image/object storage
        +--> DB records
        +--> external providers
        +--> logs/events
```

## Backend map

| Area | Primary paths | Responsibility |
|---|---|---|
| App startup | `invokeai/app/run_app.py`, `invokeai/app/api_app.py` | Parse/start server, initialize dependencies, routers, middleware, docs, UI |
| REST routes | `invokeai/app/api/routers/` | Version/config, auth, queue, models, images, boards, workflows, custom nodes |
| Authentication | `invokeai/app/api/auth_dependencies.py`, `routers/auth.py` | Single/multi-user dependency and role enforcement |
| Socket events | `invokeai/app/api/sockets.py` | Queue/model/workflow events and user/admin room routing |
| Config | `invokeai/app/services/config/config_default.py` | Root discovery, source precedence, paths, runtime settings, migrations |
| Dependency assembly | `invokeai/app/api/dependencies.py` | Construct services and invoker |
| Invoker | `invokeai/app/services/invoker.py` | Application-facing service aggregate |
| Graph runtime | `invokeai/app/services/shared/graph.py` | Graph validation, execution state, traversal, results |
| Queue | `invokeai/app/services/session_queue/` | Batch expansion, durable queue rows, status/cancel/retry/prune |
| Processor | `invokeai/app/services/session_processor/` | Run queue sessions and saved-workflow child calls |
| Events | `invokeai/app/services/events/` | Typed application/runtime events |
| Invocations | `invokeai/app/invocations/` | Built-in typed workflow nodes |
| Public node API | `invokeai/invocation_api/__init__.py` | Supported imports for custom nodes |
| Custom-node loader | `invokeai/app/invocations/load_custom_nodes.py` | Load top-level node packs from configured directory |
| Workflow records | `invokeai/app/services/workflow_records/` | Saved workflow persistence/access |
| Images | `invokeai/app/services/images/`, `image_records/`, `image_files/` | Coupled image records/files and operations |
| Models | `invokeai/app/services/model_*`, `invokeai/backend/model_manager/` | Model records, install, identification, load/cache |
| DB migrations | `invokeai/app/services/shared/sqlite_migrator/` | SQLite schema evolution |
| AI implementations | `invokeai/backend/` | Model families, schedulers, image tools, loading |

## Frontend map

| Area | Primary paths | Responsibility |
|---|---|---|
| App | `invokeai/frontend/web/src/app/` | Store, middleware, startup |
| Generated API | `invokeai/frontend/web/src/services/api/` | OpenAPI-derived schema/types/endpoints |
| Graph construction | `invokeai/frontend/web/src/features/nodes/util/graph/` | Convert UI state/workflows into backend graphs/batches |
| Graph runner | `invokeai/frontend/web/src/services/api/run-graph.ts` | Enqueue, correlate events, cancel, fetch results |
| Queue UI | `invokeai/frontend/web/src/features/queue/` | Enqueue workflows/generation/canvas and queue state |
| Model Manager | `invokeai/frontend/web/src/features/modelManagerV2/` | Model records/install/config UI |
| Workflow editor | `invokeai/frontend/web/src/features/nodes/` | Editor node state, validation, forms, exposed fields |
| Canvas | `invokeai/frontend/web/src/features/controlLayers/` | Canvas project/workflow integration |

When backend schema changes, generated frontend schema/types and graph builders may also need updates.

## Core domain boundaries

### Workflow record vs graph execution

```text
Workflow editor JSON
   -> frontend graph builder
      -> Batch(graph + optional workflow provenance)
         -> session queue
            -> GraphExecutionState/prepared graph
               -> invocations/results
```

### Model lifecycle

```text
source/path/URL/HF
   -> install/probe/hash
      -> model record (SQLite)
         -> loader/cache
            -> invocation context
```

### Image lifecycle

```text
PIL/tensor result
   -> context.images.save()
      -> file store + image record + board/metadata links
         -> image API/gallery
```

Direct writes around these boundaries create inconsistent state.

## Tracing recipes

### API request to implementation

1. Find path/operation ID in local OpenAPI.
2. Locate router in `invokeai/app/api/routers/`.
3. Follow `ApiDependencies.invoker.services.<service>`.
4. Inspect service interface/base before implementation.
5. Follow events/DB/files as needed.
6. Find mirrored tests.

### Queue item failure

1. `routers/session_queue.py`
2. `services/session_queue/session_queue_common.py` data models
3. `session_queue_sqlite.py` persistence/state changes
4. `session_processor_default.py` execution
5. `shared/graph.py` scheduling/results
6. target invocation
7. invocation-context service used by that node

### Workflow/editor mismatch

1. saved workflow API/record schema
2. frontend workflow state and graph builder
3. generated `services/api/schema.ts`
4. backend invocation schema in OpenAPI
5. graph validation/preparation

### Model problem

1. model API record/job
2. `model_install` or `model_records`
3. backend config factory/identification
4. model loader/cache
5. model-family invocation

## Static analysis commands

From an InvokeAI checkout:

```bash
cm stats invokeai
cm map invokeai/app --limit 200 --format ai
cm query <Symbol> invokeai --show-body --format ai
cm callers <Symbol> invokeai --format ai
cm tests <Symbol> --format ai
```

Use LSP definitions/references where the project environment is configured. Use text search for route decorators, config strings, errors, and generated schema paths.

## Documentation map

Repository docs of highest value:
- `docs/src/content/docs/configuration/invokeai-yaml.mdx`
- `docs/src/content/docs/development/Architecture/overview.mdx`
- `docs/src/content/docs/development/Architecture/invocations.mdx`
- `docs/src/content/docs/development/Architecture/model-manager.mdx`
- `docs/src/content/docs/development/Guides/workflow-api.mdx`
- `docs/src/content/docs/development/Guides/creating-node-pack.mdx`
- `docs/src/content/docs/features/Multi-User Mode/api-guide.mdx`
- `docs/src/content/docs/development/Setup/dev-environment.mdx`

Read comments that reference architecture docs before modifying the related code.

## Testing map

- Backend: `pytest`; fast tests are default/not `slow`
- Frontend: `vitest`
- Backend tests live under `tests/`, imperfectly mirroring source
- Queue/graph/runtime changes require state transition, cancellation, restart, and error-path tests
- API changes require OpenAPI/generated-client impact checks
- Node schema changes require workflow compatibility consideration
- DB changes require migrations and upgrade-path tests

Typical backend commands:

```bash
pytest path/to/focused_test.py -q
pytest tests/ -m 'not slow'
pytest tests/ --cov
```

## Architecture review questions

Before editing:
- Which boundary owns this state: frontend workflow, queue session, service record, or filesystem?
- Is there an abstract service interface that must remain implementation-independent?
- Will this change alter OpenAPI or generated frontend types?
- Does it change durable DB state and require migration?
- Does it affect multi-user ownership/redaction?
- Does it change queue cancellation/retry/restart semantics?
- Can a custom node use the public invocation API instead of a private import?

## Primary sources

- [Architecture overview](https://invoke-ai.github.io/InvokeAI/development/architecture/overview/)
- [`api_app.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/api_app.py)
- [`graph.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/services/shared/graph.py)
- [`invocation_context.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/services/shared/invocation_context.py)
- [`dependencies.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/api/dependencies.py)
