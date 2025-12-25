---
name: github-pr-resolver
description: "Automate GitHub pull request review resolution by processing ALL review comments and fixing ALL failing CI checks. Use when: (1) A PR has review comments that need to be addressed and resolved, (2) CI/CD checks are failing and need fixes, (3) You want to process all PR feedback and mark conversations as resolved, (4) You need to iterate on PR feedback quickly. IMPORTANT: This skill processes EVERY comment - no skipping allowed. Always fetches fresh data from GitHub. The only acceptable end state is zero unresolved threads. COMMIT CADENCE: Each thread gets its own commit (fix → commit → resolve → next). Never batch commits at the end."
---

# GitHub PR Resolver

Automate the process of addressing pull request review feedback by processing **ALL** comments, making code fixes, resolving **EVERY** conversation thread, and fixing **ALL** failing CI checks.

**This skill does NOT skip any comments. Every unresolved thread must be addressed and resolved.**

## Prerequisites

```bash
# Verify gh CLI is installed and authenticated
gh auth status

# If not authenticated, run:
gh auth login
```

Token requires `repo` scope for full repository access.

## Workflow Overview

1. **Fetch PR context** → Get all review threads and check statuses (always fresh from GitHub)
2. **Process ALL unresolved threads** → For EACH thread: fix → commit → resolve → repeat
3. **Fix ALL failing checks** → Address every failure, **commit per check type**
4. **Push changes** → Single push after all commits
5. **Verify** → Re-fetch from GitHub and confirm ALL threads resolved and ALL checks passing

**COMMIT CADENCE (NON-NEGOTIABLE):**
- **Each review thread** = 1 commit (fix → `git add` → `git commit` → resolve thread → next thread)
- **Each CI check type** = 1 commit (lint fixes, test fixes, build fixes are separate commits)
- **NEVER batch all changes into a single commit at the end**

**CRITICAL REQUIREMENTS:**
- **Always fetch fresh data from GitHub.** Never use cached or previously fetched context.
- **Process EVERY unresolved comment.** Do NOT skip any threads. Each comment must be addressed and resolved.
- **Zero unresolved threads** is the only acceptable end state.

## Commit Convention

Each change gets its own commit using conventional commit format:

```
<type>(<scope>): <description>
```

**Type inference from comment:**

| Comment Pattern | Commit Type |
|----------------|-------------|
| Bug fix, null check, error handling, validation | `fix` |
| Add, include, missing, implement | `feat` |
| Rename, refactor, suggestion, change X to Y | `refactor` |
| Documentation, comments, README | `docs` |
| Performance, optimize | `perf` |
| Style, indent, whitespace | `style` |

**Scope from file path:**
- Extract directory/module name: `src/services/UserService.ts` → `services`
- Skip common prefixes: `src`, `lib`, `app`
- Root files use filename: `index.ts` → `index`

**CI check commits:**
- Lint fixes → `fix(lint): resolve linting errors`
- Test fixes → `fix(tests): update failing assertions`
- Build/type errors → `fix(build): resolve build errors`
- Formatting → `style(format): apply formatting`

## Step 1: Fetch PR Context (Always Fresh)

**CRITICAL: Always fetch fresh data from GitHub. Never reuse previously fetched context data.**

### 1.1 Get PR Details

```bash
# Get PR metadata
gh pr view <PR_NUMBER> --json number,title,state,headRefName,baseRefName,author,url
```

### 1.2 Get Review Threads (GraphQL with Pagination)

Use GraphQL to fetch review threads with resolution status. **The API returns max 100 items per request, so pagination is required for PRs with many threads.**

```bash
# First page (no cursor)
gh api graphql -f query='
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
}' -f owner=OWNER -f repo=REPO -F prNumber=PR_NUMBER
```

**Handling pagination:**

```bash
# Check if more pages exist
HAS_NEXT=$(echo "$RESULT" | jq '.data.repository.pullRequest.reviewThreads.pageInfo.hasNextPage')
END_CURSOR=$(echo "$RESULT" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.endCursor')

# If hasNextPage is true, fetch next page with cursor
if [ "$HAS_NEXT" = "true" ]; then
  gh api graphql -f query='...' -f owner=OWNER -f repo=REPO -F prNumber=PR_NUMBER -f cursor="$END_CURSOR"
fi
```

**IMPORTANT: Continue fetching pages until `hasNextPage` is `false`. Collect ALL threads before processing.**

### 1.3 Get Check Status

```bash
# Get all checks for the PR
gh pr checks <PR_NUMBER>

# For detailed check information
gh pr checks <PR_NUMBER> --json name,state,conclusion,description
```

