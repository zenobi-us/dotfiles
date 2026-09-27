# Playbook: submit

Submit the reviewed work for the resolved ticket as a pull request.

Submit commits, pushes, and opens a pull request from the current worktree — it does not open a new pane or launch a fresh agent. The muxer and agent contracts do not apply to this playbook.

## Ticket resolution

Load `references/issue-tracker.md` and the ticket skill before resolving the ticket. Use the ticket skill to return the canonical `ticket` and `tracker path`. If no identifier is present, use the most recent unambiguous ticket mention in the conversation. Cross-check it against workflow records. Ask when it is missing or ambiguous. Do not guess.

# Preconditions

- Use the `worktrunk` skill. Worktrunk is required for worktree and branch operations.
- Use the applicable Matt Pocock engineering skills, especially `code-review` and `implement`.
- Treat the shared agent context as durable project memory. Run `<shared-context-skillroot>/scripts/shared-context/cli.ts` from the source repository and use its reported `root` and `storage` fields. Do not derive `ALIGNMENT_ROOT` or a ticket path by hand.
- Follow `ALIGNMENT-ROOT.md` from the reported root. Keep alignment files in that reported storage and keep source code, commits, and pull requests in the worktree repository. Local-only and private stores remain within their access boundary.
- Run the CLI before choosing any context path or link. Use `cli.ts anchor --source local --key <ticket-id>` for ticket-scoped files, and use the returned directory rather than joining paths yourself.
- Follow the `Shared-context writes and links` section of the `agent-core:shared-context` skill for writes, publishing, and access-boundary checks. Use `SharedContext/<relative-path>` for a private or local-only reference; do not create a public URL.
- Follow `references/issue-tracker.md` and the ticket skill for the configured tracker and returned `tracker path`.
- Require a matching persisted `SUCCESS` verdict from the `review` playbook at the tracker-defined review artifact path. See `references/troubleshooting/missing-review-verdict.md` if this gate blocks you.
- A manual test report is optional. A missing report does not block the pull request.
- Do not push directly to the base branch.

Ask the user for the missing ticket before continuing. Exit if the review artifact scope does not match the resolved ticket or if you cannot identify:

1. The source worktree.
2. The source branch.
3. The base branch.
4. The issue or ticket.

# Process

1. Run the shared-context CLI from the source repository. Use its reported root and storage mode; do not construct either path manually.
2. Resolve the current worktree (for `herdr`: `herdr worktree list --cwd "$PWD" --json`; other muxers have no equivalent lookup — use `git`/`wt` state directly instead).
3. Use Worktrunk to verify the source branch and worktree state.
4. Make sure that the source worktree has no unintended changes. Commit intended changes with the `writing-and-creating-git-commits` skill. Put the ticket reference in the commit title. Include the ticket link and a link, per the `agent-core:shared-context` skill's reference rule, to every ADR the review verdict relied on in the commit body.
5. Run the smallest validation command recorded by the successful review.
6. Look for a manual test report for the resolved ticket. See "Manual test reports" below.
7. Push the source branch.
8. Use the pull request creation skill if available. Otherwise use `gh pr create`.
9. Add these items to the pull request body:
   - the ticket link or the `tracker path` returned by the ticket skill when no external link exists,
   - a link, per the `agent-core:shared-context` skill's reference rule, to the successful review artifact,
   - a link, per the `agent-core:shared-context` skill's reference rule, to every ADR the review verdict relied on,
   - a link to every manual test report found in step 6, per "Manual test reports" below,
   - validation output,
   - a concise summary of changes.
10. Leave the source worktree open. Do not remove it after submitting the pull request.

# Manual test reports

The `browser-acceptance-evidence` skill writes browser evidence to shared context. The `writing-reports` skill writes the HTML report itself. Both leave a report a reviewer can open.

## Find the report

1. You **MUST** ask the shared-context CLI for the ticket anchor, then search the returned directory. Do not construct the root and ticket path by hand:

   ```bash
   REPORT_ROOT=$("<shared-context-skillroot>/scripts/shared-context/cli.ts" anchor --source local --key "<ticket-id>" --dry-run)
   find "$REPORT_ROOT" -maxdepth 3 -name index.html
   ```

   Use the CLI from the source repository. If it exits non-zero, stop. The returned
   anchor is authoritative even when storage is local-only or private. Older tickets
   use `manual-test/` or another report directory name, so match on `index.html`.
2. You **MUST** treat zero results as "no manual test report". Say so in the output. Do not create one and do not block the pull request.
3. You **MUST** list every report you find. A ticket can hold more than one.

## Link the public view

A report is HTML. A raw git forge blob link renders the source, not the page. Link the published view instead.

1. You **MUST** commit and push the report before you build any link, per the `agent-core:shared-context` skill's write rule. An unpushed report is a dead link.
2. You **MUST** use the shared context store's public view URL only when the CLI reports a shared git store with a usable remote and the destination has the same public access boundary. Read `PUBLIC-VIEW.md` from the reported store root for the base URL and path rule. The report URL is the published anchor-relative path joined to that base URL, and it **MUST** end in a trailing slash on a directory that holds `index.html`.
3. If the store is local-only, private, has no usable remote, or has a different access boundary, do not make a public URL. Use the `agent-core:shared-context` skill's `SharedContext/<path relative to the reported root>` reference and say that the link is local/source-only, not a rendered public report.
4. You **MUST NOT** link a `file://` path, a path inside the worktree, or a public URL that crosses an access boundary.

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
