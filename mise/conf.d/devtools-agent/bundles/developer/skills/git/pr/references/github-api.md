# GitHub API reference

Lookup material for the `pr` skill. Read it for the exact GraphQL/REST calls, the pagination
loop, comment parsing, and error handling. The workflow that uses them is in
`playbooks/resolve.md`.

## Contents

- [Review threads: fetch with pagination](#review-threads-fetch-with-pagination)
- [Review threads: resolve](#review-threads-resolve)
- [Review threads: reply](#review-threads-reply)
- [Reviewer comments](#reviewer-comments)
- [Line comments: post](#line-comments-post)
- [Understanding review comments](#understanding-review-comments)
- [Check failures](#check-failures)
- [gh CLI quick reference](#gh-cli-quick-reference)
- [Errors, permissions and rate limits](#errors-permissions-and-rate-limits)

## Review threads: fetch with pagination

The GraphQL API returns at most 100 items per request. A thread carries `id` (the node id
for mutations), `isResolved`, `isOutdated`, `path`, `line`, and its `comments`.

This is the document `pr.ts threads` sends, shown so the field names are
findable. Do not paste it into a shell: a multi-line single-quoted argument is quoted
differently on PowerShell, cmd and POSIX shells. Run the script instead.

```graphql
query($owner: String!, $repo: String!, $prNumber: Int!, $cursor: String) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $prNumber) {
      reviewThreads(first: 100, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          comments(first: 100) {
            nodes {
              id
              databaseId
              body
              author { login }
              createdAt
              path
              line
              diffHunk
            }
          }
        }
      }
    }
  }
}
```

Variables: `owner`, `repo`, `prNumber`, `cursor`.

Pagination flow:

1. First request: omit `cursor`.
2. Read `pageInfo.hasNextPage`.
3. If `true`, repeat with `-f cursor=<endCursor>`.
4. Continue until `hasNextPage` is `false`.
5. Combine every page's `nodes` array before you process anything.

Do not paginate by hand. The loop needs a `while`, a temp dir and a JSON parser, none of
which are portable, and a shell variable mangles any comment body containing `\n`:

```bash
<pr-skill>/scripts/pr.ts threads list --json <PR_NUMBER>
```

It walks every page, so the result is the complete set:

```json
{ "prNumber": 137, "total": 6, "unresolved": 0, "threads": [ { "id": "PRRT_...", "isResolved": false, "path": "a.md", "line": 12, "comments": [ ... ] } ], "comments": [ ... ] }
```

Omit `--json` for a human summary. The PR is a number or a URL of this repository; omit it to
use the current branch's open PR. `-f` passes string variables to `gh api graphql` and `-F` passes numbers, booleans and
`@file` values; the script uses both.

## Review threads: resolve

```bash
<pr-skill>/scripts/pr.ts threads resolve <THREAD_ID>
```

Order the work: threads with explicit code suggestions, then threads that request a
specific change, then discussion threads, then outdated threads (often already fixed).

## Review threads: reply

For a thread resolved by an answer rather than a change (`respond` or `defer` in Stage 2).
Note the input field is `pullRequestReviewThreadId`, not `threadId`:

```bash
<pr-skill>/scripts/pr.ts threads reply <THREAD_ID> --body-file reply.md
```

The body always comes from a file. The script passes it as `-F body=@<path>`, which makes
`gh` read the file itself, so newlines and backticks survive on every OS - `$(cat ...)`
would not, and does not exist in PowerShell. Reply first, then resolve: the reply is the
reason the thread may close.

## Reviewer comments

`list` also returns `comments`: the top-level PR comments (`IssueComment`) and the review bodies
(`PullRequestReview` in state `CHANGES_REQUESTED` or `COMMENTED`) written by a person other than
the PR author, oldest first:

```json
{ "kind": "review", "state": "CHANGES_REQUESTED", "id": "PRR_...", "author": "lead", "url": "https://github.com/.../pull/137#pullrequestreview-1", "body": "...", "createdAt": "..." }
```

Left out: actors of type `Bot` (Copilot, `github-actions`), every login passed with
`--ignore-author`, hidden comments and reviews with an empty body (their inline comments are
review threads). Some repositories run automation under a normal user account; name those
logins with `--ignore-author <login>` so their comments do not read as a review. These items cannot be resolved; answer one with a
top-level comment from a file:

```bash
gh pr comment <PR_NUMBER> --body-file reply.md
```

## Line comments: post

`POST /repos/{owner}/{repo}/pulls/{pull_number}/comments` needs `commit_id` (the PR head sha),
`path`, `line` and `side` besides `body`. The script looks up the head sha and sends all of them:

```bash
<pr-skill>/scripts/pr.ts threads comment <PR_NUMBER> --path <file> --line <n> --body-file comment.md
```

`--side` is `RIGHT` (the new code, the default) or `LEFT` (the removed code). `line` is the
line number in that side of the file, and it must be inside the PR's diff, or GitHub answers 422.
Each call starts a new review thread.

## Understanding review comments

**Inline comments** carry `path` and `line` and a `diffHunk` for context; they can have
replies in the same thread. **General comments** are top-level and carry no line.
**Suggested changes** hold a fenced ` ```suggestion ` block - take the content between
the markers and apply it at the comment's line.

| Pattern | Intent | Action |
|---|---|---|
| "Typo in..." | Spelling or grammar | Correct the typo |
| "Rename to..." | Rename | Rename as specified |
| "Missing..." | Something is absent | Add the missing element |
| "Remove..." | Something is unwanted | Remove the specified code |
| "Consider..." | Suggestion | Evaluate, then apply |
| "Nit:" | Minor style issue | Fix the style issue |
| "LGTM" | Approved | No action |
| A fenced code block | Suggested replacement | Apply the suggested code |

## Check failures

| Check name pattern | Type |
|---|---|
| `lint`, `eslint` | Linting |
| `test`, `jest`, `vitest` | Tests |
| `build`, `compile` | Build |
| `typecheck`, `tsc` | Type checking |
| `coverage` | Code coverage |
| `security`, `codeql` | Security |
| `format`, `prettier` | Formatting |

Fix each one with the repository's own tooling - see `playbooks/resolve.md`,
Stage 5 "Fix all failing checks". Read the detail with:

```bash
gh pr checks <PR_NUMBER> --json name,state,bucket,description
gh run list --branch <BRANCH>
gh run view <RUN_ID> --log-failed
```

## gh CLI quick reference

```bash
gh pr view <PR_NUMBER> --json number,title,state,headRefName,baseRefName,author,url
gh pr checks <PR_NUMBER> --json name,state,bucket
gh pr diff <PR_NUMBER>

gh pr comment <PR_NUMBER> --body-file comment.md
gh repo view --json nameWithOwner --jq .nameWithOwner
```

## Errors, permissions and rate limits

| Status | Meaning | Resolution |
|---|---|---|
| 401 | Bad credentials | `gh auth login` |
| 403 | Forbidden | Check the token scopes |
| 404 | Not found | Verify the repo and the PR number |
| 422 | Validation failed | Wrong PR number, wrong repo path, a line outside the diff, or a bad request body |

Required scopes: `repo` for full repository access, `write:discussion` to resolve threads.
Check with `gh auth status`.

Rate limits are 5000 requests/hour for REST and 5000 points/hour for GraphQL; check with
`gh api rate_limit`.
