# Playbook: submit

Submit the reviewed work for the resolved ticket as a pull request.

Submit commits, pushes, and opens a pull request from the current worktree — it does not open a new pane or launch a fresh agent. The muxer and agent contracts do not apply to this playbook.

## Ticket resolution

Load `references/issue-tracker.md` and the project issue tracker definition before resolving the ticket. Resolve the ticket before submitting work.

1. Use an explicit issue or ticket identifier in `UserRequest`.
2. If `UserRequest` has no identifier, use the most recent unambiguous ticket mention in the conversation.
3. Cross-check the inferred ticket against the current worktree and persisted workflow or review records.
4. If no unique ticket matches, or candidates conflict, ask the user which ticket to submit.
5. Do not guess or silently choose a ticket.

# Preconditions

- Use the `worktrunk` skill. Worktrunk is required for worktree and branch operations.
- Use the applicable Matt Pocock engineering skills, especially `code-review` and `implement`.
- Treat the shared agent context as durable project memory. Resolve `ALIGNMENT_ROOT` from `<shared-agent-context>` or fall back to the repository root. Run `/agent-core context report` and read relevant context and ADRs before submitting.
- Follow `ALIGNMENT-ROOT.md`. Keep alignment files in the active storage location and keep source code, commits, and pull requests in the worktree repository.
- Follow `SHARED-CONTEXT-LINKS.md` for the write rule (any shared-context file created or updated while submitting this ticket) and the reference rule (linking ADRs, tasks, the review artifact, or a manual test report in the commit message and pull request body).
- Follow `references/issue-tracker.md` for the configured tracker. For local Markdown, use the resolved issue path in place of an external issue URL.
- Require a matching persisted `SUCCESS` verdict from the `review` playbook, read from `<ALIGNMENT_ROOT>/docs/agents/reviews/{ticket-id}.md` in the active shared agent context root. See `references/troubleshooting/missing-review-verdict.md` if this gate blocks you.
- A manual test report is optional. A missing report does not block the pull request.
- Do not push directly to the base branch.

Ask the user for the missing ticket before continuing. Exit if the review artifact scope does not match the resolved ticket or if you cannot identify:

1. The source worktree.
2. The source branch.
3. The base branch.
4. The issue or ticket.

# Process

1. Resolve the active `ALIGNMENT_ROOT` and run `/agent-core context report`.
2. Resolve the current worktree (for `herdr`: `herdr worktree list --cwd "$PWD" --json`; other muxers have no equivalent lookup — use `git`/`wt` state directly instead).
3. Use Worktrunk to verify the source branch and worktree state.
4. Make sure that the source worktree has no unintended changes. Commit intended changes with the `writing-git-commits` skill, including the ticket link and a link, per `SHARED-CONTEXT-LINKS.md`'s reference rule, to every ADR the review verdict relied on.
5. Run the smallest validation command recorded by the successful review.
6. Look for a manual test report for the resolved ticket. See "Manual test reports" below.
7. Push the source branch.
8. Use the pull request creation skill if available. Otherwise use `gh pr create`.
9. Add these items to the pull request body:
   - the ticket link, or the resolved local Markdown tracker path when no external link exists,
   - a link, per `SHARED-CONTEXT-LINKS.md`'s reference rule, to the successful review artifact,
   - a link, per `SHARED-CONTEXT-LINKS.md`'s reference rule, to every ADR the review verdict relied on,
   - a link to every manual test report found in step 6, per "Manual test reports" below,
   - validation output,
   - a concise summary of changes.
10. Leave the source worktree open. Do not remove it after submitting the pull request.

# Manual test reports

The `browser-acceptance-evidence` skill writes browser evidence to shared context. The `writing-reports` skill writes the HTML report itself. Both leave a report a reviewer can open.

## Find the report

1. You **MUST** search the ticket directory in the active shared agent context root:

   ```bash
   find "$ALIGNMENT_ROOT/{ticket-id}" -maxdepth 3 -name index.html
   ```

   The canonical path is `<ALIGNMENT_ROOT>/{ticket-id}/manual-tests/report/index.html`. Older tickets use `manual-test/` or another report directory name, so match on `index.html` and not on the directory name.
2. You **MUST** treat zero results as "no manual test report". Say so in the output. Do not create one and do not block the pull request.
3. You **MUST** list every report you find. A ticket can hold more than one.

## Link the public view

A report is HTML. A raw git forge blob link renders the source, not the page. Link the published view instead.

1. You **MUST** commit and push the report before you build any link, per `SHARED-CONTEXT-LINKS.md`'s write rule. An unpushed report is a dead link.
2. You **MUST** use the shared context store's public view URL when the store records one. Read `<shared-context-repo-root>/PUBLIC-VIEW.md` for the base URL and the path rule. The report URL is that base URL joined with the report's path from the shared-context repository root, and it **MUST** end in a trailing slash on a directory that holds `index.html`.
3. If the store records no public view URL, you **MUST** fall back to the `SHARED-CONTEXT-LINKS.md` reference rule link and say in the output that the link shows source, not the rendered report.
4. You **MUST NOT** link a `file://` path and you **MUST NOT** link a path inside the worktree.

# Safety rules

- Do not create a pull request without the matching persisted `SUCCESS` review artifact.
- Do not include unrelated changes in the commit.
- Do not push directly to the base branch.
- Do not link a manual test report that is not pushed.

# Output

```md
## Submitted
- Pull request: {url}
- Ticket: {ticket}
- Source branch: {branch}
- Base branch: {base}

## Validation
- {command}: {result}

## Review gate
- Verdict: SUCCESS
- Scope: {reviewed scope}

## Manual test reports
- {url, or "none found"}
```
