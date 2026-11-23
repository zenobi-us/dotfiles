# Safe contract upgrades

## Public commands

Authorize the owner operation first. Then invoke the absolute installed router. Artifact, request, and list paths resolve from the caller directory. The owner module resolves from the installed skill directory.

```sh
"$SKILL_CONTRACTS_ROOT/scripts/router.ts" safe-upgrade --skill /installed/owner --owner file:scripts/owner.ts --artifact /records/note.json --operation rename --request /requests/rename.json
"$SKILL_CONTRACTS_ROOT/scripts/router.ts" bulk-upgrade --skill /installed/owner --owner file:scripts/owner.ts --artifacts /requests/selected-paths.json
```

The request file contains the owner's JSON mutation request. The bulk list is a JSON array of distinct artifact paths. Use operation upgrade for explicit single-file conversion without mutation. Other operation names call the owner's mutation only after safe conversion. Unknown operations must fail in the owner adapter.

Single-file results report status, artifact, changed, from, and to. Pre-commit rejection returns nonzero without a result object. If cleanup fails after a commit, the result retains the actual changed value, sets status failed, lists cleanup_errors, and returns nonzero. A failed cleanup never claims that committed bytes remained unchanged. Bulk reports each completed or failed item and actual changed values. Overall status is completed, partial, or failed. Partial and failed return nonzero. Bulk commits independently per item; it does not roll back earlier successes. A current valid artifact reports changed false without reformatting.

## Owner adapter

Export one default object implementing UpgradeOwner from scripts/upgrades.ts. Hooks may be asynchronous. This is trusted installed executable code, not untrusted artifact code. Hooks must be pure: they return content and must not write artifacts, perform external mutations, or change other state. The shared operation owns persistence. A requested mutation must fit one artifact; multi-file or external side effects need an owner-specific transaction outside this API.

| Hook | Required behavior |
| --- | --- |
| identify(content) | Return the explicit contract string. Return null only when the identifier is absent. Reject malformed explicit fields, including null values. |
| detectLegacy(content) | Return explicit matching supported source identifiers. Called only for absent identifiers. Zero, duplicate, multiple, or unsupported matches fail. |
| validate(contract, content) | Validate structure and meaning against that exact contract. Return true only for valid content. Accept legacy shape only for its detected contract. |
| preservation(contract, content) | Return a defined canonical value containing all meaning and authored content, including unknown properties, text, ordering where meaningful, and metadata. Compare source and destination under their respective contracts. Never use a constant, undefined, or omit authored data. |
| mutable(path, content) | Return true only for owner-authorized mutable artifacts. Refuse immutable paths and content, especially events, receipts, and historical evidence. |
| destinations(operation) | Return distinct operation-appropriate identifiers from produces. Input acceptance does not select an output. |
| convert(procedure, from, to, content) | Execute only the named declared procedure and endpoints. Return content, lossless: true, requiresDecision: false only when conversion is safe. Otherwise stop or return the unsafe flags. |
| mutate(operation, contract, content, request) | Apply the authorized request to converted content. Return content under the same destination contract. Validate all request fields. |

The shared layer resolves the complete manifest before loading the adapter. It passes the exact declared procedure reference to convert. It never executes historical Git blobs. Installed owner code may implement a resolved pinned procedure, but must check its exact reference and endpoints. The adapter is not a sandbox; it and its validators remain the contract owner's responsibility.

Source identifiers must appear in accepts. Intermediate upgrade endpoints need authoritative definitions and owner validation; acceptance does not authorize undeclared edges. Select one reachable destination and one path among the owner's operation destinations. No path or multiple paths stop conversion. Numeric version order has no role. Each intermediate destination must validate and preserve content before the next edge. The final requested mutation must validate before persistence. A schema label change alone must fail the owner's destination validator when the structure or meaning has changed.

## Read-only preflight

Code callers can use `preflightUpgrade(request)` from `scripts/upgrades.ts` before copying related records. It runs the same manifest resolution, source identification, content validation, conversion, preservation, destination validation, and requested mutation as `safeUpgrade`, without locks or writes. It does not authorize mutation or reserve the artifact. Call `safeUpgrade` afterward to repeat validation and commit under its lock.

## Persistence boundary

All conversion and mutation occurs in memory. The shared writer replaces the artifact only after every check passes. Pre-commit rejections preserve original bytes. Cleanup attempts run independently; post-commit cleanup failure preserves the committed outcome in the report. Only regular, singly linked UTF-8 files are writable; symlinks, hard links, malformed UTF-8, and immutable artifacts fail. Permissions are retained subject to the process umask. A same-directory temporary file holds validated content before atomic rename.

Ancestor directories resolve to their canonical filesystem target before locking. The lock, owner mutable check, identity check, and final write use that same target; the final file component still rejects symlinks. A sibling .contract-upgrade.lock file excludes cooperating writers. A byte and file-identity check rejects intervening changes before rename. All artifact writers must honor the same lock; this is not a transaction against uncooperative writers. A crashed process can leave a lock. Establish that its owner has stopped before manually removing it. Read-only resolution does not acquire artifact locks. Owner import and hooks must obey the purity contract.

## Runnable example

Use examples/upgrades as the installed owner. Its adapter moves title and body into document.heading and document.text, while preserving all other authored fields. The rename operation changes only the heading. immutable true requires a historical reader. The definitions forbid a relabel-only conversion. The example rejects numeric values that cannot round-trip exactly through its JSON implementation, including rounded large integers and negative zero. Its source-lexeme check prevents equal lossy parses from hiding a change.

Create a temporary v1 JSON note with schemaVersion example-note/v1, title, body, and authored metadata. Create a request containing a string title. Run safe-upgrade with --owner file:owner.ts and --operation rename. Confirm the body and metadata remain equal. Run bulk-upgrade over a mutable note and an immutable note. Confirm a nonzero partial result, a converted mutable note, and byte-identical immutable input.


## Public artifact identity

Successful and failed item results retain the caller artifact path resolved against the caller directory. Ancestor aliases remain in that public path. Canonical filesystem targets remain internal to locks, mutable checks, identity checks, and writes. Consumers can therefore join results to their original selections and report persisted changes and required publication.
