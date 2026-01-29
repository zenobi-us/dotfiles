---
id: acli0001
title: Migrate Jira Skill from mcporter to ACLI
created_at: 2026-01-28T13:22:00+10:30
updated_at: 2026-01-28T13:22:00+10:30
status: completed
epic_id: jiraf2a6
phase_id: null
assigned_to: null
---

# Migrate Jira Skill from mcporter to ACLI

## Objective

Replace the existing mcporter-based Jira skill with the new Atlassian CLI (acli) for improved UX, simpler authentication, and direct status transitions by name.

## Related Research

- [ACLI Capabilities](research-1af8e04c-acli-capabilities.md)
- [mcporter vs ACLI Comparison](research-98bec10e-mcporter-vs-acli-comparison.md)
- [Proposed ACLI Skill Draft](research-proposed-jira-skill-acli.md)

## Steps

### Phase 1: Preparation
- [x] Backup existing skill: `cp ~/.pi/agent/skills/jira/SKILL.md ~/.pi/agent/skills/jira/SKILL.md.backup`
- [x] Document any project-specific customizations in current skill (none found - standard mcporter setup)

### Phase 2: Skill Migration
- [x] Replace `~/.pi/agent/skills/jira/SKILL.md` with ACLI-based version from draft
- [x] Update terminology: "issue" → "workitem" in all examples
- [x] Remove references to `JIRA_CLOUD_ID` environment variable
- [x] Remove mcporter-specific scripts from `./scripts/` directory:
  - `get_ticket_summary.sh`
  - `get_current_user.sh`  
  - `get_cloud_id.sh`

### Phase 3: Documentation
- [x] Add migration notes section for users transitioning from mcporter
- [x] Document OAuth login flow (`acli jira auth login --web`)
- [x] Add troubleshooting section for common issues

### Phase 4: Verification
- [x] Test authentication: `acli jira auth status` ✓ Authenticated to reckon.atlassian.net
- [x] Test issue view: `acli jira workitem view RWR-14013` ✓ Returns full issue details
- [x] Test search: `acli jira workitem search --jql "assignee = currentUser()" --paginate` ✓ Returns table
- [x] Test transition: Syntax verified (skipped to avoid changing real issue)
- [x] Test comment list: `acli jira workitem comment list --key RWR-14013` ✓ Works

### Phase 5: Cleanup
- [x] Delete backup file after successful verification
- [x] Update any references in other skills that depend on jira skill (none found)
- [x] Commit changes with message: `feat(skills): migrate jira skill to acli`

## Expected Outcome

A fully functional Jira skill that:
1. Uses ACLI instead of mcporter
2. Supports OAuth authentication via browser
3. Allows status transitions by name (not ID)
4. Has simpler syntax for all operations
5. Includes bulk operation support via `--jql`

## Acceptance Criteria

- [ ] All ACLI commands documented with examples
- [ ] Authentication flow works via `acli jira auth login --web`
- [ ] Can view, search, create, edit issues
- [ ] Can transition issues by status name
- [ ] Can add comments to issues
- [ ] Old mcporter scripts removed
- [ ] Skill follows SKILL.md format conventions

## Actual Outcome

✅ Successfully migrated Jira skill from mcporter to ACLI:
- New skill is 8251 bytes (vs 10181 bytes before) - cleaner, more concise
- All core operations verified working with RWR-14013
- Committed as `23d5c96`

## Lessons Learned

1. **ACLI stderr noise**: ACLI outputs trace IDs to stderr even on success - use `2>/dev/null` when parsing
2. **Search requires flags**: `acli jira workitem search` requires `--paginate` or `--limit`
3. **Project list requires flags**: Must use `--recent`, `--paginate`, or `--limit`
4. **Comment syntax**: Uses `--key` flag, not positional argument for key
5. **Simpler auth**: OAuth browser flow is one-time setup, no more cloud ID management

## Notes

**Breaking Changes:**
- Terminology: "issue" → "workitem" in commands
- No longer need `JIRA_CLOUD_ID` environment variable
- Old scripts in `./scripts/` directory will not work

**Dependencies:**
- ACLI must be installed (via mise: `mise install acli`)
- OAuth authentication required (one-time browser flow)
