---
description: Fetch ticket and switch or create worktree and handoff to new coding agent session
---

PullRequestOrBranch: $1
UserRequest: "${@:2}"

Download and work on issue ticket in a worktree. This prompt will fetch the ticket and switch or create a worktree for the ticket, then handoff to a new coding agent session.

The issue ticket might be a Jira ticket, GitHub issue, or any other issue tracking system. The prompt will attempt to fetch the ticket details and create a worktree for it.

# Process

1. Determine the issue tracker, e.g., Jira, GitHub, etc.
2. use appropriate skill to fetch the ticket details.
3. use worktrunk to create and switch to a worktree for the ticket. This should create a zellij tab for you.
4. create a handoff prompt in /tmp/{ticket-id}-handoff.md with the ticket details and instructions for the new coding agent session.
5. Spawn pi with the handoff prompt in the new worktree and zellij tab.

# Issue Trackers

- Jira Issues: use skill `reading-and-writing-jira-tickets`
- Github: use the gh cli to fetch the issue details

# Worktrees

- use skill `worktrunk`
