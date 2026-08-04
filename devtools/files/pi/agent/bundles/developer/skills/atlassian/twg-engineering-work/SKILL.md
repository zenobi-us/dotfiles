---
name: twg-engineering-work
description: >
  Use with root `twg` for code search, repositories using an API/package,
  implementation and reverse-dependency discovery, PR status and reviews, repo
  contributors, hot areas, and issue-to-PR lookups.
---

# twg-engineering-work

Use together with the root `twg` skill. Exact command grammar must come from
live `twg help`, `twg help <terms>`, or `twg help describe <path>`.

## CLI launcher fallback

Run `twg <command>`. On shell `command not found`, use `$HOME/.local/bin/twg`
(macOS/Linux) / `$env:LOCALAPPDATA\Programs\twg\bin\twg.exe` (PowerShell), then
tell user to add that directory to PATH. Do not treat auth or command errors as
PATH failures.

## Use When

- "Which PRs are waiting for my review?"
- "Where is this API implemented or used?"
- "Which repositories directly depend on this package?"
- "Latest PRs for this issue"
- "Who contributed most to this repo/topic?"
- "Repos I created PRs in"
- "Stale reviews"
- "Review flow or bottlenecks"
- "PR-only status for a user, team, or repo"
- "PR status for Alice" or "this person's PRs"
- "My PRs this week"
- "Summarize my pull requests for a time window"
- "Open bugs/tasks with PRs in flight"

## First Move

Resolve the engineering anchor:

- Repo prompt: identify workspace and repo from URL, local checkout, or repo query.
- PR prompt: resolve exact PR URL, ID, workspace, and repo.
- Workitem prompt: fetch/context the Jira workitem to discover linked PRs,
  commits, branches, and repos.
- Topic prompt: resolve/search once, then find linked repos, PRs, and workitems.
- Code prompt: search the concrete package, API, symbol, or behavior, then
  inspect only the source locations needed to verify the requested relationship.

Use matching typed pull-request, Bitbucket, Jira, context, and search commands.
Provider-native PR commands apply only to their host; Bitbucket
activity/comment/task commands never apply to GitHub PRs. Use focused help for
uncertain routes/contracts.

## Route Selection

- For queues, query candidate PRs first, then hydrate selected PRs needing action.
- For stale reviews, group by repo, author, reviewer, and stage before fetching
  detailed comments or diffs.
- For issue-to-PR lookup, use workitem context before broad PR text search.
- For repo contributors and hot areas, combine PR/commit/file-area signals with
  ownership and review evidence.
- For PR leadership/team/org rollups, use `twg-status-rollups`; this skill
  supplements PR details.
- For person/repo status, collect merged/open PRs for relevant people, repos,
  and window.
- Code: load `references/code-search.md`.
- For person-scoped summaries with Jira, docs, meetings, planning, or
  notifications, use `twg-status-rollups` plus
  `../twg-status-rollups/references/personal-work-summary.md`; this skill owns
  PR-only work.

## Evidence Policy

- Hydrate PR details, comments, tasks, pipeline status, and diff only for stale,
  blocked, central, or high-impact PRs.
- For PR rollups, stop after the evidence set identifies the main themes,
  repos/services, owners, and recency. Do not keep searching for more PRs when
  the next batch would only add more examples of the same theme.
- For review status, include age, requested reviewers, comments/tasks, approval
  state, CI/check or pipeline state, and last activity when the provider surface
  exposes them.
- For repo/team reports, group by repo, service, or workstream rather than only
  person counts.
- Inspect PR titles/descriptions and linked issues to infer themes; do not rank
  solely by PR count.
- Keep Bitbucket, GitHub connector/tool, and Atlassian auth failures separate.
- If PR graph or repo-wide query calls repeatedly fail, make one narrower
  fallback using known repos, people, workitems, or search anchors. If that also
  fails, answer from the successful evidence and call out the PR coverage gap.

## Recipe Cards

### Review Queue

Query reviewer-scoped open PRs. Sort by waiting time, requested action,
unresolved tasks/comments, failing CI, and project relevance. Hydrate only PRs
that need action.

### Stale Reviews / Review Bottlenecks

Find PRs open or waiting beyond the threshold. Group by repo, author, reviewer,
and stage. Identify bottleneck patterns such as missing reviewer, unresolved
tasks, failing CI, repeated request-changes, or owner unavailable.

### Issue PRs

Use workitem context to find linked PRs, commits, branches, and repos. Fetch PRs
only if the user asks for details, status, or next action.

### Repo Contributors / Hot Areas

Query PRs/commits for the repo and time window. Group by files/areas, authors,
reviewers, and themes. For hot areas, prioritize changed area plus frequency and
ownership signals.

### PR-Based Status Rollup

Resolve org/team first, then collect PRs for members or repos in the time window.
Group into themes and repos/services. Call out gaps where PR-only evidence omits
Jira, docs, planning, or customer context.
For a single person where the prompt is broader than PRs, switch to
`twg-status-rollups` and load
`../twg-status-rollups/references/personal-work-summary.md`.

## Output Shape

For queues, include PR, repo, owner, state, reason, next action, and evidence.
For engineering reports, summarize workstreams, contributors, bottlenecks,
risks, and gaps. Include stable URLs or IDs for key artifacts.

## Anti-Patterns

- Do not guess Bitbucket workspace or repo.
- Do not fetch every PR body, diff, or comment in a large queue.
- Do not treat PR counts as impact.
- Do not mix Bitbucket, GitHub connector/tool, and Atlassian auth failures.
