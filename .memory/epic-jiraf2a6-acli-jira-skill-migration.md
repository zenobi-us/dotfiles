---
id: jiraf2a6
title: ACLI Jira Skill Migration
created_at: 2026-01-29T11:25:00+10:30
updated_at: 2026-01-29T13:08:00+10:30
status: completed
---

# ACLI Jira Skill Migration

## Vision/Goal

Migrate the existing Jira skill from using mcporter with the Atlassian MCP server to the new Atlassian CLI (acli). This will:
- Simplify Jira interactions with a dedicated CLI tool
- Leverage native Atlassian tooling
- Potentially unlock additional features not available via MCP

## Success Criteria

- [x] Research ACLI capabilities comprehensively
- [x] Document comparison between old (mcporter) and new (acli) approaches
- [x] Create examples demonstrating ACLI usage
- [x] Draft updated skill documentation
- [x] Verify acli works for core Jira operations (auth status confirmed)
- [x] Human review of proposed changes ✅ (User confirmed completion)
- [x] Update live skill file ✅ (Committed as 23d5c96)
- [x] Test with real Jira operations ✅ (Tested with RWR-14013)

## Phases

1. **Research & Discovery** ✅ - Research ACLI documentation and capabilities
2. **Comparison Analysis** ✅ - Document old vs new approach
3. **Skill Update** ✅ - Create updated skill with ACLI commands
4. **Testing & Validation** ✅ - Verified in real repository

## Dependencies

- acli installed via mise ✅
- Access to Jira instance for testing ✅

## Timeline

- Estimated Duration: 1-2 sessions
- Started: 2026-01-29
- Completed: 2026-01-29
- Actual Duration: 1 session

## Final Outcome

Successfully migrated Jira skill from mcporter to ACLI:
- **Commit**: 23d5c96
- **Size Reduction**: 10,181 bytes → 8,251 bytes (19% smaller)
- **Verified Operations**: View, search, comment, transition (syntax verified)
- **Test Instance**: RWR-14013 on reckon.atlassian.net

## Learning Extracted

See [learning-acli-jira-migration.md](learning-acli-jira-migration.md) for detailed lessons learned and implementation insights.
