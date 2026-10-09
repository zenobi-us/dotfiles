---
name: reading-and-writing-tickets
description: Read, list, create, update, claim, review, complete, or map ticket dependencies through the configured issue tracker. Use when another skill needs ticket records, metadata, state, or blocker relationships.
user-invocable: true
---

# Reading and Writing Tickets

## Route the request

1. Run `agent-core:shared-context` for the repository. Set `ALIGNMENT_ROOT` to its reported `root`. Retain its `mode`, route table, and `repository-root`.
2. Load `agent-core:mq-query`, its matching task procedure, and the required upstream reference before using `mq`. Read `<ALIGNMENT_ROOT>/docs/agents/issue-tracker.md` with explicit input and output formats. Read its YAML `backend` field. The `backend` must be `local-markdown`, `github`, or `jira`.
3. Check the shared-context ticket route against the configured backend. For local Markdown, use shared-context to resolve ticket IDs and the tracker root. If the declarations conflict or the tracker definition lacks the requested operation, stop and report the mismatch.
4. Select one task reference:
   - `read` → `references/tasks/read.md`
   - `list` or dependency graph → `references/tasks/list.md`
   - `create` → `references/tasks/create.md`
   - `update` → `references/tasks/update.md`
   - `claim` → `references/tasks/claim.md`
   - `review` → `references/tasks/review.md`
   - `complete` → `references/tasks/complete.md`
5. Select one store reference:
   - `local-markdown` → `references/stores/local-markdown.md`
   - `github` → `references/stores/github-issues.md`
   - `jira` → `references/stores/jira.md`
6. Follow both references. If the tracker definition lacks the requested operation, stop and report the missing operation.
7. Return the result in the contract below.

For every task, use the configured tracker as the source of truth. Ticket bodies hold intent and requirements. Comments hold conversation history. Store only direct blockers. Derive reverse edges when querying. Do not parse or change ticket fields outside the selected store procedure.

## Result contract

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
