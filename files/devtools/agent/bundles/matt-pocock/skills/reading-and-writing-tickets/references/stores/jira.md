# Jira store

Use Jira as the source of truth. Load the `twg` router and `twg-jira` skill for Jira operations. Use live `twg help` for unfamiliar command grammar. Do not call Jira REST endpoints directly or guess flags.

## Operations

- Read known tickets with `jira workitem get`.
- List tickets with JQL-backed `jira workitem query --jql <jql>` for exact filters. Use `jira workitem search` for Jira-only fuzzy text.
- Create or update through TWG. Discover required fields and metadata before a write.
- Claim only through the configured claim operation. If none exists, stop and report the missing operation.
- Record reviews as native Jira comments unless a worktree review rule requires an artifact link.
- Complete only after validation, review, merge, and push succeed. Discover available transitions before changing Jira workflow state.

Use Jira-native relationship data for blockers. For dependency graphs, load `twg-context-discovery` and hydrate known Jira workitems before expanding relationship context. Keep confirmed blocker edges separate from inferred context links. State truncation or coverage gaps.

If TWG does not expose the requested operation or relationship, stop and report the exact gap. Do not substitute a guessed JQL field or a different relationship type.

## Result identity

Return the Jira key as a string and the canonical Jira URL as `ref`. Return blocker keys as strings. Report TWG errors and coverage limits.