# GitHub PR Review Resolution Reference

## Understanding Review Comments

### Comment Types

**Inline comments**: Attached to specific lines in files
- Have `path` and `line` properties
- Include `diff_hunk` showing surrounding context
- May be part of a thread with multiple replies

**General comments**: Top-level review comments
- Not attached to specific code lines
- Often contain overall review feedback

**Suggested changes**: Comments with code suggestions
```markdown
```suggestion
// Fixed code here
```​
```

### Parsing Comment Intent

Common patterns to identify what needs fixing:

| Pattern | Intent | Action |
|---------|--------|--------|
| "Typo in..." | Spelling/grammar fix | Correct the typo |
| "Rename to..." | Variable/function rename | Rename as specified |
| "Missing..." | Something needs to be added | Add the missing element |
| "Remove..." | Something should be deleted | Remove the specified code |
| "Consider..." | Suggestion, not required | Evaluate and apply if appropriate |
| "Nit:" | Minor style issue | Fix the style issue |
| "LGTM" | Approved, no changes | No action needed |
| Code block in comment | Suggested replacement | Apply the suggested code |

### Extracting Suggestions

When a comment contains a suggestion block, look for:

```
```suggestion
replacement code here
```​
```

Extract the content between the markers and apply it to the specified line.

## Understanding Check Failures

### Common CI/CD Checks

| Check Name Pattern | Type | Common Fixes |
|-------------------|------|--------------|
| `lint`, `eslint`, `pylint` | Linting | Format code, fix style issues |
| `test`, `jest`, `pytest` | Tests | Fix failing tests, update snapshots |
| `build`, `compile` | Build | Fix compilation errors |
| `typecheck`, `tsc` | Type checking | Fix type errors |
| `coverage` | Code coverage | Add more tests |
| `security`, `codeql` | Security | Fix vulnerabilities |
| `format`, `prettier` | Formatting | Run formatter |

### Interpreting Check Output

View check details with:

```bash
# List all checks with status
gh pr checks <PR_NUMBER> --json name,state,conclusion,description

# View failed workflow logs
gh run view <RUN_ID> --log-failed
```

### Common Fix Patterns

**Linting failures:**
```bash
# Run the project's linter with auto-fix
npm run lint -- --fix
# or
ruff check --fix .
```

**Test failures:**
1. Read test output to identify failing tests
2. Check if failure is in test or implementation
3. Fix the root cause
4. Re-run tests to verify

**Type errors:**
1. Identify missing types or incorrect types
2. Add proper type annotations
3. Update function signatures

**Build failures:**
1. Check for syntax errors
2. Verify import paths
3. Ensure all dependencies are installed

## Thread Resolution Workflow

### GraphQL Thread Structure

Threads contain:
- `id`: GraphQL node ID for mutations
- `isResolved`: Boolean indicating resolution status
- `path`: File path
- `line`: Line number
- `comments`: Array of comments in thread

### Fetching Threads (with Pagination)

The GitHub GraphQL API returns max 100 items per request. Use cursor-based pagination to fetch all threads:

```bash
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
              body
              author { login }
              path
              line
            }
          }
        }
      }
    }
  }
}' -f owner=OWNER -f repo=REPO -F prNumber=PR_NUMBER
```

**Pagination flow:**
1. First request: omit the `cursor` parameter (or pass empty string)
2. Check `pageInfo.hasNextPage` in response
3. If `true`, make another request with `-f cursor=<endCursor>`
4. Repeat until `hasNextPage` is `false`
5. Combine all `nodes` arrays from each page

### Resolving a Thread

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

### Resolution Best Practice

1. **Address the comment**: Make the requested change
2. **Commit**: Create a commit for the fix
3. **Resolve**: Call the resolve mutation
4. **Move to next**: Process the next thread

### Resolution Order

Process threads in this order:
1. Threads with explicit code suggestions
2. Threads requesting specific changes
3. Discussion threads (may not need code changes)
4. Outdated threads (may already be fixed)

## Git Workflow for PR Updates

### Fetching PR Branch

```bash
# Get the branch name
BRANCH=$(gh pr view <PR_NUMBER> --json headRefName -q '.headRefName')

# Fetch and checkout
git fetch origin $BRANCH
git checkout $BRANCH
```

### Pushing Fixes

```bash
# Stage changes
git add .

# Commit with meaningful message
git commit -m "fix: address review feedback

- Fixed typo in function name
- Added missing null check
- Updated type annotations"

# Push to the PR branch
git push origin $BRANCH
```

### Force Push Considerations

After rebasing or amending:
```bash
git push origin $BRANCH --force-with-lease
```

## GitHub CLI Quick Reference

### PR Operations

```bash
# View PR details
gh pr view <PR_NUMBER> --json number,title,state,headRefName,baseRefName,author,url

# View PR checks
gh pr checks <PR_NUMBER>
gh pr checks <PR_NUMBER> --json name,state,conclusion

# View PR diff
gh pr diff <PR_NUMBER>
```

### Workflow/Run Operations

```bash
# List recent runs
gh run list --branch <BRANCH>

# View run details
gh run view <RUN_ID>

# View failed logs
gh run view <RUN_ID> --log-failed
```

### GraphQL Operations

```bash
# Generic GraphQL query
gh api graphql -f query='<QUERY>' -f var1=value1 -F numVar=123

# Note: -f for string variables, -F for non-string (numbers, booleans)
```

## Error Handling

### Common Errors

| Status | Meaning | Resolution |
|--------|---------|------------|
| 401 | Bad credentials | Run `gh auth login` |
| 403 | Forbidden | Check token permissions |
| 404 | Not found | Verify repo/PR exists |
| 422 | Validation failed | Check request body |

### Token Permissions

Required scopes for PR resolution:
- `repo`: Full repository access
- `write:discussion`: For resolving threads

Check current auth status:
```bash
gh auth status
```

## Rate Limits

GitHub API has rate limits:
- REST API: 5000 requests/hour
- GraphQL: 5000 points/hour (some queries cost more)

### Checking Rate Limit

```bash
gh api rate_limit
```