### 1.4 Parse the Context

After fetching, identify:
- **Unresolved threads**: Where `isResolved: false`
- **Failing checks**: Where `conclusion` is `failure`, `cancelled`, `timed_out`, or `action_required`

```bash
# Count unresolved threads
echo "Unresolved threads: $(echo "$THREADS_JSON" | jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)] | length')"

# List failing checks
gh pr checks <PR_NUMBER> --json name,conclusion | jq '.[] | select(.conclusion == "failure")'
```

## Step 2: Process ALL Review Threads

**MANDATORY: Process EVERY unresolved thread. Do NOT skip any comments.**

For each unresolved thread (iterate through ALL of them):

### 2.1 Understand the Comment

Extract the first comment (thread initiator) and understand what's requested:

```bash
# For each unresolved thread, extract:
# - path: file path
# - line: line number
# - body: comment text
# - thread_id: GraphQL ID for resolution
```

### 2.2 Identify Fix Type

**ALL comments require action. Determine the appropriate fix:**

| Comment Pattern | Action Required |
|----------------|-----------------|
| Contains ` ```suggestion ` | Apply the suggested code directly |
| "Typo", "rename", "change X to Y" | Make the specific text change |
| "Add...", "Include...", "Missing..." | Add the requested code/content |
| "Remove...", "Delete..." | Remove the specified code |
| "Consider...", "Maybe...", "Nit:" | Apply the improvement (these are still requests) |
| Question or discussion | Address with code fix or reply, then resolve |

**No comment is optional. Every thread must be addressed and resolved.**

### 2.3 Apply Code Suggestions

For comments with explicit suggestions, extract and apply:

```bash
# Suggestion blocks look like:
# ```suggestion
# replacement code here
# ```

# Extract suggestion content and apply to the file at the specified line
```

### 2.4 Make the Fix

1. Open the file at `path`
2. Navigate to `line`
3. Apply the required change
4. Save the file

### 2.5 Commit the Fix (IMMEDIATELY - DO NOT BATCH)

**CRITICAL: Commit IMMEDIATELY after EACH fix. Do NOT wait until the end. Do NOT batch commits.**

After making each fix, commit it immediately with a conventional commit message:

```bash
# Stage only the affected file
git add <path>

# Commit with conventional message
git commit -m "<type>(<scope>): <description>"
```

**Example commits:**
- `refactor(services): rename getUser to fetchUser`
- `fix(auth): add null check for token`
- `feat(api): add retry logic per review`
- `docs(utils): add JSDoc for helper function`

### 2.6 Resolve the Thread

After committing, resolve the thread via GraphQL:

```bash
gh api graphql -f query='
mutation($threadId: ID!) {
  resolveReviewThread(input: {threadId: $threadId}) {
    thread {
      id
      isResolved
    }
  }
}' -f threadId="<THREAD_ID>"
```

**REPEAT Steps 2.1-2.6 for EACH unresolved thread. Each thread = 1 commit. Do NOT move to Step 3 until all threads have been processed with individual commits.**

## Step 3: Fix Failing Checks

### 3.1 Analyze Failures

```bash
# List all failing checks
gh pr checks <PR_NUMBER> --json name,state,conclusion,description | jq '.[] | select(.conclusion == "failure")'

# View workflow run logs for details
gh run view <RUN_ID> --log-failed
```

### 3.2 Common Check Fixes

**Linting (eslint, pylint, ruff):**
```bash
# JavaScript/TypeScript
npm run lint -- --fix
npx eslint . --fix

# Python
ruff check --fix .
black .
```

**Type Checking (tsc, mypy, pyright):**
- Fix type errors shown in check output
- Add missing type annotations
- Update incorrect types

**Tests (jest, pytest, vitest):**
- Read test output to identify failures
- Fix the failing test or the implementation
- Update snapshots if needed: `npm test -- -u`

**Formatting (prettier, black):**
```bash
npx prettier --write .
black .
```

**Build (webpack, vite, tsc):**
- Fix syntax errors
- Resolve import issues
- Ensure dependencies are installed

### 3.3 Commit Each Check Fix

After fixing each check type, commit separately:

```bash
# After fixing lint errors
git add .
git commit -m "fix(lint): resolve linting errors"

# After fixing test failures
git add .
git commit -m "fix(tests): update failing assertions"

# After fixing build/type errors
git add .
git commit -m "fix(build): resolve build errors"

