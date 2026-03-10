---
name: github-pr-comment-analyzer
description: Use when analyzing PR review comments to determine relevance, identify ambiguities, and generate a comprehensive report without making code changes. Useful for understanding feedback landscape and initiating collaborative Q&A discussions about unclear or potentially outdated comments.
---

# GitHub PR Comment Analyzer

Analyze all review comments on a pull request to assess relevance, identify ambiguities, and generate a detailed report with suggested Q&A discussions. Unlike the PR resolver skill, this skill **only analyzes and reports** without making code changes.

## When to Use This Skill

Use this skill when you need to:
- **Analyze comment relevance** without immediately acting on them
- **Identify ambiguous feedback** that needs clarification
- **Generate reports** on PR review status and comment landscape
- **Facilitate discussions** about comments through Q&A format
- **Understand outdated comments** that may no longer apply to the current code

## Prerequisites

```bash
# Verify gh CLI is installed and authenticated
gh auth status

# If not authenticated, run:
gh auth login
```

Token requires `repo` scope for full repository access.

## Workflow Overview

1. **Fetch PR context** → Get all review threads with metadata (always fresh from GitHub)
2. **Analyze each comment** → Assess relevance, type, intent, and clarity
3. **Identify ambiguities** → Flag unclear, contradictory, or potentially outdated comments
4. **Generate report** → Structured markdown report with findings
5. **Create Q&A discussions** → Suggest discussion prompts for ambiguous items
6. **No code changes** → Only analysis, reporting, and discussion generation

**KEY PRINCIPLE:** This is a read-only analysis skill. No files are modified, no commits are made, no threads are resolved.

## Step 1: Fetch PR Context (Always Fresh)

**CRITICAL: Always fetch fresh data from GitHub. Never reuse previously fetched context data.**

### 1.1 Get PR Details

```bash
# Get PR metadata
gh pr view <PR_NUMBER> --json number,title,state,headRefName,baseRefName,author,url,commits
```

### 1.2 Get Review Threads (GraphQL with Pagination)

Use GraphQL to fetch ALL review threads with full metadata. **The API returns max 100 items per request, so pagination is required.**

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

### 1.3 Get Commit History

```bash
# Get commits in the PR to understand code evolution
gh pr view <PR_NUMBER> --json commits --json body | jq '.commits[] | {oid, messageHeadline, committedDate}'
```

### 1.4 Collect ALL Threads (With Pagination)

**IMPORTANT: Continue fetching pages until `hasNextPage` is `false`. Collect ALL threads before analyzing.**

```bash
# Pseudocode for pagination
ALL_THREADS = []
CURSOR = null

while true:
  RESULT = fetch_with_cursor(CURSOR)
  ALL_THREADS.append(RESULT.nodes)
  if not RESULT.pageInfo.hasNextPage:
    break
  CURSOR = RESULT.pageInfo.endCursor
```

## Step 2: Analyze Each Comment

For every comment in the PR, perform comprehensive analysis:

### 2.1 Extract Comment Metadata

```
- Thread ID (for reference)
- File path and line number
- Author and timestamp
- Thread resolution status (resolved/unresolved)
- Thread outdated status
- Full comment text
- Code diff context (diffHunk)
```

### 2.2 Assess Relevance

**For each comment, determine its current relevance:**

| Relevance Status | Definition | Indicators |
|-----------------|-----------|-----------|
| **HIGHLY RELEVANT** | Comment directly addresses current code | Line still exists, code structure matches comment context |
| **POTENTIALLY RELEVANT** | Comment may apply but needs verification | Line is near current line, similar code patterns exist |
| **OUTDATED** | Comment refers to code no longer in PR | File was deleted, line removed, code completely refactored |
| **UNCLEAR** | Cannot determine relevance without more context | Vague reference, ambiguous terminology, no clear target |
| **RESOLVED** | Thread already marked as resolved | isResolved: true (included for completeness) |

**Analysis Method:**
- Check if file still exists in PR
- Verify line number still contains relevant code
- Cross-reference with commit history to see if code was modified/removed
- Compare diffHunk with current code context

### 2.3 Classify Comment Type

Identify what type of feedback this is:

| Type | Pattern | Examples |
|------|---------|----------|
| **Bug Fix** | Identifies issue, suggests fix | "This will crash if X is null" |
| **Feature Request** | Suggests new functionality | "Consider adding retry logic" |
| **Code Quality** | Style, refactoring, best practices | "This could be simplified with a helper function" |
| **Documentation** | Comments, documentation, clarity | "Add JSDoc for this function" |
| **Performance** | Optimization, efficiency | "This loop could be parallelized" |
| **Testing** | Test coverage, assertions | "Add test case for this scenario" |
| **Architecture** | Design patterns, structure | "This should use dependency injection" |
| **Question/Discussion** | Clarification, discussion points | "Why did you choose this approach?" |
| **Suggestion/Nit** | Minor preference, non-blocking | "Nit: prefer const over let here" |

