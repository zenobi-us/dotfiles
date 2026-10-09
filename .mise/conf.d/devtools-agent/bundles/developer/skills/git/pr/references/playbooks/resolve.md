# Resolving PR reviews

Execution spec for the `pr` skill. Read it when a PR has review comments to address or
failing CI checks to fix. `<PR>` below is the PR number or URL.

Load `../rules/fixed-decisions.md` before Stage 3. Use the `skill://commit` skill for commit mechanics and message rules when committing review fixes. Load
`../rules/repository-conventions.md` when Stage 5 needs the repository's own check commands.

**Process EVERY unresolved thread. No skipping. Zero unresolved threads is the only
acceptable end state.**

## Contents

- [Prerequisites](#prerequisites)
- [Workflow overview](#workflow-overview)
- [Stage 1: Fetch PR context](#stage-1-fetch-pr-context-always-fresh)
- [Stage 2: Analysis](#stage-2-analysis-no-code-changes)
- [Stage 3: Rebase on the base branch](#stage-3-rebase-on-the-base-branch-always-before-the-first-fix)
- [Stage 4: Process all review threads](#stage-4-process-all-review-threads)
- [Stage 5: Fix all failing checks](#stage-5-fix-all-failing-checks)
- [Stage 6: Push](#stage-6-push)
- [Stage 7: Verify](#stage-7-verify-always-re-fetch)

## Prerequisites

```bash
gh auth status   # gh auth login if this fails
```

The token needs the `repo` scope and `write:discussion` for the resolve mutation.

## Workflow overview

1. **Fetch PR context** - all review threads, reviewer comments and check statuses, always fresh from GitHub.
2. **Analyse** - classify every fetched thread, comment and check, then get the user's approval.
3. **Rebase** - check nobody else pushed, then fetch and rebase on the PR's base branch, `baseRefName` from Stage 1.1. Always; never a question.
4. **Process all unresolved threads and reviewer comments** - for EACH item: fix → commit → resolve or answer → next.
5. **Fix all failing checks** - one commit per check type.
6. **Push** - one push after all commits, with a lease on the sha Stage 3 checked.
7. **Verify** - re-fetch from GitHub; confirm zero unresolved threads and passing checks.

**Commit cadence (non-negotiable):** each review thread or reviewer comment that changes code
is one commit (fix → use the `skill://commit` mechanics for that single change → resolve the thread or answer the comment →
next item); each CI check type is one commit. Never batch all the changes into a single commit at the end. Follow the commit format in the `skill://commit` skill. A thread resolved by a reply
rather than a change has nothing to commit - see Stage 4.4.

**Always fetch fresh data from GitHub.** Never reuse cached or previously fetched context.

## Stage 1: Fetch PR context (always fresh)

### 1.1 PR details

```bash
gh pr view <PR> --json number,title,state,headRefName,baseRefName,author,url
```

If no PR is given, the current branch must have an open PR; use that one.

### 1.2 Review threads and reviewer comments

```bash
<pr-skill>/scripts/pr.ts threads list --json <PR>
```

It walks every page (the API caps one page at 100) and prints `{ prNumber, total,
unresolved, threads, comments }`. `comments` holds the top-level PR comments and the review
bodies (`CHANGES_REQUESTED` or `COMMENTED`) written by people other than the PR author; bots,
every login passed with `--ignore-author` and hidden comments are left out.
Omit the PR to use the current branch's PR. The underlying queries and mutations are in
`../github-api.md`.

### 1.3 Check status

```bash
gh pr checks <PR> --json name,state,bucket,description
```

Read the JSON yourself rather than piping it: a `| jq '...'` filter needs shell quoting
that differs on PowerShell and cmd. `gh` also has a built-in `--jq` if you want it to
filter, which needs no external binary.

### 1.4 Parse

- **Unresolved threads**: `isResolved == false`.
- **Reviewer comments**: every item of `comments` that asks for something and has no answer
  from the PR author below it on the PR.
- **Failing checks**: `bucket` is `fail` or `cancel`. `gh` normalises `state` into a `bucket` of `pass`, `fail`, `pending`, `skipping` or `cancel` - there is no `conclusion` field, and asking for one makes the command exit with `Unknown JSON field`.

```bash
gh pr checks <PR> --json name,bucket
```

## Stage 2: Analysis (no code changes)

Classify the threads, reviewer comments and checks Stage 1 fetched - never a remembered set.

Copilot review comments are written without access to this repository's own rules and can
suggest solutions that conflict with its conventions. Check every Copilot suggestion against
`CONTRIBUTING.md`, `AGENTS.md`, the linter configuration and the surrounding code before you
accept it. Find the rules that apply to the PR's content first - do not work from a fixed
list.

For each actionable thread, reviewer comment or check, report:

- `severity`: `blocker | high | medium | low | nit`
- `category`: `style | business-logic`
- `validity`: `valid | invalid | uncertain`
- `timing`: `now | later`
- `action`: `fix | respond | defer`
- what is being suggested
- fix options: at least 2 approaches when reasonable, with trade-offs
- the recommended option
- a suggested reply (required when the action is `respond` or `defer`)

Output, in this order:

1. A detailed itemized table with the fields above.
2. A summary grouped by severity, then by `style` vs `business-logic`, `valid` vs
   `invalid` vs `uncertain`, and `now` vs `later`.
3. A proposed action plan: what gets fixed now, what gets a reply or a deferral.

If any feedback is ambiguous or conflicting, ask the user with numbered options and wait.

**Gate:** wait for explicit user approval before you change any code. The one exception is
the PR watch: there the fix-or-ask table in `watch.md` Step 3 replaces this
gate. When no user is present, take the recommended option of each item, write it in the
output and continue.

## Stage 3: Rebase on the base branch (always, before the first fix)

Rebase first, so every fix is made on the latest code and CI runs against it. This is
a fixed decision (`../rules/fixed-decisions.md`) - never ask. Skip it only when the user asked not
to rebase in this request, and say so in the final output.

1. If you are not on the PR branch, `gh pr checkout <PR>` first.
2. The working tree must be clean: apply "A dirty working tree" in `../rules/fixed
   decisions" (commit what belongs to the branch, stop and report the rest, never `git stash`).
3. Read the branch state; the script fetches `origin/<baseRefName>` itself:

   ```bash
   <pr-skill>/scripts/pr.ts meta --json <baseRefName>
   ```

   Stop and report when `fetchOk` is `false`, or when `remoteOnlyCommits` is not empty:
   someone pushed commits this checkout does not have, and the user pulls them first. Keep
   `remoteHeadSha` for Stage 6.
4. Rebase:

   ```bash
   git rebase origin/<baseRefName>
   ```

`baseRefName` comes from Stage 1.1 - never assume `master`. Resolve any conflict, `git rebase
--continue`, then re-run the touched area's checks (`../rules/repository-conventions.md`)
before Stage 4.

## Stage 4: Process all review threads

For each approved unresolved thread, in order:

### 4.1 Understand the comment

Extract `path`, `line`, `body`, and the thread's GraphQL `id`. The comment-intent table
is in `../github-api.md`.

### 4.2 Decide the fix

| Comment pattern | Action |
|---|---|
| Contains a ` ```suggestion ` block | Apply the suggested code directly |
| "Typo", "rename", "change X to Y" | Make the specific text change |
| "Add...", "Include...", "Missing..." | Add the requested code |
| "Remove...", "Delete..." | Remove the specified code |
| "Consider...", "Maybe...", "Nit:" | Apply the improvement - these are still requests |
| A question or a discussion | Address it with a code fix or a reply, then resolve |

No comment is optional. Every thread gets addressed and resolved.

### 4.3 Fix threads, then commit immediately

A `fix` thread changes code. Do not batch. Stage only the affected files and commit with
the repo's semantic format. Infer the type from the comment:

| Comment pattern | Commit type |
|---|---|
| Bug fix, null check, error handling, validation | `fix` |
| Add, include, missing, implement | `feat` |
| Rename, refactor, suggestion, change X to Y | `refactor` |
| Documentation, comments, README | `docs` |
| Performance, optimize | `perf` |
| Style, indent, whitespace | `style` |

The scope is the area of the repository, following the `skill://commit` rules - taken from the
repository's own commit history, not from the raw directory name.

Use the `skill://commit` skill to create this single-thread commit. For example, stage only the affected path and use a semantic subject such as `refactor(users): rename getUser to fetchUser`.

### 4.4 Respond and defer threads: reply instead

A `respond` or `defer` thread produces no code change, so it produces no commit. Post the
reply Stage 2 approved, then resolve the thread on the strength of that reply. Never
invent a commit to satisfy the cadence.

Reply into the thread with the `addPullRequestReviewThreadReply` mutation:

```bash
<pr-skill>/scripts/pr.ts threads reply <THREAD_ID> --body-file reply.md
```

Write the reply to a file; the script hands it to `gh` as `-F body=@<path>` so `gh` reads
it directly. An inline string loses newlines and backticks, and `$(cat ...)` does not exist
in PowerShell - the same reason PR bodies use `--body-file`.

A deferral must say where the work went - an issue, a ticket, a follow-up PR, or an explicit
"not doing this, because". "Later" with no destination is not a deferral.

### 4.5 Resolve the thread

```bash
<pr-skill>/scripts/pr.ts threads resolve <THREAD_ID>
```

Then move to the next thread.

Every thread ends resolved: a `fix` thread after its commit, a `respond` or `defer` thread
after its reply. Do not start Stage 5 until every thread has had one or the other.

### 4.6 Reviewer comments

A top-level comment or a review body cannot be resolved. Treat each approved item like a
thread: a `fix` item gets its commit (4.3), then every item gets one answer on the PR, written
to a file:

```bash
gh pr comment <PR> --body-file reply.md
```

Quote the line you answer, then name the commit that fixed it, or give the reply Stage 2
approved. A deferral says where the work went, as in 4.4.

## Stage 5: Fix all failing checks

```bash
gh pr checks <PR> --json name,state,bucket,description
gh run view <RUN_ID> --log-failed
```

Pick out the `fail` and `cancel` buckets by reading the JSON, not with a shell pipe.

Fix each failure with the repository's own tooling, not with a generic command. The workflow
file behind the failed check names the command it ran:

```bash
gh run view <RUN_ID> --json workflowName,jobs
```

Read that workflow in `.github/workflows/`, then run the same command locally. `../rules/repository-conventions.md`
says where else to look.

Commit each check type separately: `fix(lint): resolve linting errors`,
`fix(tests): update failing assertions`, `fix(build): resolve build errors`,
`style(format): apply formatting`.

Re-run the same check locally before you push.

## Stage 6: Push

Push once, after all the commits, so CI runs once for all of them. The rebase already
happened in Stage 3 - do not ask about it here.

```bash
git push -u --force-with-lease=refs/heads/{headRefName}:{remoteHeadSha} origin HEAD
```

`headRefName` comes from Stage 1.1 and `remoteHeadSha` from Stage 3. The Stage 3 rebase
rewrote pushed commits, so a plain push is rejected. The lease names the sha whose commits
Stage 3 checked, never a bare `--force-with-lease`: a bare lease trusts the remote-tracking
ref, which an IDE background fetch can move, and would then delete commits nobody checked. If
the push is rejected, someone pushed after Stage 3: stop and report it. Never retry with
`--force`.

## Stage 7: Verify (always re-fetch)

```bash
<pr-skill>/scripts/pr.ts threads list <PR>
gh pr checks <PR> --json name,state,bucket,description
```

Verification must use fresh API calls; the script always refetches.

- If any unresolved thread remains, the task is **not** complete - go back to Stage 4.
- Confirm CI is re-running and no new failures appeared.

End the run the way the PR flow does: the PR link alone on the first line of the final
output, with the tick in front of it, never inside a bullet or a sentence.

```markdown
✅ {prUrl}
```

## Final outcome

- A reviewed PR response package: the analysis plus the recommended replies.
- The approved changes landed as atomic commits, one per thread or check type.
- The branch rebased on the latest base branch (unless the user asked not to) and pushed once.
- Zero unresolved review threads, and one answer on the PR for each reviewer comment.