# After fixing formatting
git add .
git commit -m "style(format): apply formatting"
```

### 3.4 Re-run Checks Locally

Before pushing, verify fixes locally:

```bash
# Run the same commands CI runs
npm run lint
npm run test
npm run build
```

## Step 4: Push All Commits

After all review threads and CI checks have been addressed with individual commits, push once:

```bash
# Get the branch name
BRANCH=$(gh pr view <PR_NUMBER> --json headRefName -q '.headRefName')

# Push all commits to PR branch
git push origin $BRANCH
```

This triggers a single CI run for all changes rather than multiple runs per commit.

## Step 5: Verify Resolution (Always Re-fetch)

After pushing, **ALWAYS fetch fresh data from GitHub to verify** - never rely on previously fetched context:

1. **ALL threads show as resolved** (zero unresolved remaining)
2. CI checks are re-running
3. No new failures introduced

```bash
# Re-fetch threads (fresh API call with pagination support)
gh api graphql -f query='
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
        }
      }
    }
  }
}' -f owner=OWNER -f repo=REPO -F prNumber=PR_NUMBER

# Count remaining unresolved (remember to paginate if hasNextPage is true)
UNRESOLVED=$(echo "$RESULT" | jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)] | length')
echo "Remaining unresolved: $UNRESOLVED"

# Check CI status
gh pr checks <PR_NUMBER>
```

**IMPORTANT:**
- Verification MUST use fresh API calls to ensure you see the actual current state on GitHub.
- **If ANY unresolved threads remain, the task is NOT complete.** Go back and process them.
- The only acceptable end state is **zero unresolved threads**.

## Complete Example

```bash
#!/bin/bash
# Complete workflow to resolve ALL PR feedback

PR_NUMBER=$1
REPO="owner/repo"  # Or extract from current git remote
OWNER=${REPO%/*}
REPO_NAME=${REPO#*/}

# 1. Fetch fresh context from GitHub
echo "Fetching PR #$PR_NUMBER..."
PR_INFO=$(gh pr view $PR_NUMBER --json number,title,headRefName,baseRefName)
BRANCH=$(echo $PR_INFO | jq -r '.headRefName')
echo "PR: $(echo $PR_INFO | jq -r '.title')"
echo "Branch: $BRANCH"

# Fetch ALL review threads with pagination
ALL_THREADS="[]"
CURSOR=""

while true; do
  if [ -z "$CURSOR" ]; then
    CURSOR_ARG=""
  else
    CURSOR_ARG="-f cursor=$CURSOR"
  fi

  RESULT=$(gh api graphql -f query='
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
          path
          line
          comments(first: 100) {
            nodes {
              body
              author { login }
            }
          }
        }
      }
    }
  }
}' -f owner=$OWNER -f repo=$REPO_NAME -F prNumber=$PR_NUMBER $CURSOR_ARG)

  # Append threads from this page
  PAGE_THREADS=$(echo $RESULT | jq '.data.repository.pullRequest.reviewThreads.nodes')
  ALL_THREADS=$(echo "$ALL_THREADS $PAGE_THREADS" | jq -s 'add')

  # Check for next page
  HAS_NEXT=$(echo $RESULT | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.hasNextPage')
  if [ "$HAS_NEXT" != "true" ]; then
    break
  fi
  CURSOR=$(echo $RESULT | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.endCursor')
done

UNRESOLVED_COUNT=$(echo $ALL_THREADS | jq '[.[] | select(.isResolved == false)] | length')
TOTAL_COUNT=$(echo $ALL_THREADS | jq 'length')
echo "Total threads: $TOTAL_COUNT"
echo "Unresolved threads: $UNRESOLVED_COUNT"

# 2. Checkout PR branch
git fetch origin $BRANCH
git checkout $BRANCH

# 3. Process EACH unresolved thread (Claude does this interactively)
# For each thread:
#   - Read the comment
#   - Make the fix
#   - git add <file>
#   - git commit -m "<type>(<scope>): <description>"
#   - gh api graphql ... resolve mutation
#   - Move to next thread

# 4. Fix failing checks (one commit per check type)
gh pr checks $PR_NUMBER --json name,conclusion | jq '.[] | select(.conclusion == "failure")'
# Fix each failing check type and commit separately

# 5. Push all commits
git push origin $BRANCH

# 6. Verify - re-fetch ALL pages and confirm zero unresolved
# (Use same pagination loop as above)
if [ "$REMAINING" -gt 0 ]; then
    echo "⚠️  WARNING: $REMAINING threads still unresolved!"
    echo "Must go back and process remaining threads."
else
    echo "✅ All threads resolved!"
fi
```

## Reference

See `references/github_api_reference.md` for:
- Detailed comment intent patterns
- CI check types and common fixes
- API rate limits and error handling
- Git workflow best practices
