# Ticket skill result contract

Use this contract for every subcommand, including setup.


Return one JSON object with `schema: tracker-result/v1` for every operation, including setup, check, migration plans, failures, and publication results. Use a string ID and the canonical tracker URL or resolved local file reference. This result schema is independent of record, setup-state, route, and receipt versions.

```json
{
  "schema": "tracker-result/v1",
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

For example, publishing a local specification returns:

```json
{
  "schema": "tracker-result/v1",
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
For a dependency graph, set `rendered` to the ASCII dot-list tree from `references/tasks/list.md`. Keep the ticket records in `tickets`.

For `check` and `migrate`, preserve the CLI's selected records, plan identity, hashes, conflicts, coverage limits, migration state, and publication requirements in the result. A planned migration has `changes: null` and does not imply applied record changes. An internal rollback or partial publication is not successful completion.

## Setup results

For `operation: setup`, return `initiatives: []` and `tickets: []`. Setup configures the tracker; it does not create, claim, complete, or import records.

Add a `setup` object with `phase` (`plan`, `apply`, or `check`) and `cli_result`. Keep the CLI's routes, absolute alignment root, file actions, before/after content, conflicts, and errors in `cli_result`. Preserve the CLI evidence rather than reconstructing it.

For a plan or check, set `changes: null`. For a successful apply, use the normal write shape. Put changed configuration paths in `changes.fields`; use empty dependency-edge arrays. These are configuration changes, not ticket-field edits.

Set `validation.status` to `planned`, `conflict`, `passed`, or `failed`, as confirmed by the CLI. A plan is not successful initialization. Set publication from observed store publication, not from planned writes. Return `rendered: null`; setup plans are not dependency graphs.

For an unsupported backend or missing prerequisite, return a failed validation and name the missing operation. Never report an unsupported ticket backend as operational merely because its configuration was rendered.

