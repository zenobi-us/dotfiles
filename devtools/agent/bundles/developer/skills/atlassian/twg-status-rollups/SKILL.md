---
name: twg-status-rollups
description: >
  Use with root `twg` for status rollups, personal work summaries, and
  decision-readiness or go/no-go briefs. Routes to `pr-tree`, `org-tree`,
  `work-tree`, or `workitem-tree`.
---

# twg-status-rollups

Use with the root `twg` skill. Get exact command grammar from live `twg help`,
`twg help <terms>`, or `twg help describe <path>`.

## CLI launcher fallback

Run `twg <command>`. On shell `command not found`, use `$HOME/.local/bin/twg`
(macOS/Linux) / `$env:LOCALAPPDATA\Programs\twg\bin\twg.exe` (PowerShell), then
tell user to add that directory to PATH. Do not treat auth or command errors as
PATH failures.

## Use When

- "What did I/person/team/org work on?" or weekly personal update
- Short-window personal update, standup, handoff, or restart after time away
- "Status of project/goal/topic/focus area"
- "Is this project ready to launch?" or go/no-go decision brief
- Leadership, monthly, annual, cycle, appraisal, or goal-alignment readout
- Org bottlenecks, priorities, stale goals, or project risks

## First Move

Resolve scope before retrieval:

- Person/team/org: resolve identity, roster, or org-tree groups.
- Project, goal, focus area, or topic: resolve native key, ARI, URL, name, or
  central project/page/workitem anchors.

Establish the time window. If absent, ask when precision matters; otherwise use
a recent bounded window and state it. Keep personal summaries to 1 year or less.

## Tree Routing Matrix

- `pr-tree`: merged/open PRs, reviews, shipped work, or repo momentum by manager
  or team. Default for PR-constrained evidence.
- `org-tree`: manager chain, roster, and reporting structure; use for grouping,
  not delivery evidence.
- `workitem-tree`: Jira issue load and active/done movement by org tree.
- `work-tree`: multi-surface org counts across Jira, PRs, goals, projects, docs,
  or videos. Not for PR-only or Jira-only asks.

## Fast Path: PR-Based Leadership Rollup

For PR-based leadership prompts:

1. Preserve the requested scope and window; for "last 2 weeks," use
   `--since 14d`.
2. Use `pr-tree` first. It groups by reporting-tree `directReports`; add
   `org-tree` only for hierarchy context.
3. If option shape is uncertain, inspect `twg help describe "pr-tree"` before
   the data call; do not probe incompatible flag combinations.
4. Start count-first, then make at most one supported sampling/full-fetch pass
   for repo or theme evidence. Synthesize at manager/team level from that tree.
   Do not issue per-person queries merely to populate every group; use one
   targeted PR follow-up only when a material theme lacks representative proof.
5. Add one secondary surface only for a named gap.

Target 2-4 calls.

## Evidence Policy

- Match evidence to prompt constraints; merged-PR-only conclusions require PR
  evidence.
- Start count-first on tree surfaces; hydrate examples only for themes, risks,
  or owner attribution.
- Rank broad lists before minimal hydration.
- Distinguish authored delivery from review, coordination, and influence.
- Stop when evidence is sufficient. After two identical backend failures, stop
  that path and report the gap.

## Recipe Cards

### Person Or Personal Update

Resolve the person, then pull recent Jira work, PRs, docs/pages, meetings, and
project/goal involvement. Load `references/personal-work-summary.md` for exact
subject, notification, PR hydration, and outcome-first rules.
Separate delivery, review, docs/strategy, coordination, and influence.

### Short-Window Personal Update / Standup

Load `references/personal-work-summary.md`. Resolve the person, preserve the
requested project and window, prioritize material work, and distinguish
evidence gaps from confirmed blockers.

### Team Or Org Leadership Readout

Resolve org-tree first. Group before per-person details. Use org-level signals,
then hydrate only outliers that change momentum, blockers, review load, or
ownership.

### Project Or Goal Status

Fetch the native project/goal first. Include owner, state, update,
links, dates, and recency. Hydrate only risk, progress, or dependency evidence.

### Decision Readiness / Go-No-Go

Load `references/decision-readiness.md`. Resolve the native project or decision
anchor first and keep explicit links as the scope boundary. Identify the gates,
then give the requested decision or recommendation with confidence, gaps, and
change conditions. Do not infer owners.

### Topic Status

Resolve/search once, select central project, goal, page, or workitem anchors,
then hydrate those before using broad work/activity queries.

## References

- `references/personal-work-summary.md` - standups, catch-ups, and broader
  personal status evidence
- `references/decision-readiness.md` - cross-domain go/no-go and approval evidence

### Appraisal / Performance Evidence

Resolve person and horizon. Separate delivery, review, collaboration,
docs/strategy, project/goal impact, and stakeholder signals. Avoid count-only
ranking; add caveats when evidence is weak.

## Output Shape

- Executive summary first, with 3-6 high-signal observations.
- Table with owner/team/workstream, positive signals, risk signals, current
  focus, confidence, and evidence.
- Risks and leadership attention ranked by impact and owner.
- Confidence and gaps, including stale updates, missing product coverage, ACL
  gaps, or sampled evidence boundaries.

## Anti-Patterns

- Do not make a status report a list of every artifact.
- Do not infer goal/project health from issue counts alone.
- Do not fan out across every org member if manager/team-level grouping answers
  the prompt.
- Do not use search snippets as final evidence for status or risk.
- Start explicit merged/open PR rollups with `pr-tree`, not the other trees.
