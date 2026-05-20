# Example Usage: PR Comment Analyzer Skill

Complete worked examples showing how to use the pr-comment-analyzer skill in real scenarios.

## Example 1: Simple PR with Mixed Comment Types

### Scenario

Analyzing PR #427 in `myproject/api` repo:
- 8 review comments from 2 reviewers
- Mix of bugs, suggestions, questions
- No explicit contradictions
- Some comments potentially outdated

### Running the Analysis

```bash
# 1. Start analysis
gh pr view 427 --json number,title,author

# Output:
# PR: "Add user authentication flow" by @alice
# Number: 427

# 2. Fetch all comments with skill guidance (Step 1.2)
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
}' -f owner=myproject -f repo=api -F prNumber=427
```

### Sample Comments Fetched

```json
{
  "nodes": [
    {
      "id": "thread-1",
      "isResolved": false,
      "isOutdated": false,
      "path": "src/auth/tokens.ts",
      "line": 42,
      "comments": [{
        "body": "Add null check for token - this will crash if token is undefined",
        "author": { "login": "bob" },
        "createdAt": "2025-12-20T10:30:00Z"
      }]
    },
    {
      "id": "thread-2",
      "isResolved": false,
      "isOutdated": false,
      "path": "src/auth/login.ts",
      "line": 18,
      "comments": [{
        "body": "Consider using environment variables for API keys instead of hardcoding",
        "author": { "login": "bob" },
        "createdAt": "2025-12-20T11:00:00Z"
      }]
    },
    {
      "id": "thread-3",
      "isResolved": false,
      "isOutdated": true,
      "path": "src/auth/index.ts",
      "line": 5,
      "comments": [{
        "body": "Import order should be: external, then internal, then types",
        "author": { "login": "alice" },
        "createdAt": "2025-12-19T14:00:00Z"
      }]
    }
    // ... more comments
  ]
}
```

### Analysis (Step 2)

**Comment 1: Thread-1**
- **Intent**: Bug fix - missing null validation
- **Clarity**: EXPLICIT (exact issue + solution implied)
- **Type**: Bug Fix
- **Relevance**: HIGHLY RELEVANT (file exists, line 42 still has token reference, code matches)
- **Ambiguity**: None

**Comment 2: Thread-2**
- **Intent**: Security/best practice suggestion
- **Clarity**: EXPLICIT (clear suggestion, specific change)
- **Type**: Bug Fix / Security
- **Relevance**: HIGHLY RELEVANT (file exists, line 18 is in login flow)
- **Ambiguity**: Minor - doesn't specify which env vars or exact implementation

**Comment 3: Thread-3**
- **Intent**: Code style/organization
- **Clarity**: EXPLICIT (clear rule)
- **Type**: Style/Code Quality
- **Relevance**: OUTDATED (marked as outdated, plus imports may have changed)
- **Ambiguity**: Is this still applicable after recent refactoring?

### Generated Report