### 2.4 Assess Intent Clarity

**Determine how clearly the comment communicates intent:**

| Clarity Level | Definition | Examples |
|--------------|-----------|----------|
| **EXPLICIT** | Clear action requested with specific guidance | "Add this validation: `if (!user) throw new Error(...)`" |
| **IMPLICIT** | Intent clear but specific action undefined | "This needs better error handling" |
| **AMBIGUOUS** | Multiple interpretations possible | "Simplify this code" (unclear what aspect) |
| **UNCLEAR** | Difficult to understand what's needed | Domain-specific jargon without context, typos, incomplete thoughts |

### 2.5 Check for Contradictions

**Identify comments that contradict each other:**
- Different reviewers suggesting opposite approaches
- Multiple solutions proposed for same issue
- Conflicting coding standards referenced

### 2.6 Outdated Status Analysis

**Determine if comment is outdated:**

| Status | When | Indicators |
|--------|------|-----------|
| **NOT OUTDATED** | Comment still applies | Code at line/path unchanged or similar |
| **POSSIBLY OUTDATED** | Needs verification | Code modified near the commented line |
| **LIKELY OUTDATED** | Comment obsolete | File deleted, entire function removed, massive refactor |
| **EXPLICITLY MARKED** | Already resolved/outdated | isOutdated: true from API |

## Step 3: Identify Ambiguities

Flag comments that need clarification:

### 3.1 Ambiguity Categories

```
1. UNCLEAR INTENT
   - What exactly needs to change?
   - What's the success criterion?
   - Examples: "Simplify this", "Make it better", "Consider X"

2. CONTRADICTORY
   - Multiple comments suggest opposite solutions
   - Conflicting coding standards or approaches

3. OUTDATED BUT UNRESOLVED
   - Comment likely refers to old code
   - But thread remains unresolved
   - Needs clarification: still relevant?

4. DOMAIN-SPECIFIC
   - Uses terminology without context
   - References external docs/standards
   - Requires subject matter expertise

5. ASSUMED CONTEXT
   - References previous discussions
   - Assumes knowledge of system architecture
   - Missing background information

6. MULTIPLE VALID SOLUTIONS
   - Comment mentions several approaches
   - Unclear which is preferred
   - No decision guidance provided
```

### 3.2 Severity Scoring

Score each ambiguity for impact:

- **CRITICAL**: Blocks understanding or implementation
- **HIGH**: Significant confusion, multiple interpretations
- **MEDIUM**: Some clarity needed, but intent somewhat clear
- **LOW**: Minor ambiguity, intent is mostly clear

## Step 4: Generate Analysis Report

Create a comprehensive markdown report with findings:

### 4.1 Report Structure

```markdown
# PR Comment Analysis Report

**PR:** #<number> - <title>
**Author:** <author>
**Branch:** <branch>
**Analysis Date:** <timestamp>

## Summary Statistics

- Total Comments: N
- Comments Analyzed: N
- Highly Relevant: N
- Potentially Relevant: N
- Outdated: N
- Ambiguous: N
- Resolved: N

## Comments by Relevance

### Highly Relevant Comments (N)
[List each with metadata]

### Potentially Relevant Comments (N)
[List with verification notes]

### Outdated Comments (N)
[List with reason marked outdated]

### Ambiguous Comments (N)
[List with ambiguity type and severity]

### Already Resolved Comments (N)
[List for reference]

## Identified Issues

### Contradictions (if any)
[List conflicting comments]

### High-Impact Ambiguities
[Prioritized list needing clarification]

### Comments Needing Verification
[List potentially outdated but unresolved]

## Recommendations

[Summary of key findings and suggested Q&A discussions]
```

### 4.2 Comment Entry Format

For each comment in the report, include:

```markdown
**Comment ID:** <thread_id>
**File:** <path> (line <number>)
**Author:** <author> (<date>)
**Status:** <relevance_status> | <clarity_level> | <type>
**Resolved:** <yes/no>

**Text:**
> <comment_body>

**Analysis:**
- Intent: <description>
- Ambiguities: <list or "None">
- Relevance: <explanation>
- Recommended Q&A: [see Q&A section]
```

## Step 5: Generate Q&A Discussion Prompts

For each ambiguous or high-impact comment, create discussion prompts:

### 5.1 Q&A Format

For each flagged item:

```markdown
### Discussion: [Thread ID]

**Comment:** > [quote]

**Clarification Questions:**
1. [Question 1 - specific, focused]
2. [Question 2 - alternative interpretation]
3. [Question 3 - implementation details]

**Suggested Response Approaches:**
- [ ] Approach A: [Option with tradeoffs]
- [ ] Approach B: [Option with tradeoffs]
- [ ] Ask for: [Additional information needed]
```

