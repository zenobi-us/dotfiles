# Delivery contracts

`contracts.json` declares one transport family with explicit record kinds. The authoritative JSON definitions are `contracts/delivery-v2.json` and `contracts/delivery-v1.json`. Shared consumers reference these files; they do not copy their definitions.

## Current and historical identities

New transport records use only `schemaVersion: result-delivery/v2`. The v1 reader accepts only `schema: result-delivery/v1`. Reject unknown versions, missing identifiers, both fields together, and a version under the wrong field. Loading a historical context returns a current in-memory context. It does not rewrite the source file.

| Boundary | Contract | Kind or content |
| --- | --- | --- |
| `route` | result-delivery/v2 | context |
| Assigned child context | result-delivery/v2 | context |
| Stored artifact | result-delivery/v2 | result |
| Artifact `emit` stdout | result-delivery/v2 | reference |
| `ack` stdout and new sidecar | result-delivery/v2 | acknowledgement |
| JSON `emit` and `read` stdout | Domain-owned | Unchanged domain result |
| Human `emit` stdout | Plain text | Short outcome and canonical references |

Transport acceptance does not validate domain content. The owner validates the domain result before delivery. Transport checks that exactly one domain identity field matches `target.schema`. It retains every domain field and computes SHA-256 over canonical JSON. `target.schema` and `resultSchema` describe the expected payload contract; they are not transport identity fields.

## Interpretation and storage

Contexts pair human/human, machine/json or agent/artifact-reference. Artifact contexts require a run ID, operation ID and target. Targets use absolute file paths, approved references and domain contract identifiers. The runtime rejects control characters, parent traversal, trailing directory separators, symlinks and non-regular input files. Parent directories must exist.

Envelopes bind the run, operation, approved reference, expected domain contract and payload hash. References and acknowledgements carry the same binding without the payload. Readers compare all binding fields and recompute the payload hash before use. `read --reference /absolute/reference.json` also verifies a current or historical reference against the assigned artifact. The library reader returns the original reference object without writing it.

## Immutable history and recovery

The manifest declares no upgrades. Context loading and historical reads do not grant conversion authority. There is no delivery bulk-conversion command. Do not relabel records, add a second identity field or change domain receipts during installation or recovery.

Matching duplicate delivery and acknowledgement can use retained v1 envelopes and sidecars. They compare validated content in memory, preserve stored bytes and return a current v2 reference or acknowledgement. A different payload, run, operation, reference or domain contract fails without replacement. An existing malformed record also fails. Read the existing result after interruption; do not repeat the domain mutation.

## Context examples

```json
{"schemaVersion":"result-delivery/v2","kind":"context","audience":"human","mode":"human"}
```

```json
{"schemaVersion":"result-delivery/v2","kind":"context","audience":"machine","mode":"json"}
```

```json
{"schemaVersion":"result-delivery/v2","kind":"context","audience":"agent","mode":"artifact-reference","runId":"run-1","operationId":"operation-1","target":{"path":"/absolute/existing/result.json","ref":"file:///absolute/existing/result.json","schema":"tracker-result/v2"}}
```

For a retained context, keep its existing `schema: result-delivery/v1` identity and target unchanged. Human format flags never remove an assigned artifact handoff.

