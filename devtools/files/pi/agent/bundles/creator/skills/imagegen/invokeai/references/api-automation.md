# API automation

Use the live server's OpenAPI document as the contract. Repository examples and generated clients are secondary evidence because local releases and custom nodes differ.

## Inspect before coding

```bash
base=${INVOKEAI_URL:-http://127.0.0.1:9090}

python scripts/invokeai-openapi.py --base-url "$base" probe
python scripts/invokeai-openapi.py --base-url "$base" routes queue
python scripts/invokeai-openapi.py --base-url "$base" operation POST '/api/v1/queue/{queue_id}/enqueue_batch'
python scripts/invokeai-openapi.py --base-url "$base" schema Batch
python scripts/invokeai-openapi.py --base-url "$base" nodes
```

Swagger and raw schema are normally available at:
- `/docs`
- `/redoc`
- `/openapi.json`

A configured reverse-proxy subpath must be part of the base URL.

## Authentication

Single-user mode:
- no token required
- all requests act as the system administrator
- unsafe to expose beyond trusted loopback/network boundaries

Multi-user mode:
- login through the local `/api/v1/auth/login` schema
- send `Authorization: Bearer <token>`
- normal/admin authorization and ownership rules apply
- Socket.IO authentication also requires the token

Current login body concept:

```json
{
  "email": "user@example.com",
  "password": "...",
  "remember_me": false
}
```

Do not log tokens. Accept them from an environment variable or secret store. Current source may refresh a token in `X-Refreshed-Token` after successful mutating requests; clients should preserve it if the installed release documents/exposes that behavior.

The helper accepts:

```bash
INVOKEAI_TOKEN=... python scripts/invokeai-openapi.py --base-url "$base" probe
# or arbitrary headers:
python scripts/invokeai-openapi.py --base-url "$base" --header 'Authorization: Bearer ...' routes
```

## Execute a graph by polling

Current request flow:

1. Submit `POST /api/v1/queue/{queue_id}/enqueue_batch`.
2. Read exact `item_ids` from the enqueue response.
3. Poll `GET /api/v1/queue/{queue_id}/i/{item_id}`.
4. Continue through `pending`, `in_progress`, and `waiting`.
5. On `completed`, read `session.results`.
6. On `failed`, report `error_type`, `error_message`, and `error_traceback`.
7. On `canceled`, stop cleanly.

Pseudocode:

```python
response = request("POST", enqueue_url, json=payload)
item_id = response["item_ids"][0]

while True:
    item = request("GET", item_url(item_id))
    match item["status"]:
        case "pending" | "in_progress" | "waiting":
            sleep(poll_interval)
        case "completed":
            results = item["session"]["results"]
            break
        case "failed":
            raise InvokeFailure(
                item.get("error_type"),
                item.get("error_message"),
                item.get("error_traceback"),
            )
        case "canceled":
            raise InvokeCanceled(item_id)
        case other:
            raise RuntimeError(f"Unknown queue status: {other}")
```

Set:
- finite HTTP connect/read timeouts
- an overall job timeout appropriate to model/hardware
- bounded backoff or fixed polling interval
- cancellation behavior on client abort/timeout
- a unique `origin` and optional `destination` for correlation

Do not fabricate a `/sessions/{session_id}` request. The completed queue item contains the execution session and results.

## Read a specific node result

Prepared execution may transform/expand authored nodes. Current execution state exposes `source_prepared_mapping`.

```python
prepared_ids = session["source_prepared_mapping"].get(source_node_id, [])
if not prepared_ids:
    raise KeyError(f"No prepared node for {source_node_id}")
result = session["results"].get(prepared_ids[0])
```

Iterate nodes may map one source node to multiple prepared nodes. Decide whether one or all results are expected.

For generic image collection, traverse result objects carefully and collect explicit `image.image_name` fields; avoid recursive “any key named image” parsing that can mix inputs, progress previews, and final outputs.

## Socket.IO pattern

Current server mounts Socket.IO at `/ws/socket.io` and uses events such as `subscribe_queue` with `{"queue_id":"default"}`. Exact events/payloads are included in the custom OpenAPI schemas and source for the installed release.

Race-safe pattern:
1. create a unique `origin`
2. connect/authenticate the socket
3. subscribe to queue events before enqueueing
4. enqueue with that origin
5. filter terminal status events by origin/user/item
6. fetch the terminal queue item over REST for authoritative results
7. unsubscribe/close on every exit path

Why: a fast graph can finish before the enqueue response returns. Subscribing after enqueue may miss its terminal event.

Polling remains the simpler baseline and recovery mechanism.

## Images, workflows, models, boards

Discover routes by tag/keyword:

```bash
python scripts/invokeai-openapi.py --base-url "$base" routes images
python scripts/invokeai-openapi.py --base-url "$base" routes workflows
python scripts/invokeai-openapi.py --base-url "$base" routes model
python scripts/invokeai-openapi.py --base-url "$base" routes boards
```

Use API records, pagination, ownership, and response models. Do not bypass through SQLite for normal automation.

Image download commonly uses `/api/v1/images/i/{image_name}/full`; treat it as a URL resource, not a filesystem path.

## Error handling

Handle separately:
- transport/connect/timeout failures
- 401 token missing/expired
- 403 ownership/admin failure
- 404 stale IDs/keys/routes
- 409 conflicts/duplicate model state
- 415 unsupported model format
- 422 schema validation failure
- 5xx server/invocation failure
- terminal queue `failed` with execution traceback

Always retain response status and body. FastAPI validation errors usually identify the exact path into the rejected payload.

Do not retry mutating requests blindly. An enqueue/install may have succeeded server-side before the client lost the response. Reconcile through origin, destination, job list, or queue/model records first.

## Generated clients

Generating a client from the local OpenAPI schema is valid:

```bash
curl --fail-with-body "$base/openapi.json" > invokeai-openapi.json
openapi-generator generate -i invokeai-openapi.json -g python -o invokeai-client
```

Regenerate when the server version or node packs change. Review generated auth, nullable fields, unions, and custom invocation schemas before use.

## API client verification

Test in this order:
1. version/auth status
2. OpenAPI retrieval
3. harmless list endpoint
4. minimal math/string graph without model dependency
5. small image graph using a known installed model
6. cancellation and failure paths
7. multi-user ownership/admin cases if enabled
8. reconnect/restart behavior

## Primary sources

Verified against InvokeAI main commit `68b90174aafebbbba45d14b049fb6852271c76a8`:

- [Workflow execution API](https://invoke-ai.github.io/InvokeAI/development/guides/workflow-api/)
- [Multi-user API guide](https://invoke-ai.github.io/InvokeAI/features/multi-user-mode/api-guide/)
- [`api_app.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/api_app.py)
- [`session_queue.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/api/routers/session_queue.py)
- [`sockets.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/api/sockets.py)
- [`custom_openapi.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/util/custom_openapi.py)
- [`run-graph.ts`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/frontend/web/src/services/api/run-graph.ts)
