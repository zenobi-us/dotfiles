---
name: twg-context-discovery
description: >
  Use with root `twg` for deep context, dependency maps, related entities,
  project-to-repo discovery, OOO catch-ups, and
  "catch me up" requests around a concrete anchor.
---

# twg-context-discovery

Use the root `twg` skill. Get command grammar from live `twg help`,
`twg help <terms>`, or `twg help describe <path>`.

## CLI launcher fallback

Run `twg <command>`. On shell `command not found`, use `$HOME/.local/bin/twg`
(macOS/Linux) / `$env:LOCALAPPDATA\Programs\twg\bin\twg.exe` (PowerShell), then
tell user to add that directory to PATH. Do not treat auth or command errors as
PATH failures.

## First Move

Resolve the anchor before widening:

- Stable key, URL, or ARI: use directly when the family is clear.
- Fuzzy topic or name: classify scope; hydrate 2-5 anchors before ranking.
- Multiple same-kind anchors: batch them in one context call when supported.
- Unknown command shape: inspect focused help before calling data.

For fuzzy topics, group high-signal candidates by scope using explicit charter,
roadmap, project, product, or service evidence. Keep same-named feature,
platform, domain, team, and initiative clusters separate. Compare scope fit,
centrality, breadth, and recency before selecting one. If ambiguity remains,
show alternatives or ask. Set the boundary before inferring experts or
ownership; nearby authorship or activity does not prove broader responsibility.

If context is not advertised for an anchor type, use product-native hydration
and search evidence instead of inventing paths.

For ownership, expertise, approval authority, leadership reach-outs, or
escalation, load `../twg-responsibility-routing/SKILL.md`. Return here only
when that workflow needs relationship or dependency expansion.

## Route Selection

- Known Jira work items usually need native workitem details plus relationship
  context.
- Projects and goals need native details plus Jira, docs, search, PR, and
  meeting evidence.
- For topic onboarding, search knowledge and product-native work once. Compare
  formal epic, project, goal, and page anchors across same-named scopes;
  source-defined hierarchy distinguishes the central program/platform from a
  feature, migration, or adoption effort. Prefer the anchor linking current
  delivery work and code. Hydrate it, then use context and responsibility once
  each only if they add dependencies or people. Hydrate at most three items. Never
  refetch a source with another projection or try more synonyms after resolution.
  Target 6-10 calls; stop once the categories are supported.
- For restart, handoff, or OOO catch-up, load
  `../twg-status-rollups/references/personal-work-summary.md` and follow its
  restart guidance. Infer priority across connected evidence and hydrate only
  anchors that change the user's next action.
- Dependency map and page/topic prompts need hydrated anchors before broad search is
  evidence. Map broad subdomains before assigning owners/experts.
- Raw graph-query/debugging surfaces are not the default dependency-map route.
  Use them only when the user explicitly asks for that query language or typed
  commands cannot express the required edge.

## Evidence Policy

For central candidates, use a bounded source and relationship fan-out:

- Source fetch: fields, owner, status, body, comments, and URLs.
- Context: graph edges, formal external links, related people, teams, projects,
  goals, docs, PRs, commits, and branches.

Use summary detail first. Escalate to full only for the central anchor or up to
3 high-signal related anchors when URLs, comments, body content, or provenance
are missing.

Treat third-party URLs as graph nodes. Collect remote links, context edges,
descriptions, comments, ADF links, bare URLs, and linked bodies; retain
provenance for relationship direction.

## Expansion Rules

- Expand by relationship role, not raw count.
- Hydrate parent, epic, inbound peer, blocker, consumer, central page, external
  design, PR, commit, branch, assignee, reporter, contributor, and reviewer
  signals when they change direction, risk, ownership, or next action.
- Fetch known older links directly by URL, key, ID, or ARI instead of widening
  the whole graph blindly.
- Use strong query variants rather than many synonyms.
- After the first source fetch plus context/search pass, pause and compare the
  evidence against the requested output. If owner, status, relation, recency,
  and evidence URL/key are present, synthesize instead of widening.
- If a context or graph-backed command returns the same backend/coverage error
  twice, do not keep probing adjacent graph paths. Record the coverage gap and
  continue with product-native hydrated evidence.
- Stop when the next candidate would not add new entities, links, contributors,
  teams, decisions, ownership, risk, or next action.

## Graph Visualization

For graph requests, pipe typed context output to `twg visualize`. Keep entities
that change direction, ownership, risk, or next action; collapse duplicates.

## Output Shape

- Anchor snapshot: what it is and why it matters.
- For OOO catch-ups, synthesize by priority workstream and next action; do not
  add a relationship table. For other context work, include entity,
  relationship, owner, importance, and evidence.
- Risks and dependencies, separating confirmed edges from inferred relationships.
- Suggested next actions.
- Confidence and gaps when evidence is incomplete, access-limited, stale, or
  sampled.

## Anti-Patterns

- Do not stop at search results without hydrating anchors.
- Do not treat `stdout_shape` as a complete entity or URL inventory.
- Do not skip peer expansion for graph/dependency prompts because peers look
  "Done".
- Do not dismiss a 1-hop candidate by title alone.
- Do not hand-roll graph HTML.
