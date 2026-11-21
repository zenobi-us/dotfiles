# Ticket skill result contract

Use this contract for every subcommand, including setup.


Produce one canonical JSON object with `schemaVersion: tracker-result/v2` for every operation, including setup, check, migration plans, failures, and publication results. Use a string ID and the canonical tracker URL or resolved local file reference. This result schema is independent of record, setup-state, route, and receipt versions.

Use the agent-core `result-delivery` skill before returning. It owns audience selection, transport and presentation. Human sessions receive an outcome, canonical references, validation, publication state and blockers, not a raw JSON dump. Machine clients receive JSON. Delegated children preserve the caller's required handoff. A muxer name or depth alone does not select the audience.

The records CLI supports `--format human|json`, `--deliver` and `--delivery-context <absolute-file>`. Use `--deliver` to bind the selected operation to `RESULT_DELIVERY_CONTEXT`. An explicit context file also binds that operation. Intermediate ticket commands do not consume an inherited final-result target. Its direct CLI default remains JSON for machine callers. Required artifact delivery takes precedence over presentation flags. The operation validates its context before mutation and emits the unchanged domain object through the delivery library. If delivery fails after an operation, recovery JSON goes to stdout and a warning goes to stderr. Inspect existing state; do not repeat the operation merely to resend its result.

For skill-owned operations without an integrated CLI, use the shared delivery library at the operation boundary. Do not serialize the result again in final chat. Transport envelopes and acknowledgements do not replace tracker records or worktree phase receipts. Transport alone does not commit or push.

```json
{
  "schemaVersion": "tracker-result/v2",
  "operation": "read",
  "backend": "github",
  "initiatives": [],
  "tickets": [
    {
      "id": "42",
      "title": "Example ticket",
      "ref": "https://github.com/owner/repo/issues/42",
      "state": "open",
      "blocked_by": ["41"]
    }
  ],
  "changes": null,
  "validation": null,
  "publication": null,
  "rendered": null
}
```

Always return both `initiatives` and `tickets`; use an empty array for a kind not returned. Initiatives are not executable tickets. Each initiative has string `id`, `title`, canonical `ref`, and `children` entries with string `id` and canonical `ref`. Copy canonical references from tracker results or the shared-context resolver's `ref`, not its physical `path`. For Local Markdown, append `/index.md` to the initiative directory reference to identify the specification document. Return initiative `state` only when its backend defines it. Never invent ticket `work_status` for an initiative.

For example, publishing a local specification produces this domain result before delivery:

```json
{
  "schemaVersion": "tracker-result/v2",
  "operation": "create",
  "backend": "local-markdown",
  "initiatives": [{
    "id": "example-navigation",
    "title": "Example navigation",
    "ref": "tracker/initiatives/example-navigation/index.md",
    "children": []
  }],
  "tickets": [],
  "changes": {"fields": {"specification": "created"}, "dependency_edges_added": [], "dependency_edges_removed": []},
  "validation": {"status": "passed", "details": ["Read back the complete specification through tracker discovery."]},
  "publication": {"status": "local-only"},
  "rendered": null
}
```

The example's paths and results are illustrative. Use resolved references and observed validation/publication, not these literal values.

For a write, set `changes` to an object with `fields`, `dependency_edges_added`, and `dependency_edges_removed`. Set `validation` to an object with `status` and `details`. Set `publication` to an object with `status` (`not-required`, `required`, `committed`, `published`, or `local-only`) and an optional `ref`. `required` means changes are not yet committed/published as required by their stores; it blocks subsequent implementation. Do not report successful publication that the store did not confirm.

For `list`, return matching records in their respective arrays. Include ticket `state` and `blocked_by` when exposed. State limits and coverage gaps. For review, include the verdict and artifact or comment reference in `changes` or ticket details.
For claim/recovery operations, report observed ownership, retained claim or explicitly approved takeover, validation, and publication in the existing result fields. An idempotently held claim may return no field change; do not report a new claim, phase execution, or completion that did not occur. `implemented`/`merged` are not completion, and the ticket result does not replace worktree recovery receipts.
For a dependency graph, set `rendered` to the ASCII dot-list tree from `references/tasks/list.md`. Keep the ticket records in `tickets`.

For `check` and `migrate`, preserve the CLI's selected records, plan identity, hashes, conflicts, coverage limits, migration state, and publication requirements in the result. A planned migration has `changes: null` and does not imply applied record changes. An internal rollback or partial publication is not successful completion.

## Setup results

For `operation: setup`, return `initiatives: []` and `tickets: []`. Setup configures the tracker; it does not create, claim, complete, or import records.

Add a `setup` object with `phase` (`plan`, `apply`, or `check`) and `cli_result`. Keep the CLI's routes, absolute alignment root, file actions, before/after content, conflicts, and errors in `cli_result`. Preserve the CLI evidence rather than reconstructing it.

For a plan or check, set `changes: null`. For a successful apply, use the normal write shape. Put changed configuration paths in `changes.fields`; use empty dependency-edge arrays. These are configuration changes, not ticket-field edits.

Set `validation.status` to `planned`, `conflict`, `passed`, or `failed`, as confirmed by the CLI. A plan is not successful initialization. Set publication from observed store publication, not from planned writes. Return `rendered: null`; setup plans are not dependency graphs.

For an unsupported backend or missing prerequisite, return a failed validation and name the missing operation. Never report an unsupported ticket backend as operational merely because its configuration was rendered.


## Historical result and migration contracts

New results use only `schemaVersion: tracker-result/v2`. The delivery target names `tracker-result/v2`; transport contexts and envelopes use their independently owned `schemaVersion: result-delivery/v2` contract. Explicit historical v1 transport remains readable without rewriting stored bytes. Explicit historical results use only `schema: tracker-result/v1`. Reject dual identity fields and unknown explicit identifiers. Historical acceptance does not permit new v1 output.

New migration plans use `schemaVersion: tracker-migration-plan/v2`. New immutable migration events use `schemaVersion: tracker-migration/v2`. Read retained v1 plans and event chains through explicit v1 readers without changing stored bytes, property order, IDs, or hashes. Already-applied v1 plans support read-only check and idempotent apply. For an unapplied v1 plan, verify its retained semantics, then create and approve a v2 plan before any new record writes.

The records CLI also provides `update --ticket <id> --request <request.json>` or `update --initiative <id> --request <request.json>`. Requests contain `fields` with nonempty string values for `title`, `work_status`, or `triage`; initiatives permit only `title`. The command uses the declared safe upgrade before mutation. IDs, direct blockers, membership, comments, and other authored content remain unchanged.

Use `upgrade --artifacts <paths.json>` for explicit bulk conversion. Supply a nonempty JSON array of absolute canonical live ticket or initiative-index paths. Each item persists independently. Partial and failed results exit nonzero and retain per-item outcomes, including actual changes after cleanup failures. Current valid records are byte-identical no-ops. This command never converts migration plans, events, receipts, or arbitrary Markdown.

## Content validation

The records CLI validates each domain result before delivery. Resolve the installed tracker skill directory as TRACKER_SKILL_ROOT. To validate a saved result from any working directory, run its absolute entrypoint:

```sh
"$TRACKER_SKILL_ROOT/scripts/validate-result.ts" --input /absolute/result.json
```

The command validates the exact current or historical contract and prints the unchanged result. It does not rewrite the input or consume an inherited delivery handoff. Unknown identifiers, dual identity fields and malformed record membership fail without output. Transport identity checks do not replace this owning content validator.

