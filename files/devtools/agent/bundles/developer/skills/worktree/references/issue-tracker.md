# Issue tracker resolution

Use this reference for every worktree playbook that resolves or updates a ticket.

## Resolve the project definition

1. Resolve `ALIGNMENT_ROOT` from the active `<shared-agent-context>` tag. If no tag exists, use the repository root only after running the context report required by the playbook.
2. Read `$ALIGNMENT_ROOT/docs/agents/issue-tracker.md`.
3. Read its YAML frontmatter. `backend` is required. For `local-markdown`, `issue-root` is required.
4. Resolve a local issue root as `$ALIGNMENT_ROOT/<issue-root>`. Do not resolve it from the process cwd when `ALIGNMENT_ROOT` differs from the repository root.
5. Treat the tracker document as the source of truth for file names, metadata, state changes, comments, and links. Do not invent a path or status format.

Stop and ask the user when the tracker definition is missing, malformed, or does not explain the operation that the playbook needs.

## Resolve a ticket

Accept a ticket identifier in any form that the tracker document defines. For a local Markdown tracker, prefer these forms in order:

1. An explicit issue file path.
2. A path relative to `ALIGNMENT_ROOT`.
3. A path relative to the resolved issue root.
4. A tracker-defined issue number or slug.

When a number or slug matches more than one Markdown file, list the matches and ask the user to choose. Never select the first filesystem result.

Read the resolved issue file before changing a worktree or ticket state. Preserve its format and existing content.

## Local Markdown lifecycle

For `backend: local-markdown`:

- **Read:** Read the resolved Markdown issue file.
- **Claim:** Apply the tracker document's claimed or in-progress operation before starting work. The default local convention is `Status: claimed`.
- **Review:** Store the review artifact at the alignment path required by the playbook. Do not put it in the issue file unless the tracker document requires it.
- **Submit:** Push the source branch and open the code-host pull request when the playbook requires one. Put the issue file path in the pull request body because a local issue has no external issue URL.
- **Resolve:** Apply the tracker document's resolved operation only after merge and push succeed. The default local convention is `Status: resolved`. Append the completion note under the documented comments heading when the tracker document requires comments.

A local Markdown ticket is not a GitHub issue. Do not run `gh issue view`, `gh issue comment`, `gh issue edit`, or `gh issue close` for it.

## External trackers

For GitHub, Jira, GitLab, or another configured backend, follow the operations in the tracker document and the relevant companion skill. Do not apply local Markdown file operations to an external ticket.

## Output identity

Report both values when available:

- `ticket`: the user-facing identifier.
- `tracker path`: the resolved local Markdown path, or the external tracker identifier or URL.

Use the tracker path in commit and pull request text when no external URL exists.