```markdown
# PR Comment Analysis Report

**PR:** #427 - Add user authentication flow
**Author:** @alice
**Branch:** feature/auth-flow
**Analysis Date:** 2025-12-21 09:00:00 UTC

## Summary Statistics

- Total Comments: 8
- Comments Analyzed: 8
- Highly Relevant: 5
- Potentially Relevant: 1
- Outdated: 2
- Ambiguous: 1
- Resolved: 0

## Comments by Relevance

### Highly Relevant Comments (5)

**Comment ID:** thread-1
**File:** src/auth/tokens.ts (line 42)
**Author:** @bob (2025-12-20 10:30 UTC)
**Status:** HIGHLY RELEVANT | EXPLICIT | Bug Fix
**Resolved:** No

**Text:**
> Add null check for token - this will crash if token is undefined

**Analysis:**
- Intent: Prevent runtime crash when token is missing
- Ambiguities: None
- Relevance: File exists, line 42 still contains token reference, diffHunk matches current code
- Recommended Q&A: None needed

---

**Comment ID:** thread-2
**File:** src/auth/login.ts (line 18)
**Author:** @bob (2025-12-20 11:00 UTC)
**Status:** HIGHLY RELEVANT | EXPLICIT | Security
**Resolved:** No

**Text:**
> Consider using environment variables for API keys instead of hardcoding

**Analysis:**
- Intent: Move sensitive credentials to secure location
- Ambiguities: Which environment variables? Which package? (.env file, 12factor, etc.)
- Relevance: File exists, line 18 in login flow, hardcoded credentials visible in diff
- Recommended Q&A: See Q&A section (needs implementation clarification)

---

### Potentially Relevant Comments (1)

**Comment ID:** thread-4
**File:** src/auth/session.ts (line 65)
**Author:** @alice (2025-12-20 09:15 UTC)
**Status:** POTENTIALLY RELEVANT | IMPLICIT | Code Quality
**Resolved:** No

**Text:**
> This could be more efficient

**Analysis:**
- Intent: Performance improvement, but not specific
- Ambiguities: Which specific optimization? Cache? Algorithm? Library function?
- Relevance: File exists, line 65 exists, but comment lacks detail to verify applicability
- Recommended Q&A: Needs clarification on specific improvement

---

### Outdated Comments (2)

**Comment ID:** thread-3
**File:** src/auth/index.ts (line 5)
**Author:** @alice (2025-12-19 14:00 UTC)
**Status:** OUTDATED | EXPLICIT | Style
**Resolved:** No

**Text:**
> Import order should be: external, then internal, then types

**Analysis:**
- Intent: Enforce import organization standard
- Marked Outdated: Yes (API flag)
- Code Status: File was refactored 2 commits ago, imports reorganized
- Note: This appears to have already been applied; verify if still relevant

---

### Already Resolved (0)

No resolved threads in this PR.

## Identified Issues

### High-Impact Ambiguities (2)

1. **Thread-2 (Environment Variables)**
   - Severity: HIGH
   - Issue: Suggestion given but implementation approach unclear
   - Possible interpretations:
     - Use .env file with dotenv package
     - Use environment variables directly (NODE_ENV style)
     - Use secrets management service (HashiCorp Vault, etc.)
   - Impact: Different implementations, different security levels

2. **Thread-4 (Efficiency)**
   - Severity: MEDIUM
   - Issue: Comment lacks specificity
   - Possible interpretations:
     - Algorithm optimization
     - Caching results
     - Batching requests
     - Using better library function
   - Impact: Cannot determine if actually needed

### Comments Potentially Made Obsolete

1. **Thread-3 (Import Order)**
   - Reason: File refactored since comment, imports already reorganized
   - Action: Verify with committer if still applicable

## Recommendations

1. **Address Bug Fix (Thread-1)** - HIGH PRIORITY
   - Add null check for token variable
   - Clear path forward

2. **Clarify Environment Variables (Thread-2)** - HIGH PRIORITY
   - Ask @bob: Which environment variable solution preferred?
   - See Q&A Discussion below

3. **Clarify Efficiency Suggestion (Thread-4)** - MEDIUM PRIORITY
   - Ask @alice: What specific optimization needed?
   - See Q&A Discussion below

4. **Verify Import Order (Thread-3)** - LOW PRIORITY
   - Check if refactoring resolved this
   - May already be addressed

---

## Q&A Discussions

### Discussion: Thread-2

**Comment:** 
> Consider using environment variables for API keys instead of hardcoding

**Clarification Questions:**
1. Which approach is preferred: `.env` file with dotenv, direct NODE_ENV variables, or external secrets service?
2. Should this apply to all API keys (database, external services) or just the one hardcoded on line 18?
3. What's the timeline for this - critical for merge or acceptable as follow-up?

**Suggested Response Approaches:**
- [ ] **Approach A**: Use dotenv package + .env file (simple, good for dev/local testing)
  - Tradeoffs: Files gitignored, must manage secrets separately in production
- [ ] **Approach B**: Environment variables directly (12-factor app standard)
  - Tradeoffs: Requires environment setup, but production-ready
- [ ] **Approach C**: External secrets service (HashiCorp Vault, AWS Secrets Manager)
  - Tradeoffs: More complex setup, best security for sensitive data
- [ ] **Ask for**: More specific guidance on which approach your team standard dictates

---

### Discussion: Thread-4

**Comment:**
> This could be more efficient

**Clarification Questions:**
1. What specific efficiency improvement is suggested? (algorithm, caching, request batching, etc.)
2. Do you have a code example or reference?
3. Is this critical for this PR or a nice-to-have optimization?

**Suggested Response Approaches:**
- [ ] **Approach A**: Algorithm improvement (refactor logic)
  - Ask: "Could you provide the specific algorithm or show the improvement?"
- [ ] **Approach B**: Caching suggestion (results/computation caching)
  - Ask: "Should we use in-memory cache, Redis, or request-level memoization?"
- [ ] **Approach C**: Library function suggestion (existing package does it better)
  - Ask: "Which library function did you have in mind? Can you show an example?"
- [ ] **Ask for**: More details before proceeding

---

### Discussion: Thread-3

**Comment:**
> Import order should be: external, then internal, then types

**Clarification Question:**
- This file was refactored on 2025-12-21. Can you verify if the import order is now correct?

**Note:** This may already be resolved by the refactoring. Thread should be verified and possibly resolved if fix was already applied.

---

## Summary for Stakeholders

**Status:** PR has legitimate feedback requiring action.

**Action Items:**
- [ ] 🔴 CRITICAL: Add null check (Thread-1)
- [ ] 🟡 NEEDS CLARIFICATION: Environment variables approach (Thread-2)
- [ ] 🟡 NEEDS CLARIFICATION: Efficiency improvement specifics (Thread-4)
- [ ] 🟢 VERIFY: Import order status (Thread-3)

**Timeline:** 
- Critical fix (null check) unblocks review
- Clarifications needed for other items
- Estimated time to address: 1-2 hours with feedback

```

## Example 2: Large PR with Pagination

### Scenario

