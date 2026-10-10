# GitHub Issues store

Use GitHub Issues as the source of truth. Use the repository declared in `docs/agents/issue-tracker.md`. Pass that repository to the dependency graph script. GitHub Issues must be enabled.

## Operations

Use the tracker document's commands and settings. The configured operations use `gh issue create`, `gh issue view`, `gh issue list`, `gh issue comment`, `gh issue edit`, and `gh issue close`. Use native issue relationship fields for blockers. Do not store a second `blocks` relationship.

For a read, include comments when requested. For a list, request the fields needed for the operation, including `blockedBy` for dependency results. For a DAG, run `./scripts/dep-tree-cli.ts github OWNER/REPO --spec ISSUE-ID` to start from a spec/map issue, or `./scripts/dep-tree-cli.ts github OWNER/REPO --ticket ISSUE-ID` to resolve the ticket's parent spec/map first. Map child issues become roots; the command follows native blocker relationships and prints each node as `- [type] id - title`. A map is identified by its `wayfinder:map` label. Legacy `Part of #N` ticket bodies remain a parent fallback.

For create, update, review comments, and completion, follow the configured tracker operation. If the tracker document does not define a claim or other requested operation, stop and report the missing operation. Do not guess a label, assignee, state, or close action as a substitute.

## Result identity

Return the issue number as a string and the canonical issue URL as `ref`. Return blocker IDs as strings. Report API or permission errors without replacing them with an empty result.