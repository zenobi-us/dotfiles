# GitHub API Reference for PR Comment Analysis

## GraphQL Queries

### Fetch Review Threads with Full Context

**Query:** ReviewThreads with pagination

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
              author { 
                login
                name
              }
              createdAt
              updatedAt
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

**Usage:**
```bash
gh api graphql -f query='...' -f owner=<owner> -f repo=<repo> -F prNumber=<number>

# With cursor for pagination
gh api graphql -f query='...' -f owner=<owner> -f repo=<repo> -F prNumber=<number> -f cursor="<cursor_value>"
```

### Fetch PR Metadata

```graphql
query($owner: String!, $repo: String!, $prNumber: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $prNumber) {
      number
      title
      body
      state
      author {
        login
        name
      }
      createdAt
      updatedAt
      headRefName
      baseRefName
      commits(first: 100) {
        nodes {
          oid
          messageHeadline
          committedDate
          additions
          deletions
        }
      }
    }
  }
}
```

### Fetch File Changes

```graphql
query($owner: String!, $repo: String!, $prNumber: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $prNumber) {
      files(first: 100) {
        nodes {
          path
          changeType
          additions
          deletions
          changeType
        }
      }
    }
  }
}
```

## REST API Endpoints

### Get PR Information

```bash
# Get PR metadata
gh pr view <PR_NUMBER> --json number,title,state,author,createdAt,updatedAt,headRefName,baseRefName

# Get PR body/description
gh pr view <PR_NUMBER> --json body
```

### Get PR Checks

```bash
# List all checks
gh pr checks <PR_NUMBER>

# Get detailed check information
gh pr checks <PR_NUMBER> --json name,state,conclusion,description,startedAt,completedAt
```

### List Review Comments

```bash
# List all comments on the PR
gh api repos/<owner>/<repo>/pulls/<pr_number>/comments

# Filter by state
gh api repos/<owner>/<repo>/pulls/<pr_number>/comments --paginate
```

## Pagination Pattern

### Handling Large Result Sets

GitHub API returns max 100 items per request. For PRs with many comments/threads, implement pagination:

```bash
#!/bin/bash
# Pagination template

ALL_RESULTS="[]"
CURSOR=""

while true; do
  # Build query with cursor (null on first iteration)
  CURSOR_VAR=""
  if [ -n "$CURSOR" ]; then
    CURSOR_VAR="-f cursor=\"$CURSOR\""
  fi

  # Fetch page
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
          # ... fields ...
        }
      }
    }
  }
}' -f owner="$OWNER" -f repo="$REPO" -F prNumber="$PR_NUMBER" $CURSOR_VAR)

  # Extract and accumulate results
  PAGE_DATA=$(echo "$RESULT" | jq '.data.repository.pullRequest.reviewThreads.nodes')
  ALL_RESULTS=$(echo "$ALL_RESULTS $PAGE_DATA" | jq -s 'add')

  # Check if more pages
  HAS_NEXT=$(echo "$RESULT" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.hasNextPage')
  if [ "$HAS_NEXT" != "true" ]; then
    break
  fi

  # Get cursor for next page
  CURSOR=$(echo "$RESULT" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.endCursor')
done

echo "$ALL_RESULTS" | jq '.'
```

## Comment Classification Patterns

### Identifying Comment Intent

| Pattern | Type | Examples |
|---------|------|----------|
| `null check`, `error handling`, `validation` | Bug Fix | "Add null check", "This needs error handling" |
| `add`, `include`, `missing` | Feature | "Add retry logic", "Include timeout" |
| `rename`, `refactor`, `simplify`, `suggest` | Code Quality | "Rename to", "Simplify by using" |
| `doc`, `comment`, `JSDoc`, `README` | Documentation | "Add JSDoc", "Document this behavior" |
| `optimize`, `performance`, `cache` | Performance | "Cache this result", "Optimize query" |
| `test`, `coverage`, `assertion` | Testing | "Add test for", "Test this case" |
| `architecture`, `pattern`, `design` | Architecture | "Use dependency injection", "Factory pattern" |
| `?`, `why`, `discuss`, `question` | Discussion | "Why choose this?", "Have you considered?" |
| `Nit:`, `prefer`, `style`, `whitespace` | Nit/Style | "Prefer const", "Extra whitespace" |

