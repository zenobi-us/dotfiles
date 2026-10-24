# Ticket skill result contract

Use this contract for every subcommand, including setup.


Return one JSON object for every operation. Use a string ID and the canonical tracker URL or resolved local file reference.

```json
{
  "operation": "read",
  "backend": "github",
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

For a write, set `changes` to an object with `fields`, `dependency_edges_added`, and `dependency_edges_removed`. Set `validation` to an object with `status` and `details`. Set `publication` to an object with `status` (`not-required`, `committed`, `published`, or `local-only`) and an optional `ref`. Do not report a change or successful completion that the store did not confirm.

For `list`, return all matching tickets in `tickets`. Include `state` and `blocked_by` when the store exposes them. State limits and coverage gaps. For review, include the verdict and artifact or comment reference in `changes` or ticket details.
For a dependency graph, set `rendered` to the ASCII dot-list tree from `references/tasks/list.md`. Keep the ticket records in `tickets`.

## Setup results

For `operation: setup`, return `tickets: []`. Setup configures the tracker; it does not create, claim, complete, or import tickets.

Add a `setup` object with `phase` (`plan`, `apply`, or `check`) and `cli_result`. Keep the CLI's routes, absolute alignment root, file actions, before/after content, conflicts, and errors in `cli_result`. Preserve the CLI evidence rather than reconstructing it.

For a plan or check, set `changes: null`. For a successful apply, use the normal write shape. Put changed configuration paths in `changes.fields`; use empty dependency-edge arrays. These are configuration changes, not ticket-field edits.

Set `validation.status` to `planned`, `conflict`, `passed`, or `failed`, as confirmed by the CLI. A plan is not successful initialization. Set publication from observed store publication, not from planned writes. Return `rendered: null`; setup plans are not dependency graphs.

For an unsupported backend or missing prerequisite, return a failed validation and name the missing operation. Never report an unsupported ticket backend as operational merely because its configuration was rendered.

