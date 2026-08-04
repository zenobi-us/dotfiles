---
name: twg
description: >
  Root TWG CLI skill for Atlassian work-data tasks. Use typed commands for known
  anchors; use live `twg help` only when command shape or output contract is
  uncertain.
---

# twg

TWG routing: use typed commands for anchors. If uncertain, inspect `twg help <terms>`,
`twg help describe <path>`, or `twg help discover-skills "<intent>"`.

## Overview

Load the narrowest workflow skill:

- `twg-status-rollups` for status, leadership, and decision-readiness; load it before
  `twg-engineering-work` for PR-based team/org rollups.
- `twg-context-discovery` for deep dives, dependencies, graphs, repos, and catch-ups.
- `twg-agentic-search` for fuzzy cross-product Rovo/company-knowledge research.
- `twg-responsibility-routing` for owners, experts, approvers, authorities, and escalation.
- `twg-engineering-work` for code search and navigation, PR status, reviews,
  contributors, and hot areas.
- `twg-jira-resolve-merged-work` for stale Jira work backed by merged PRs.
- `twg-operational-health` for handoffs, incidents, Assets, staffing, meetings, and risk.
- `twg-bench-lite` for read-only single-prompt A/B comparisons.


## Invocation And Output

Run `twg <command>`. On shell `command not found`, use `$HOME/.local/bin/twg`
(macOS/Linux) / `$env:LOCALAPPDATA\Programs\twg\bin\twg.exe` (PowerShell), then
tell user to add that directory to PATH. Do not treat auth or command errors as
PATH failures.

Do not add per-command env prefixes unless requested; hosts may set `TWG_AGENT_DEFAULTS=1`.

Use `stdout_inline` first when present. Outside benchmark lanes, inspect `output_files.compact`
only when inline evidence is incomplete; full stdout is the last resort.

In TWG-only benchmark lanes, run only `twg` commands. Never use shell utilities or pipelines
(`jq`, `rg`, `date`) to transform evidence or calculate windows. Use compact/inline TWG output,
the prompt's timezone and window, and report gaps. Match the intent to the narrowest companion
skill before selecting a command. Let that skill determine the typed route; use at most one help
call when command shape or output remains ambiguous.

## Auth/Setup Guard

Do not run setup, login, install, update, upkeep, or credential commands unless
explicitly requested for setup/auth/repair. Otherwise report remediation and wait for user direction.

## Bounded Evidence Loop

Converge; prefer typed or product-native evidence.

1. Classify the anchor: person, team, project, goal, workitem, page, repo, service, asset, or topic.
2. Resolve once; fetch evidence that changes status, risk, decision, relationship, or action.
3. Rank candidates, hydrate representative items, then synthesize.
4. Stop after the first policy denial; stop after the same auth, ACL, contract, or backend error twice.

## Command Discovery

- Use typed commands for familiar families: `resolve`, `search`,
  `user`, `org-tree`, `work query`, `work search`, `pull-requests`, `jira`,
  `confluence`, `docs`, `context`, `responsibility`, `goals`, `projects`,
  `assets`, and `trello`.
- Use `twg search "<topic>" [--limit <n>]` for top-K discovery; explicit `--app` preflights.
- For fuzzy Trello discovery, use `twg trello search "<query>" --limit 20`; no workspace scope.
- For Rovo connectors, use `twg rovo list-apps -o json` (`list-connectors` alias), then explicit `twg rovo search ... --app <connector>`; follow its auth action or `twg rovo auth <app>`.
- Keep document relationship history and fuzzy discovery separate:
  - `twg docs query --since <duration> [--account-id <id>] [--first <n>]` is user activity history, not title/content search.
  - `twg docs search "<topic>" [--limit <n>]` is fuzzy Rovo discovery across Confluence and ready document connectors.
  - Never pass topic text to `docs query`; route that intent to `docs search`.
- Keep user activity and fuzzy work discovery separate:
  - `twg work query` defaults to seven days of authored work; other activity requires `--activity` / `--include-viewed`.
  - `twg work search "<topic>"` is tenant-wide; use `docs search` for documents. Prefer it directly when fuzzy text reaches `work query`.
- Use live help—`twg help <terms>` then `twg help describe <path>`—before guessing grammar; namespace help is not executable.
- Resolve URLs, keys, ARIs, names, and people, then hydrate stable IDs.
- Jira: `jira workitem search <text...>` for Jira fuzzy text, `jira workitem query --jql <jql>` for structured JQL, and `search <text...> --app jira` for semantic discovery.
- Command shape guardrails:
  - Known Jira/Atlas keys are positional for `jira workitem get`, `goals get`, and `projects get`; `--key` is compatibility only.
  - `work query` is user activity (`--scope me|user`), never `--scope global`; use `work search` for topics and advertised filters such as `--types`.
  - `assets search` is shallow: inspect schemas/types, shortlist owners, then batch `assets query`/`assets object query` with `--account-id`.
- Keep projection and product-native commands separate; do not borrow unadvertised flags. Use `search-code` for indexed code. Unless the user explicitly scopes a code host, omit `--app` so all available indexed SCM surfaces are searched; repeated `--app` values are supported for an explicit multi-host scope. Apply `--workspace` only when a known tenant boundary is useful, and `--repo` only as a discovery anchor rather than proof that the full implementation lives there. De-duplicate mirrors, widen after generated-doc or incomplete hits, then fetch selected source files.

## Load The Narrowest Companion

Use a concrete key, URL, ARI, slug, account ID, name, topic, `me`, or window.

- `../twg-jira/SKILL.md` for Jira; `../twg-confluence/SKILL.md` for Confluence edits.
- `../twg-status-rollups/SKILL.md` for status; `../twg-context-discovery/SKILL.md`
  for context, dependencies, and graphs.
- `../twg-agentic-search/SKILL.md` for fuzzy Rovo/company-knowledge search.
- `../twg-responsibility-routing/SKILL.md` for ownership, approval, and escalation.
- `../twg-engineering-work/SKILL.md` for code search, PRs, and reviews;
  `../twg-jira-resolve-merged-work/SKILL.md` for stale Jira work backed by merged PRs.
- `../twg-operational-health/SKILL.md` for handoffs, reliability, incidents, assets, staffing, and risk.


## Rules

- Never guess IDs, flags, slugs, ARIs, object IDs, or mutation contracts.
- For product writes, load the product skill and follow live help.
- Avoid local inspection, caches, schema probes, or diagnostics unless local state is requested.
- For writes, read current state and state the mutation unless execution was requested.

