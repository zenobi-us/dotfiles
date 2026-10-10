---
name: twg-agentic-search
description: >
  Use with root `twg` for deep iterative enterprise/company knowledge search and
  internal research with Rovo Search across connected apps/connectors including
  Confluence, Jira, Drive, Slack, Bitbucket, and GitHub.
---

# twg-agentic-search

Use together with the root `twg` skill. Exact command grammar comes from live
`twg help`, especially `twg help describe "rovo search"` when filter or output
options matter.

## CLI launcher fallback

Run `twg <command>`. On shell `command not found`, use `$HOME/.local/bin/twg`
(macOS/Linux) / `$env:LOCALAPPDATA\Programs\twg\bin\twg.exe` (PowerShell), then
tell user to add that directory to PATH. Do not treat auth or command errors as
PATH failures.

## Workflow

1. Classify the request as fuzzy or cross-product internal research. Prefer this
   skill when the source is unclear, current company knowledge is needed, or the
   answer may span Confluence, Jira, Drive, Slack, Bitbucket, GitHub, or other
   Rovo-connected apps.
2. Confirm or infer the Atlassian site. Ask only when no configured or explicit
   site is available and the ambiguity would change the search.
3. If app/source availability changes the plan, run
   `twg rovo list-apps -o json` or `twg search list-apps -o json`. Use the
   returned built-ins, connectors, readiness, and auth/setup actions to decide
   scope; do not start setup or login unless the user asked for it.
4. Start with one query that combines the concrete topic with the requested
   artifact or decision type. Use at most one canonical/authoritative or
   recent/update-oriented refinement when the first result set mixes scopes,
   lacks primary sources, or misses the requested time signal. Do not fan out
   exact-title searches for every candidate already returned by the primary
   query.
5. Choose filters deliberately. Default to Confluence and Jira built-ins for
   official/internal knowledge. Broaden to Slack, Google Drive, Bitbucket,
   GitHub, or other connectors only when useful and available. Use app, type,
   recency, owner/contributor/assignee/reporter/status, title-only, label/space,
   and site filters when they narrow evidence without hiding likely answers.
6. Search with bounded output:

```bash
twg rovo search "<query>" --output json --output-summary auto --agent-fields @compact
twg rovo search "<query>" --output json --output-summary auto --agent-fields @evidence
```

Use `@compact` to shortlist candidates and `@evidence` when snippets, URLs, and
provenance need more detail.

## Evidence Rules

- Treat search snippets as candidates, not facts.
- Hydrate a small, diverse primary-source set before final claims. For document
  discovery, cover distinct roles such as requirements, architecture/design,
  and current delivery rather than redundant pages. Use product-native
  commands such as `twg confluence content get`, `twg jira workitem get`,
  `twg jira workitem query`, `twg bb prs`, `twg bb repo`, or the relevant
  product command for the result URL/type.
- For document or PRD discovery, select at most five sources across those roles.
  Hydrate one source per role unless a material conflict requires a second.
  Stop once the roles, current delivery, and important conflicts are supported,
  even when search returns more candidates.
- Prefer official spaces, owned project pages, current Jira issues, and recent
  decision records over personal drafts or stale chat mentions, unless the user
  explicitly asked for informal signal.
- Compare hydrated evidence for conflicts, recency, ownership, and authority.
- Do not rerun an `@evidence` search for a candidate that can be hydrated through
  its product-native URL or ID, and do not refetch one source under another
  projection.
  Call out ACL gaps, unavailable connectors, low recall, and unresolved
  contradictions instead of flattening them into a single claim.

## Output

Lead with the answer or best-supported conclusion. Cite hydrated titles/URLs and
include the source app, date or status when available, and why each source was
trusted. Separate confirmed facts, likely interpretations, conflicts, and gaps.
