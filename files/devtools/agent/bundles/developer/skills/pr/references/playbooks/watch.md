# Watching a pull request

Execution spec for the `pr` skill. Read it after `create.md` Step 7,
or when the user asks to watch, monitor or babysit an open PR. It waits for CI, the review
threads and the reviewer comments, fixes what it can without asking, and asks the user only for the decisions in
[Step 3](#step-3-triage-fix-or-ask).

Load `../rules/fixed-decisions.md` before Step 3.

## Contents

- [When it runs](#when-it-runs)
- [Step 1: Run the watch script](#step-1-run-the-watch-script)
- [Step 2: Read the event](#step-2-read-the-event)
- [Step 3: Triage: fix or ask](#step-3-triage-fix-or-ask)
- [Step 4: Do the round](#step-4-do-the-round)
- [Stop rules](#stop-rules)
- [Step 5: Summary output](#step-5-summary-output)

## When it runs

| Flow | Watch |
|---|---|
| After the PR is created or updated | Always - a fixed decision (`../rules/fixed-decisions.md`). Skip it only when the request has `no-watch` or no user is present (the last row). |
| The user asks to watch an open PR | Yes, from Step 1, with that PR number or URL |
| No user is present: CI (`GITHUB_ACTIONS=true`) or another headless run | Never: the watch has no fixed end and its ask items wait for a user. The PR flow ends at its summary. |

## Step 1: Run the watch script

```bash
<pr-skill>/scripts/pr.ts watch <pr> --max-wait <minutes> [--since <time>]
```

`<pr>` is the PR number or URL. On the first run leave out `--since`; every later run of the
same watch passes the value Step 2 gives.

It polls GitHub and exits with one JSON object when the PR settles: every check has finished
and the Copilot review is in (or is not expected, or did not come in time). Two polls in a row
must see the same settled PR: the same head, every check in the same state, the same Copilot
status, the same unresolved threads and the same new reviewer comments. So checks that a push
has not registered yet cannot end it early.
Progress lines go to stderr.

| Harness | Run it |
|---|---|
| Claude Code | In the background (`run_in_background: true`) with `--max-wait 60`. The harness wakes you when it exits, and the user can keep working. Do not poll its output and do not sleep. Start it, then end the turn with the `create.md` Step 7 summary, or with a line that starts with `✅ {prUrl}` when there was no PR flow. |
| Any other harness | In the foreground with `--max-wait 8` and a tool timeout of 10 minutes. If the harness allows less, set `--max-wait` to that limit minus 1 minute. |

| Option | Default | Why |
|---|---|---|
| `--interval` | 30 s | About 5 GitHub calls a poll, far below the rate limit |
| `--copilot-wait` | 15 min after the PR opened | Copilot reviews in about 4 minutes; after 15 it is not coming |
| `--max-wait` | 8 min | Fits in a 10-minute tool timeout |
| `--since` | The commit time of the PR head (the last push) | Reviewer comments and review bodies after it are new; the older ones were there before this push |

Copilot reviews a PR once, when it opens, and never a draft (the "run copilot reviews on
development branches" ruleset has `review_on_push: false`). A round after the first sees only
CI and human comments. Do not ask Copilot for a new review.

## Step 2: Read the event

| `event` | Exit | Do |
|---|---|---|
| `done` | 0 | Step 5 |
| `action-needed` | 10 | Step 3 with `checks.failed`, `threads.items` and `comments.items`. The next Step 1 run passes `--since {comments.latestAt}`. |
| `timeout` | 11 | Run Step 1 again with `--since {comments.since}`. If `localHeadMatches` is `false`, stop instead: someone else pushed to the branch, or the push did not arrive. |
| `closed` | 12 | Stop: the PR was merged or closed. Step 5. |
| - | 1 | Stop and report the error |

## Step 3: Triage: fix or ask

Run `resolve.md` Stage 1 and Stage 2: a fresh fetch, then the classification of
every thread and failed check. In this flow the table below replaces the Stage 2 approval
gate, and the Stage 2 output is only the itemized table with one more column, `route` (`fix` or
`ask`). Comments from human reviewers get the same triage as Copilot comments. Of the Stage 1
`comments`, triage only the ones in the event's `comments.items`: the others came before this
watch's `--since` and were answered in an earlier round or before the push.

**Ask the user** when one of these is true. The first match decides.

| # | Condition |
|---|---|
| 1 | The fix changes a file the PR does not change yet, in an area a wrong change is expensive in: CI and repository automation (`.github/**`), authentication, the database, payments, deployment, or a dependency lock file |
| 2 | `severity` is `blocker` or `high` and `category` is `business-logic` |
| 3 | `validity` is `uncertain`, two items conflict, or the fix options behave differently for a user |
| 4 | The fix changes a public contract (REST, GraphQL schema, database schema, event, configuration key), stored data or behaviour a user can see, and the PR did not set out to change it |
| 5 | The `action` is `defer`: the user chooses the destination (an issue, a ticket, a follow-up PR or "not doing this") |
| 6 | The comment asks about intent, product or priority, which only the author can answer |
| 7 | A check fails again with the same error after a fix or a rerun in this watch. A new error in the same check is a new fix item. |
| 8 | The Stage 3 rebase has a conflict |
| 9 | A check failed on the branch name or the PR title, and the repository generates the title from the branch name. Renaming the head branch of an open PR closes the PR, so the options are a new branch with a valid name and a new PR, or this PR with the failing check. |

**Fix without asking** in all other cases:

| Item | Do |
|---|---|
| A `valid` comment | Fix it: Stage 4.2 and 4.3, one commit, then resolve the thread or answer the reviewer comment (Stage 4.6) |
| An `invalid` comment: a suggestion the repository's own rules forbid (even when it starts with "Consider"), or code the PR already changed | Reply with the reason, then resolve (Stage 4.4), or answer the reviewer comment (Stage 4.6). Name the rule and where it is written. |
| A failed check in an area the PR touches (lint, format, types, unit tests, build) | Fix it with that area's own command (Stage 5), one commit for each check type |
| A failed check that the diff cannot cause and that can pass on a new try (runner or network error, timeout, a known flaky E2E) | `gh run rerun <run-id> --failed` once, with the run id from `link`. No commit. |
| A failed check that fails the same way on the base branch | No fix and no rerun. Put it in the summary as not caused by this PR. |
| An aggregate check failed (a job that only gathers the other results) | It failed because another job failed. Fix that job. |

## Step 4: Do the round

1. Rebase on the base branch (Stage 3). It reads `remoteHeadSha` for this round and stops when
   someone else pushed. A conflict is an ask item (row 8).
2. Do every fix item, one at a time, with the commit cadence of Stage 4 and Stage 5.
3. If there are commits, push once (Stage 6, with the lease on this round's `remoteHeadSha`)
   and start no rerun: the push makes new checks, and a rerun would run the old head again.
   Only a round with no commit starts its reruns.
4. If there are ask items, ask them all in one message that starts with the `✅ {prUrl}`
   line: number each item and give numbered options, the recommended one first. Keep their
   threads open. Wait for the answer, apply it with the same cadence, then push once.
5. Go back to Step 1 with `--since {comments.latestAt}` from the last event.

A round with no commit, no reply and no rerun has nothing to wait for: go to Step 5.

## Stop rules

- At most 3 rounds. A round is one pass of Step 4 that pushes. After the third, stop and report
  what is still open.
- At most 90 minutes of watching in total (the sum of the Step 1 runs).
- At most one rerun for each check on each head commit.
- The Stage 6 push leases this round's `remoteHeadSha`: never a bare `--force-with-lease`, never
  `--force`. If it is rejected, stop and report.

## Step 5: Summary output

The PR link is the first line, alone, with the tick, as in `create.md` Step 7.

```markdown
✅ {prUrl}

Watch: {done | stopped: {reason}}

- Rounds: {n} ({commits} commits, {replies} replies, {reruns} reruns)
- Checks: {all pass | failing: {names}} {(not caused by this PR: {names})}
- Threads: {0 unresolved | open: {count} - {why}}
- Reviewer comments: {none | {answered} answered | open: {count} - {why}}
- Asked: {the decisions the user made, or none}
```
