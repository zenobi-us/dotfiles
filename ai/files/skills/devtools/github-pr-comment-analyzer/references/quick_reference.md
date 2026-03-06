# PR Comment Analyzer - Quick Reference Card

## When to Use

✅ Use when you need to:
- Analyze PR review comments without making code changes
- Determine if comments are still relevant
- Identify ambiguous or contradictory feedback
- Generate Q&A discussions about unclear comments
- Create a comprehensive report of reviewer feedback

❌ Don't use when you want to:
- Fix code based on review comments (use `github-pr-resolver` instead)
- Resolve review threads
- Commit changes
- Make automatic modifications

## Core Workflow (6 Steps)

```
1. Fetch PR Context  → Always fresh from GitHub
2. Analyze Comments  → Assess relevance, type, clarity
3. Identify Issues   → Find ambiguities & contradictions
4. Generate Report   → Structured markdown output
5. Create Q&A        → Discussion prompts for unclear items
6. Deliver Output    → File + stdout, no code changes
```

## Command Cheat Sheet

### Fetch PR Info

```bash
gh pr view <PR_NUMBER> --json number,title,author,headRefName
```

### Fetch All Comments (with Pagination)

```bash
gh api graphql -f query='
query($owner: String!, $repo: String!, $prNumber: Int!, $cursor: String) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $prNumber) {
      reviewThreads(first: 100, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes { id isResolved isOutdated path line
          comments(first: 100) {
            nodes { body author { login } createdAt }
          }
        }
      }
    }
  }
}' -f owner=<owner> -f repo=<repo> -F prNumber=<number>
```

### Check Rate Limit

```bash
gh api rate_limit | jq '.resources.graphql'
```

## Comment Classification Quick Guide

| Intent | Keywords | Examples |
|--------|----------|----------|
| **Bug** | null check, error, crash, validation | "Add null check" |
| **Feature** | add, include, missing | "Add timeout" |
| **Quality** | refactor, simplify, rename | "Simplify using..." |
| **Docs** | comment, JSDoc, README | "Add JSDoc" |
| **Performance** | optimize, cache, efficient | "Cache this" |
| **Testing** | test, coverage | "Add test for" |
| **Architecture** | pattern, design, DI | "Use DI here" |
| **Question** | why, discuss, consider | "Why this?" |
| **Nit** | prefer, style, whitespace | "Prefer const" |

## Relevance Assessment

| Status | Check For |
|--------|-----------|
| **HIGHLY RELEVANT** | File exists, line unchanged, code matches |
| **POTENTIALLY RELEVANT** | File exists, line near target, context matches |
| **OUTDATED** | File deleted, line removed, or API marked outdated |
| **UNCLEAR** | Can't determine without more context |
| **RESOLVED** | Thread already resolved (include for completeness) |

## Ambiguity Types

```
1. UNCLEAR INTENT    - What exactly needs to change?
2. CONTRADICTORY     - Multiple comments suggest opposite solutions
3. OUTDATED BUT OPEN - Comment may be obsolete, thread not resolved
4. DOMAIN-SPECIFIC   - Uses jargon without explanation
5. ASSUMED CONTEXT   - References info not in comment
6. MULTIPLE OPTIONS  - Several solutions mentioned, none preferred
```

## Report Template

```markdown
# PR Comment Analysis Report

**PR:** #<number> - <title>
**Author:** <name>
**Date:** <timestamp>

## Summary Statistics
- Total: N | Relevant: N | Outdated: N | Ambiguous: N

## Comments by Relevance
### Highly Relevant (N)
### Potentially Relevant (N)
### Outdated (N)
### Ambiguous (N)

## Identified Issues
### Contradictions
### High-Impact Ambiguities

## Recommendations
[Actionable guidance]

## Q&A Discussions
### Discussion: [Thread ID]
**Clarification Questions:** [3-5 specific questions]
**Suggested Approaches:** [Options with tradeoffs]
```

## Q&A Discussion Template

```markdown
### Discussion: [Comment ID]

**Comment:** 
> [quote of original comment]

**Clarification Questions:**
1. [Specific, focused question]
2. [Alternative interpretation question]
3. [Implementation detail question]

**Suggested Response Approaches:**
- [ ] **Approach A**: [Option 1 with tradeoffs]
- [ ] **Approach B**: [Option 2 with tradeoffs]
- [ ] **Ask for**: [Additional info needed]
```

## Critical Requirements

🔴 **MUST:**
- [ ] Fetch fresh data from GitHub (never cache)
- [ ] Analyze ALL comments (no skipping)
- [ ] Verify relevance for each comment
- [ ] Generate structured report
- [ ] Create Q&A for ambiguous items
- [ ] Make NO code changes
- [ ] Handle pagination correctly (>100 comments)

🟡 **SHOULD:**
- [ ] Flag contradictions between reviewers
- [ ] Note domain-specific language
- [ ] Prioritize ambiguities by impact
- [ ] Provide clear recommendations

🟢 **NICE TO HAVE:**
- [ ] Suggest urgency/priority level
- [ ] Group comments by file
- [ ] Reference related comments

## Common Pitfalls to Avoid

❌ **Don't:**
- Assume comment still applies without verifying
- Skip comments due to time pressure
- Generate brief summary instead of full report
- Resolve threads or make commits
- Modify any files
- Reuse cached comment data
- Guess pagination ("probably got them all")

✅ **Do:**
- Verify each file/line existence
- Analyze every single comment
- Generate comprehensive report
- Create Q&A discussions
- Always refetch from GitHub
- Verify pagination complete
- Document your analysis

## Success Checklist

Before finishing analysis:

- [ ] Fetched all comments (with pagination verified)
- [ ] Analyzed each comment for relevance, type, clarity
- [ ] Classified all comments by status
- [ ] Identified ambiguities and contradictions
- [ ] Generated structured markdown report
- [ ] Created Q&A discussions for unclear items
- [ ] Verified no code modifications made
- [ ] Output saved to file: `pr-<number>-analysis.md`
- [ ] Summary printed to stdout

## Example Output Filenames

```
pr-427-analysis.md          # Single PR analysis
pr-512-large-analysis.md    # Large PR with many comments
pr-analysis-2025-12-21.md   # Timestamped analysis
```

## Integration with Workflows

### Standalone Analysis
```bash
# Just analyze and report
skill: github-pr-comment-analyzer
PR: #<number>
Output: markdown report + discussion prompts
```

### Before PR Resolution
```bash
# 1. Analyze first
skill: github-pr-comment-analyzer
# Review report and Q&A

# 2. Then fix (if needed)
skill: github-pr-resolver
# Addresses comments with code changes
```

### Coordination with Teams
```
1. Analysis generates Q&A discussions
2. Team discusses ambiguous comments
3. Clarifications inform PR resolver
4. All changes tracked with commits
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Rate limit hit | Wait or use `gh auth refresh` with higher token |
| Pagination issues | Verify loop: `hasNextPage` and `endCursor` |
| Missing comments | Ensure pagination completed all pages |
| Unclear relevance | Flag as ambiguous, include in Q&A |
| API errors | Check `gh auth status`, verify repo access |

## Related Skills

- `github-pr-resolver`: Fix code based on review comments
- `github` skills: General GitHub automation
- General analysis: Code review processes
