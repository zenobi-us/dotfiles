---
name: twg-jira-resolve-merged-work
description: >
   Clean up stale or unresolved Jira workitems. Dry-run single items, lists, boards,
   sprints, epics, or projects by matching Jira keys/titles to merged PRs, repos,
   Rovo/search-code hits, and assignee activity.
---

# twg-jira-resolve-merged-work

Resolve stale Jira workitems only when merged PR evidence is strong. Plan first;
mutate only after approval.

Use exact command grammar from live `twg help` / `twg help describe`; do not
guess board, sprint, transition, workspace, repo, PR, or field syntax.

## CLI launcher fallback

Run `twg <command>`. On shell `command not found`, use `$HOME/.local/bin/twg`
(macOS/Linux) / `$env:LOCALAPPDATA\Programs\twg\bin\twg.exe` (PowerShell), then
tell user to add that directory to PATH. Do not treat auth or command errors as
PATH failures.

## Scope

Accept one Jira scope:

- One Jira workitem key/URL.
- A small explicit list of Jira workitem keys/URLs.
- Board or sprint ID/URL.
- Epic key.
- Jira space/project key.

Default to dry run. Ask before mutating unless the user requests reviewed
execution. Use a bounded window; otherwise inspect recent active/completed
sprint work and nearby PR merge dates.

## Workflow

1. Load Jira candidates.
   - Single/list: hydrate each provided workitem directly.
   - Sprint: `jira sprint workitems query`.
   - Board: board/backlog/sprint commands advertised by live help.
   - Epic or space: JQL-backed `jira workitem query`.
   - Hydrate key, title, status/category, assignee, updated time, parent,
     subtasks/blockers, and URL.

2. Split the set.
   - Candidates are not done/resolved. Peers are done in the same board, sprint,
     epic, or space.
   - Exclude epics/parents. Skip unresolved blockers or incomplete subtasks
     unless the user explicitly allows them.

3. Discover shared repo context set-wise.
   - Even for one item or a short list, infer context for the set together.
   - Extract repos/workspaces from linked PRs, commits, branches, project links,
     Compass/components, context queries, and resolved peers.
   - Use completed peers to infer common repos, assignees, Jira-key title/branch
     conventions, PR links, and merge-to-transition lag.

4. Check optional discovery signals.
   - If `rovo list-apps` shows Bitbucket or GitHub connected, use Rovo search
     for keys, titles, PR URLs, branches, and repos. Treat it as discovery until
     hydrated through TWG/provider/Jira evidence.
   - If `search-code` is available, search exact keys first, then distinctive
     title terms in discovered repos. Strong hits are branch names, commit text,
     changed files, or symbols; broad fuzzy hits stay weak.

5. Expand likely implementers.
   - Prefer assignees from completed peer items and candidates. Treat reporters
     and commenters as weak hints.
   - Query merged PRs authored by these assignees in the window, scoped by
     discovered repos first; if unknown, infer repos from author/date results.

6. Search merged PRs in batches.
   - Prefer one merged-PR query per repo/window, then match locally across all
     candidate keys. One PR may satisfy multiple exact keys.
   - Match exact keys in PR title, description, branch, commits, and linked
     issue metadata.
   - Fall back to per-workitem lookup only for no evidence, priority items, or
     ambiguity.

7. Score confidence.
   - High: exact key in merged PR or linked PR metadata, plausible timing, no
     open same-key PR, no blockers/subtasks, and target transition exists.
   - Medium: same assignee/repo with strong title similarity, or exact key only
     in commit/search-code evidence.
   - Low: fuzzy similarity, same author only, unknown repo, or ambiguity.

8. Produce the dry-run plan.
   - Table columns: workitem key/title, current status, proposed transition,
     confidence, brief rationale, PR title/URL, merge date, last Jira update,
     link/repo proposal, PR title-fix proposal, skipped reason, and verification.
   - Include exact commands only after live-help verification. Never present
     low-confidence rows as executable.

## Mutations

Only mutate after explicit approval of the exact rows or plan.

- Transition: list transitions first, then use only the approved done/resolved
  target.
- Link enrichment: if links are missing, offer `jira workitem link weblink`
  for PR/repo URLs after querying links and verifying help. Do not claim this
  creates native development-panel links.
- PR title fix: for Bitbucket, update title only when `twg bitbucket` can read
  the PR, write access is verified, the PR is confidently tied to the item, and
  the user approved it. For GitHub, update only when an authenticated write tool
  is available and access is verified; otherwise skip with the reason.
- Verification: re-read each changed workitem and PR. Report changed keys,
  statuses, URLs, and failed rows.

Do not transition medium-confidence items automatically. Do not transition
declined/superseded PRs or rows supported only by same author, same repo, or
fuzzy similarity.

## Output

Lead with the decision summary:

- executable high-confidence rows,
- review-needed medium-confidence rows,
- skipped unsafe rows,
- missing repo/auth/permission coverage.

Then provide the dry-run table and exact approval question. Include URLs or
stable IDs for every workitem and PR used as evidence.
