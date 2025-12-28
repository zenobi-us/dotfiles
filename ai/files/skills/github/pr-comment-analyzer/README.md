# PR Comment Analyzer Skill

**Analyze GitHub PR review comments for relevance, identify ambiguities, and generate Q&A discussions - without making code changes.**

## Quick Start

```bash
# Analyze PR #427
skill: github-pr-comment-analyzer
PR: 427

# Output: pr-427-analysis.md with detailed report and Q&A discussions
```

## What This Skill Does

✅ **Analyzes** all PR review comments for:
- Relevance to current code
- Intent and clarity level
- Type of feedback (bug, feature, quality, etc.)
- Ambiguities and contradictions

✅ **Generates**:
- Structured markdown report
- Q&A discussion prompts for unclear items
- Categorized comments by relevance status
- Recommendations and action items

❌ **Does NOT**:
- Modify code
- Create commits
- Resolve threads
- Make changes to the PR

## Key Features

### 1. Comprehensive Analysis
- Analyzes **ALL comments** (no skipping)
- Handles **pagination** for large PRs (100+ comments)
- Verifies **relevance** against current code state
- Identifies **ambiguities** and **contradictions**

### 2. Smart Classification
- Determines **relevance status** (highly relevant → outdated)
- Classifies **comment type** (bug, feature, quality, docs, etc.)
- Assesses **clarity level** (explicit → unclear)
- Flags **domain-specific** language

### 3. Q&A Discussions
- Generates **specific questions** for ambiguous comments
- Provides **alternative interpretations**
- Suggests **response approaches** with tradeoffs
- Facilitates **team discussion** on unclear feedback

### 4. Structured Reporting
- Summary statistics (total, relevant, ambiguous, etc.)
- Comments grouped by **relevance status**
- **Identified issues** section (contradictions, ambiguities)
- **Recommendations** for action items
- **Q&A discussions** for each unclear item

## File Structure

```
pr-comment-analyzer/
├── SKILL.md                          # Main skill documentation
├── README.md                          # This file
└── references/
    ├── github_api_reference.md        # GraphQL/REST API reference
    ├── example_usage.md               # Worked examples with output
    ├── quick_reference.md             # Cheat sheet and quick lookup
    └── testing_scenarios.md           # RED-GREEN-REFACTOR test cases
```

## Core Principles

### 1. Always Fetch Fresh Data
Never assume cached data is current. Always refetch from GitHub before analysis.

### 2. Analyze Everything
No comment is optional. Every thread must be examined and classified, even if resolved or outdated.

### 3. Verify Relevance
Don't assume a comment still applies. Check file existence, line numbers, code context.

### 4. Flag Ambiguities
Don't guess at unclear intent. Flag for Q&A discussion and let the team clarify.

### 5. Generate Reports
Provide structured, comprehensive output that enables team discussion and decision-making.

## When to Use

| Scenario | Use This? | Why |
|----------|-----------|-----|
| Review PR feedback landscape | ✅ YES | Understand all feedback before responding |
| Clarify ambiguous comments | ✅ YES | Generate Q&A discussions |
| Check if old comments still apply | ✅ YES | Verify relevance, flag outdated |
| Fix code based on comments | ❌ NO | Use `github-pr-resolver` instead |
| Resolve review threads | ❌ NO | Manual action or PR resolver |
| Quick 1-line summary | ❌ NO | This generates comprehensive analysis |

## Example Workflow

### Step 1: Analyze Comments
```bash
# Request analysis
"Analyze PR #427 comments for relevance and ambiguities"

# Skill fetches all threads, analyzes each one, generates report
# Output: pr-427-analysis.md
```

### Step 2: Review Report
```markdown
# PR Comment Analysis Report #427

## Summary: 8 comments
- 5 Highly Relevant
- 1 Potentially Relevant
- 2 Ambiguous

## Q&A Discussions

### Discussion: Thread-2
**Comment:** "Consider using environment variables"
**Questions:**
1. Which env var approach? (.env, NODE_ENV, secrets service?)
2. Apply to all keys or just this one?

[...]
```

### Step 3: Team Discussion
Team reviews Q&A discussions and provides clarification in comments. Report facilitates informed decision-making.

## Reference Guides

### Quick Reference Card
See `references/quick_reference.md` for:
- Command cheatsheet
- Classification guide
- Report template
- Success checklist

