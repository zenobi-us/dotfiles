# Delegated agent delivery

Read this reference when the caller supplied an artifact-reference context.

## Parent procedure

1. Allocate a unique operation ID and approved result target before launch. Declare the expected domain schema. Resolve domain paths through the owning skill. Use the retained transport spool for read-only query results instead of creating a workflow history record.
2. Confirm that the parent and child can access the target. The current artifact backend uses a shared Linux filesystem. Do not infer access from a matching repository origin.
3. Pass the absolute context filename through RESULT_DELIVERY_CONTEXT. The muxer spawn router returns this context and the known result target. Keep that information; do not extract it from pane text.
4. Wait through the muxer completion contract. After a blocked signal, use its sequence when waiting again. Process completion does not validate the domain result.
5. Use the read command with the context to verify the envelope, expected schema, run ID, operation ID and payload hash. Apply the owning skill's source, receipt-chain and publication checks.
6. Pass the verified hash to ack only after those checks succeed. An acknowledgement is immutable. It does not delete the result or any domain receipt.

## Child procedure

Bind the context to the selected final operation before that operation can mutate state. Intermediate checks do not own this result slot. For ticket records, select --deliver or an explicit --delivery-context. Produce one domain object through the owner's operation. Call deliverResult with that object in the same command. The transport stores an immutable result envelope and returns a small reference. Do not post the same JSON in final chat.

For worktree child phase results, use the worktree scripts/write-result.ts command. It writes the authoritative YAML result and delivers the same object in one operation. Keep the existing event schema and parent validation. Do not use a transport record as a substitute for the event.

## Record contract

Context schema is result-delivery/v1, kind context. Required fields are audience and mode. Artifact mode requires runId, operationId and target with an absolute path, approved ref and expected domain schema. Artifact audience is agent. Human and machine contexts do not need a target.

The immutable transport record uses the same family, kind result. It binds the run, operation, reference, expected schema, canonical payload hash and unchanged domain object. A reference uses kind reference. Matching duplicate delivery succeeds without rewriting the record. Conflicting content or identity fails. Unknown context versions fail.

Write only to a caller-approved target with existing parent directories. Publication is atomic and exclusive. The parent validates the complete result before use. Result files remain outside transient muxer signal storage and survive terminal waits. An acknowledgement sidecar records acceptance; cleanup of an owned transport spool is a separate explicit action.

