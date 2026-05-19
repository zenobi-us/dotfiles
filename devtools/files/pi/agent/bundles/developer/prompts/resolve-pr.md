---
description: "GitHub PR URL (e.g., https://github.com/owner/repo/pull/123) or PR number"
---

Use the `github-pr-resolver` skill to process and resolve all review comments on the specified pull request.

## UserRequest

```md
UserRequest: $ARGUMENTS
```

Determine if UserRequest is a PR, a branch related to a PR, a workflow run related to a PR, or an issue related to a PR. Extract the PR number and repository information.

Otherwise, if UserRequest is empty, assume the current branch is associated with a PR and attempt to find it using the GitHub CLI.