### Example Usage
See `references/example_usage.md` for:
- Simple PR analysis walkthrough
- Large PR with pagination
- Error handling scenarios
- Domain-specific comments

### GitHub API Reference
See `references/github_api_reference.md` for:
- GraphQL query templates
- REST API endpoints
- Pagination patterns
- Rate limit handling

### Testing Scenarios
See `references/testing_scenarios.md` for:
- RED phase (baseline testing)
- GREEN phase (compliance testing)
- REFACTOR phase (edge cases)
- Compliance metrics

## Requirements

### Prerequisites
- GitHub CLI (`gh`) installed and authenticated
- `repo` scope token
- Bash/shell environment

### Verification
```bash
# Check gh CLI
gh auth status

# Check token scope
gh auth token | xargs -I {} gh api user --header "authorization: token {}"
```

## API & Rate Limits

### GraphQL API
- **Limit**: 5,000 points/hour
- **Cost**: Review threads query ~10 points
- Check: `gh api rate_limit | jq '.resources.graphql'`

### REST API
- **Limit**: 60/hour (unauthenticated), 5,000/hour (authenticated)
- Check: `gh api rate_limit`

## Common Use Cases

### Use Case 1: Understanding Feedback Landscape
**Goal**: Know what reviewers said without immediately acting
**Solution**: Generate analysis report, share with team, discuss

### Use Case 2: Handling Ambiguous Feedback
**Goal**: Clarify unclear comments without guessing
**Solution**: Generate Q&A discussions, use to prompt reviewer for details

### Use Case 3: Tracking Potentially Outdated Comments
**Goal**: Know which comments may no longer apply
**Solution**: Report flags outdated comments, you verify if still relevant

### Use Case 4: Coordinating PR Feedback
**Goal**: Have complete picture before acting
**Solution**: Analyze all feedback first, plan approach, then fix in organized way

## Troubleshooting

### Rate Limit Exceeded
```bash
gh api rate_limit | jq '.resources.graphql.reset'
# Wait until reset time, then rerun
```

### Missing Comments
```bash
# Verify pagination completed
echo "Check if 'hasNextPage' was false on last request"
# Re-run analysis with fresh fetch
```

### Unclear Relevance
```bash
# Flag as ambiguous and include in Q&A section
# Let team clarify rather than guessing
```

## Performance Notes

- **Small PR** (< 100 comments): < 1 minute
- **Medium PR** (100-250 comments): 1-3 minutes
- **Large PR** (250+ comments): 3-5 minutes
- Network-bound (GitHub API calls)

## Limitations

- **Read-only**: Cannot modify code or resolve threads
- **Analysis-focused**: Designed for understanding, not for automated fixes
- **Manual Q&A**: Team must actively participate in discussion prompts
- **API-dependent**: Requires GitHub API access and rate limit availability

## Comparison with PR Resolver

| Aspect | Comment Analyzer | PR Resolver |
|--------|-----------------|------------|
| **Purpose** | Understand feedback | Fix feedback |
| **Output** | Report + Q&A | Modified PR |
| **Commits** | None | One per comment |
| **Thread Changes** | None | Resolves threads |
| **Time** | Quick analysis | Implementation time |
| **When to Use** | Before fixing | Ready to implement |

## Integration Points

### Before PR Resolver
1. Analyze comments with this skill
2. Review report and Q&A discussions
3. Get clarifications from team
4. Use PR Resolver to implement changes

### With PR Discussion
1. Generate analysis report
2. Post Q&A discussions as PR comments
3. Use responses to inform decision-making
4. Document rationale in PR discussion

### In Team Workflows
- **Code Review Lead**: Use to summarize feedback
- **PR Author**: Use to understand all feedback
- **Team Lead**: Use to track review quality and clarity
- **Onboarding**: Use as reference for feedback patterns

## Contributing

Issues or improvements? This skill was created to:
- ✅ Analyze without modifying
- ✅ Identify ambiguities
- ✅ Generate Q&A discussions
- ✅ Provide comprehensive reports

If you find cases not covered, consider:
1. Submitting feedback
2. Opening an issue
3. Improving the skill

## License & Attribution

Part of the Dotfiles skill collection.
See parent repository for license info.

---

**Version**: 1.0
**Last Updated**: 2025-12-21
**Related Skills**: `github-pr-resolver`, GitHub automation skills