### 5.2 Question Categories

Design questions for different ambiguity types:

**For UNCLEAR INTENT:**
- "Could you clarify what 'X' means in this context?"
- "Are you suggesting [specific change] or [alternative]?"
- "What's the success criterion for this change?"

**For OUTDATED COMMENTS:**
- "This code has changed since your comment. Is this feedback still relevant?"
- "The file/line structure differs. Did you intend to comment on [new location]?"
- "Should we consider this for [other file/approach]?"

**For CONTRADICTIONS:**
- "I notice [Comment A] and [Comment B] suggest different approaches. Which is preferred?"
- "Can you help reconcile the difference between [Solution 1] and [Solution 2]?"

**For DOMAIN-SPECIFIC:**
- "Could you provide a brief example of what you mean by [term]?"
- "Is there a reference or doc I should review for context?"

## Step 6: Output Only (No Code Changes)

### 6.1 Save Report

```bash
# Save markdown report to file
cat > "pr-${PR_NUMBER}-analysis.md" << 'EOF'
[Generated report]
EOF

# Print to stdout as well
cat "pr-${PR_NUMBER}-analysis.md"
```

### 6.2 Verification Checklist

Before finalizing report, verify:

- [ ] All threads fetched (checked pagination)
- [ ] No threads were skipped
- [ ] All ambiguities identified and documented
- [ ] Q&A discussions generated for flagged items
- [ ] Report is current (fresh GitHub fetch)
- [ ] No code modifications made
- [ ] No threads resolved
- [ ] All files remain unchanged

## Complete Example Script

```bash
#!/bin/bash
# Complete workflow for PR comment analysis

PR_NUMBER=$1
REPO="owner/repo"  # Or extract from current git remote
OWNER=${REPO%/*}
REPO_NAME=${REPO#*/}

# 1. Fetch fresh context from GitHub
echo "Fetching PR #$PR_NUMBER..."
PR_INFO=$(gh pr view $PR_NUMBER --json number,title,headRefName,author)
echo "PR: $(echo $PR_INFO | jq -r '.title')"
echo "Author: $(echo $PR_INFO | jq -r '.author.login')"

# 2. Fetch ALL review threads with pagination
echo "Fetching all review comments..."
ALL_THREADS="[]"
CURSOR=""
HAS_NEXT=true

while [ "$HAS_NEXT" = "true" ]; do
  if [ -z "$CURSOR" ]; then
    CURSOR_ARG=""
  else
    CURSOR_ARG="-f cursor=\"$CURSOR\""
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
          isOutdated
          path
          line
          comments(first: 100) {
            nodes {
              body
              author { login }
              createdAt
              path
              line
            }
          }
        }
      }
    }
  }
}' -f owner=$OWNER -f repo=$REPO_NAME -F prNumber=$PR_NUMBER $CURSOR_ARG)

  # Process results
  PAGE_THREADS=$(echo $RESULT | jq '.data.repository.pullRequest.reviewThreads.nodes')
  ALL_THREADS=$(echo "$ALL_THREADS $PAGE_THREADS" | jq -s 'add')
  
  HAS_NEXT=$(echo $RESULT | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.hasNextPage')
  CURSOR=$(echo $RESULT | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.endCursor')
done

# 3. Analyze comments (Claude does this part)
TOTAL=$(echo $ALL_THREADS | jq 'length')
RESOLVED=$(echo $ALL_THREADS | jq '[.[] | select(.isResolved == true)] | length')
UNRESOLVED=$(echo $ALL_THREADS | jq '[.[] | select(.isResolved == false)] | length')
OUTDATED=$(echo $ALL_THREADS | jq '[.[] | select(.isOutdated == true)] | length')

echo "Total threads: $TOTAL"
echo "Unresolved: $UNRESOLVED"
echo "Resolved: $RESOLVED"
echo "Outdated: $OUTDATED"

# 4. Generate report and Q&A discussions
# (Analysis performed interactively by Claude)

echo ""
echo "✅ Analysis complete. Report saved to: pr-${PR_NUMBER}-analysis.md"
```

## Key Differences from PR Resolver

| Aspect | PR Resolver | PR Comment Analyzer |
|--------|------------|-------------------|
| **Action** | Fixes code | Analyzes and reports |
| **Commits** | Creates commits | No commits |
| **Thread Resolution** | Resolves threads | No thread changes |
| **Output** | Modified PR | Analysis report + Q&A |
| **Goal** | Complete feedback | Understand feedback |
| **Use Case** | Addressing review | Understanding review landscape |

## Reference

See `references/github_api_reference.md` for:
- Detailed GitHub API pagination patterns
- GraphQL query templates
- API rate limits and error handling
- Comment intent patterns and classification