### Detecting Outdated Comments

Check these indicators:

1. **File Deleted**: Path no longer exists in PR
2. **Line Removed**: Line number beyond file length
3. **Code Changed**: diffHunk no longer matches current code
4. **Explicit Mark**: `isOutdated: true` from API
5. **Timestamp Check**: Comment very old, many commits since

## Rate Limits

### GraphQL API

- **Limit**: 5,000 points per hour (per user or app)
- **Cost**: Each query costs between 1-10 points
- **Recommendation**: Batch requests where possible, check `X-RateLimit-*` headers

```bash
# Check rate limit
gh api rate_limit
```

### REST API

- **Limit**: 60 requests per hour (unauthenticated), 5,000 authenticated
- **Recommendation**: Use GraphQL for bulk operations

## Error Handling

### Common Errors

```bash
# Rate limit exceeded
Error: API error: (403) API rate limit exceeded

# Solution: Wait for reset or check limit
gh api rate_limit | jq '.resources.graphql'

# Permission denied
Error: API error: (401) Bad credentials

# Solution: Re-authenticate
gh auth refresh

# Not found
Error: API error: (404) Not Found

# Solution: Verify repo/PR number exists
```

### Retry Pattern

```bash
#!/bin/bash
# Retry with exponential backoff

retry_graphql_query() {
  local query="$1"
  local max_attempts=3
  local attempt=1
  local wait_time=5

  while [ $attempt -le $max_attempts ]; do
    RESULT=$(gh api graphql -f query="$query" 2>&1)
    
    if ! echo "$RESULT" | grep -q "error"; then
      echo "$RESULT"
      return 0
    fi

    if [ $attempt -lt $max_attempts ]; then
      echo "Attempt $attempt failed, retrying in ${wait_time}s..." >&2
      sleep $wait_time
      wait_time=$((wait_time * 2))
    fi
    
    attempt=$((attempt + 1))
  done

  echo "Failed after $max_attempts attempts" >&2
  return 1
}
```

## Data Field Definitions

### Thread Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | GraphQL ID (use for resolving/unresolving) |
| `isResolved` | Boolean | Whether thread is marked resolved |
| `isOutdated` | Boolean | Whether comment refers to outdated code |
| `path` | String | File path in PR |
| `line` | Integer | Line number in file |
| `comments` | Array | Array of comment objects in thread |

### Comment Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | GraphQL comment ID |
| `databaseId` | Integer | REST API comment ID |
| `body` | String | Comment text content |
| `author.login` | String | GitHub username |
| `createdAt` | DateTime | ISO 8601 timestamp |
| `updatedAt` | DateTime | Last edit timestamp |
| `path` | String | File path |
| `line` | Integer | Line number |
| `diffHunk` | String | Surrounding code context |

## Extracting Comment Context

### Getting Surrounding Code

The `diffHunk` field provides context:

```
@@ -10,5 +10,7 @@ function foo() {
   const existing = getVal();
   const val = compute(existing);
+  // New code added here
   return val;
 }
```

**Lines prefixed with:**
- `+` = Added
- `-` = Removed
- ` ` (space) = Context

### Matching Comments to Current Code

```bash
# Check if file still exists
test -f "$FILE_PATH" && echo "File exists" || echo "File deleted"

# Check if line is within file
TOTAL_LINES=$(wc -l < "$FILE_PATH")
if [ "$LINE_NUMBER" -le "$TOTAL_LINES" ]; then
  # Line exists, check content
  sed -n "${LINE_NUMBER}p" "$FILE_PATH"
fi
```

## Useful jq Filters

### Extract Unresolved Comments

```bash
jq '[.[] | select(.isResolved == false)]'
```

### Extract Outdated Comments

```bash
jq '[.[] | select(.isOutdated == true)]'
```

### Count Comments by Author

```bash
jq 'group_by(.comments[0].author.login) | map({author: .[0].comments[0].author.login, count: length})'
```

### Extract All Comment Text

```bash
jq '.[] | .comments[].body'
```

### Find Comments Mentioning Specific Term

```bash
jq '[.[] | select(.comments[].body | contains("TODO"))]'
```
