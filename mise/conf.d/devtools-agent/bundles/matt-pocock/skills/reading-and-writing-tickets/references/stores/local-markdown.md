# Local Markdown store

## Resolve and read

1. Use `agent-core:shared-context` to resolve ticket IDs and the tracker root. Do not construct paths from configured root segments.
2. Use `agent-core:mq-query` for every Markdown read, query, or validation. Load its matching task reference and upstream reference first. Use an explicit input and output format and load `okf.mq`.
3. Read ticket metadata from YAML frontmatter. Keep the body as human-readable intent and comments as conversation history.

The tracker config must declare `issue-root: tracker/tickets` and `initiative-root: tracker/initiatives`. Tickets use stable `id`, `title`, `work_status`, `blocked_by`, and optional `parent` fields. Workflow tickets may also use `type` (`research`, `prototype`, `grilling`, or `task`) and `triage`. Preserve unknown fields. Valid `work_status` values are `unclaimed`, `claimed`, `implemented`, `merged`, and `completed`. Set `completed` only after validation, review, merge, and push succeed.

When applicable, use `## What to build`, `## Question`, `## Acceptance criteria`, and `## Comments` in the body. Do not treat body text such as `Blocked by:` as canonical metadata.

## Query and graph

Resolve the tracker root before listing. Query only its `tickets/` area. Return the canonical ID, title, state, direct blockers, and resolved file reference. For a DAG, run `./scripts/dep-tree-cli.ts markdown <shared-context-root> --ticket TICKET-ID` to discover the containing initiative, or `./scripts/dep-tree-cli.ts markdown <shared-context-root> --initiative INITIATIVE-ID` to select it directly. Initiative index links become graph roots; the command follows `blocked_by` edges and prints each node as `- [type] id - title`. It uses `mq` to read initiative indexes and `tracker/tickets/` frontmatter. It fails when a referenced blocker has no matching local ticket. Do not read body text as a replacement for frontmatter relationships. Derive reverse edges; do not store a second `blocks` list.

## Writes

Resolve each ticket before writing. Preserve frontmatter and body structure. Before a dependency write, verify unique references, no self-edge, no cycle, a real start-time dependency, and that a completed blocker does not need to remain open.

Before the first write, identify the Git repository that contains the resolved issue store and read its status. If it is a Git repository, commit changed tracker Markdown before issue work. Use `writing-and-creating-git-commits` and keep tracker commits separate from source commits.

After a write to `store: shared`, read the shared-context publishing procedure and publish when the store has a usable remote. Report local-only storage when it has no usable remote.