PR #512 has 250+ review comments from 8 reviewers. Need complete analysis with pagination.

### Key Points from Skill

```bash
# Step 1.2: Loop through all pages with pagination
ALL_THREADS="[]"
CURSOR=""
PAGE_COUNT=0

while true; do
  CURSOR_ARG=""
  if [ -n "$CURSOR" ]; then
    CURSOR_ARG="-f cursor=\"$CURSOR\""
  fi

  RESULT=$(gh api graphql -f query='...' ... $CURSOR_ARG)
  
  PAGE_DATA=$(echo "$RESULT" | jq '.data.repository.pullRequest.reviewThreads.nodes')
  ALL_THREADS=$(echo "$ALL_THREADS $PAGE_DATA" | jq -s 'add')
  
  PAGE_COUNT=$((PAGE_COUNT + 1))
  echo "Fetched page $PAGE_COUNT: $(echo "$PAGE_DATA" | jq 'length') threads"
  
  HAS_NEXT=$(echo "$RESULT" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.hasNextPage')
  if [ "$HAS_NEXT" != "true" ]; then
    break
  fi
  
  CURSOR=$(echo "$RESULT" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.endCursor')
done

TOTAL=$(echo "$ALL_THREADS" | jq 'length')
echo "✅ Fetched all $TOTAL threads in $PAGE_COUNT pages"
```

### Expected Report Sections

For large PRs, report includes:

```markdown
# PR Comment Analysis Report - #512

## Summary Statistics

- Total Comments: 247
- Highly Relevant: 189 (76%)
- Potentially Relevant: 32 (13%)
- Outdated: 18 (7%)
- Ambiguous: 12 (5%)
- Resolved: 45 (18%)

## Top Priority Issues

### Critical Ambiguities (3)

[List highest impact items]

### Contradictions Found (2)

[List conflicts between reviewers]

### Outdated but Unresolved (6)

[List potentially stale comments]

## Full Analysis by File

[Grouped by file path for easier navigation]

## Q&A Discussions

[All ambiguous items with discussion prompts]
```

## Example 3: Handling API Errors & Retries

### Error Scenario

API returns rate limit error mid-pagination.

```bash
# Skill Step 1: Handle with retry
RESULT=$(gh api graphql ... 2>&1)

if echo "$RESULT" | grep -q "rate limit exceeded"; then
  echo "⚠️  Rate limit exceeded. Checking reset time..."
  RESET=$(gh api rate_limit --jq '.resources.graphql.reset')
  RESET_TIME=$(date -d @$RESET '+%Y-%m-%d %H:%M:%S')
  echo "Reset at: $RESET_TIME"
  echo "Rerun analysis after reset or use token with higher limits"
  exit 1
fi
```

### Fresh Data Requirement

Skill emphasizes: **Always refetch, never assume cached data is current.**

```bash
# ✅ CORRECT: Fetch fresh for analysis
CURRENT_DATA=$(gh api graphql -f query='...' ...)
# Analyze CURRENT_DATA

# ❌ WRONG: Reuse cached data from earlier
EARLIER_DATA=$(/* saved from previous run */)
# Analyze EARLIER_DATA  <-- Data may be stale!
```

## Example 4: Q&A with Domain-Specific Comments

### Scenario

PR has comments like:
- "Ensure idempotency per RFC 2119"
- "This creates tight coupling; violates SOLID"
- "Missing circuit breaker pattern"

### Skill Approach: Flag & Clarify

```markdown
### Comments Requiring Domain Expertise (3)

#### Comment: "Ensure idempotency per RFC 2119"
- **Author**: @senior-architect
- **Domain**: API design / distributed systems
- **Ambiguity**: HIGH - RFC 2119 defines requirement levels, but doesn't specify idempotency implementation
- **Flag**: Domain-specific + needs clarification

**Q&A Discussion:**
1. "In this context, should idempotency be achieved via: request deduplication, database constraints, or business logic?"
2. "Is this critical for this PR or future enhancement?"

---

#### Comment: "This creates tight coupling; violates SOLID"
- **Author**: @design-lead
- **Domain**: Software architecture
- **Ambiguity**: MEDIUM - SOLID violated, but not specific which principle or how to fix
- **Flag**: Implicit intent + multiple solutions possible

**Q&A Discussion:**
1. "Which SOLID principle is violated? (S)ingle Responsibility, (O)pen/Closed, (L)iskov, (I)nterface Segregation, or (D)ependency Inversion?"
2. "Do you see a specific refactoring approach (dependency injection, facade pattern, etc.)?"
```

## Lessons from Examples

1. **Completeness**: Analyze ALL comments, even if some are outdated
2. **Verification**: Check file existence, line numbers, code context
3. **Pagination**: Never assume "probably got them all" - verify page count
4. **Ambiguities**: Flag unclear comments for Q&A discussion
5. **Fresh Data**: Always refetch from GitHub, don't rely on cached context
6. **Report Structure**: Use consistent format for readability
7. **Q&A Generation**: Create specific discussion prompts for ambiguous items
