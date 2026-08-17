# Workflows, executable graphs, batches, and queue state

InvokeAI has two representations that are easy to conflate:

- **Saved/editor workflow**: UI-oriented document with node positions, form/exposed fields, metadata, and workflow edges.
- **Executable backend graph**: typed invocation nodes in a `nodes` map plus backend edges, accepted by the queue.

A saved workflow record is not automatically executable by posting it to the queue. Confirm how the installed frontend/backend converts it.

## Preferred workflow automation pattern

1. Build and validate a baseline workflow in the target UI.
2. Export/save it for the installed release.
3. Capture the executable graph produced by that release or reproduce its frontend graph-builder logic.
4. Deep-copy and patch only known node fields.
5. Validate node schemas and model keys against the target server.
6. Enqueue through the queue API.
7. Read terminal results from the completed queue item.

Hand-authoring a complex generation graph from memory is fragile.

## Backend graph contract

Current graph fundamentals:
- `nodes` is a map keyed by node ID; each node's internal `id` must match the map key
- each node has a discovered invocation `type`
- edges connect `source.node_id/field` to `destination.node_id/field`
- source output and destination input fields must exist and be compatible
- the declared graph must be acyclic
- iterate/collect behavior expands at runtime; normal graphs do not support arbitrary loops
- execution state stores prepared-node mappings, results, errors, and traversal state

Use OpenAPI node schemas from the target instance:

```bash
python scripts/invokeai-openapi.py --base-url "$base" nodes
python scripts/invokeai-openapi.py --base-url "$base" schema <InvocationClassName>
python scripts/invokeai-openapi.py --base-url "$base" schema InvocationOutputMap
```

## Minimal queue payload shape

Current conceptual shape:

```json
{
  "prepend": false,
  "batch": {
    "graph": {
      "id": "client-graph-id",
      "nodes": {},
      "edges": []
    },
    "runs": 1,
    "origin": "unique-client-origin",
    "destination": "optional-client-destination"
  }
}
```

The local OpenAPI schema is authoritative. The enqueue response currently contains `item_ids`; do not recursively scrape arbitrary numeric fields from the response.

A workflow document may also be attached to a batch for provenance/UI behavior, but it does not replace `batch.graph`.

## Queue execution state machine

```text
[enqueue_batch]
      |
      v
   pending
      |
      v
 in_progress <---------------------+
      |                             |
      +--> waiting -- child call ---+   (releases supporting saved-workflow calls)
      |
      +--> completed -> session.results -> image_name/value/etc.
      +--> failed ----> error_type + error_message + error_traceback
      +--> canceled
```

Treat `waiting` as nonterminal. Polling code that recognizes only `pending` and `in_progress` can fail on nested/called workflows.

On completion, results live in the queue item's `session.results`. There is no need to invent a separate session-fetch endpoint.

Prepared graphs may map an authored/source node ID to one or more prepared node IDs. When selecting a specific node result, account for `source_prepared_mapping`; do not assume the source node ID is always the key in `results`.

## Images and outputs

A typical image result contains:

```json
{
  "type": "image_output",
  "image": {"image_name": "...png"}
}
```

Download through the image API discovered from OpenAPI, commonly:

```text
GET /api/v1/images/i/{image_name}/full
GET /api/v1/images/i/{image_name}/thumbnail
```

These are API resources. Do not claim they are host filesystem paths. Physical placement depends on root/config and image subfolder strategy.

## Batch substitutions

Current batch model supports:
- `runs`
- collections of substitutions targeting `node_path` + `field_name`
- zipped groups where grouped substitution lists must have equal lengths
- cartesian expansion across ungrouped groups

Before enqueuing a large batch:
1. calculate expected session count
2. compare with queue limits/free capacity
3. set a unique `origin` and meaningful `destination`
4. plan cancellation/retry semantics
5. avoid materializing a huge cartesian product accidentally

Use local `Batch`, `BatchDatum`, and enqueue schemas; the nesting is easy to get wrong.

## Saved workflows API

Current workflow records are available under `/api/v1/workflows`. Operations include create, list, get, update, delete, tags, visibility, and thumbnails. Multi-user mode applies ownership/public-access rules.

For external clients:
- fetching a saved workflow does not prove the queue accepts it directly
- editor workflow nodes may include frontend-only connector/layout behavior
- the frontend graph builder is often the clearest implementation reference for the same release
- export important workflows before upgrades or destructive edits

## Calling saved workflows

Newer source contains `call_saved_workflow`, explicit workflow return nodes, parent/child queue rows, a `waiting` status, depth limits, and compatibility checks. This area is actively evolving.

Before using it:
- verify the node schemas exist in local OpenAPI
- inspect workflow compatibility metadata from the local workflow API
- require one supported explicit workflow return contract where the release requires it
- test cancellation, batching, nesting, and return aggregation on the installed version

Do not backport current-main behavior into an older local release by assumption.

## Graph debugging order

1. Confirm every node type exists in local OpenAPI.
2. Confirm each node's required fields and defaults.
3. Confirm model keys exist and fit loader fields.
4. Confirm edge fields/types and node IDs.
5. Validate graph DAG constraints.
6. Enqueue a one-run graph with unique origin.
7. Fetch the terminal queue item.
8. Read `error_type`, `error_message`, `error_traceback`, and session state.
9. Reduce to the smallest failing subgraph.
10. Compare with the frontend-generated graph for the same operation.

Never “fix” a graph by deleting unknown fields until their purpose is understood.

## Source references for frontend contributors

- `invokeai/frontend/web/src/features/nodes/util/graph/` — graph construction
- `invokeai/frontend/web/src/features/nodes/util/graph/buildLinearBatchConfig.ts` — batch shape
- `invokeai/frontend/web/src/services/api/run-graph.ts` — race-safe enqueue/event/result pattern
- `invokeai/frontend/web/src/services/api/endpoints/queue.ts` — generated API integration
- `invokeai/frontend/web/src/services/api/schema.ts` — generated local schema snapshot in the checkout

## Primary sources

Verified against InvokeAI main commit `68b90174aafebbbba45d14b049fb6852271c76a8`:

- [Workflow execution API guide](https://invoke-ai.github.io/InvokeAI/development/guides/workflow-api/)
- [`graph.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/services/shared/graph.py)
- [`session_queue.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/api/routers/session_queue.py)
- [`session_queue_common.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/services/session_queue/session_queue_common.py)
- [`run-graph.ts`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/frontend/web/src/services/api/run-graph.ts)
- [`workflows.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/api/routers/workflows.py)
