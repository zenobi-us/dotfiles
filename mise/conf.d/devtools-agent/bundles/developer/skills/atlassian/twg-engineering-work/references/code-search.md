---
description: Discover and navigate implementations across available indexed code surfaces, then hydrate a bounded source-backed result set.
---

# Code Search And Navigation

Start with one hybrid `search-code search` using the concrete topic, symbol, or
known repository anchor. Unless the user explicitly limits a code host, omit
`--app` so the command searches every available indexed SCM surface. Add
`--workspace` only when a known tenant boundary improves precision; a workspace
is not required. A named repository is a starting anchor, not an instruction to
ignore related implementations elsewhere.

For reverse-dependency questions, search the exact API or symbol first. If that
does not establish direct consumption, search the package/import anchor once,
group candidates by repository, and inspect only the manifest or import plus
call site needed to verify selected consumers. Prefer stable literal anchors;
do not invent delimiter-heavy code fragments merely to vary the query.
Use no more than two search calls for one reverse-dependency map: the symbol,
then the package/import only if needed. Keep each search to 20 compact results
or fewer; use the returned repository and path metadata for selection.

Treat search results as a batch. Do not rerun the same symbol separately for
each repository, code host, authorization mode, or usage pattern. Select a
small, diverse set of direct consumers, hydrate at most one call-site file per
selected repository, and fetch a manifest only when the call-site evidence does
not establish the package. Stop when another result would repeat an already
verified integration role.

When the requested scope is public code, count a repository only when returned
source metadata or its stable source URL establishes public visibility. Exclude
private or ambiguous repositories rather than inferring that visibility from
the owner, host, or repository name.

Rank a bounded set of source-backed implementation locations. If the anchored
search is incomplete, returns only generated documentation, or exposes only one
part of the requested capability, widen once across the available indexed
surfaces. Fetch only selected source files needed for symbol and behavior
context. Prefer commit-pinned links. Treat mirrors and duplicate paths as one
implementation, preserve their source links, and say which appears canonical
only when the evidence supports it.

Join ownership, PR, or work-item evidence only for the selected locations and
only when it clarifies responsibility or delivery. Never infer behavior from a
filename, ownership from one commit, or completeness from one provider's empty
result. Report indexing and connector gaps instead of filling the result count.
Target 4-8 `search-code` calls total, including source hydration.
