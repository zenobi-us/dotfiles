# Playbook: submit

Submit the reviewed work for the resolved ticket as a pull request.

Submit commits, pushes, and opens a pull request from the current worktree. This playbook does not open a new pane or launch a fresh agent, so the `muxer-subagents` skill does not apply to it.

## Ticket resolution

Load `references/issue-tracker.md` and the ticket skill before resolving the ticket. Use the ticket skill to return the canonical ticket `ref` and backend. If no identifier is present, use the most recent unambiguous ticket mention in the conversation. Cross-check it against workflow records. Ask when it is missing or ambiguous. Do not guess.

# Preconditions

- Use the `worktrunk` skill. Worktrunk is required for worktree and branch operations.
- Use the applicable Matt Pocock engineering skills, especially `code-review` and `implement`.
- Treat shared agent context as durable project memory. Run `shared-context`
  from the source repository and record its route table and alignment root.
- Follow `ALIGNMENT-ROOT.md` from the reported alignment root. Keep source code,
  commits, and pull requests in the worktree repository. Resolve every
  file-backed record to its configured store.
- Resolve the workflow root with
  `shared-context resolve workflow --id <ticket-id>`.
- Follow the `Shared-context writes and links` section of the
  `agent-core:shared-context` skill for each shared-store record.
- Follow `references/issue-tracker.md` and the ticket skill for tracker
  operations and the ticket `ref`.
- Read `references/receipts.md`.
- Require an immutable `SUCCESS` review receipt from the `review` playbook that
  covers the current source commit and tree. Read its artifact under
  `artifacts/reviews/`. See
  `references/troubleshooting/missing-review-verdict.md` if this gate blocks you.
- A manual test report is optional. A missing report does not block the pull request.
- Do not push directly to the base branch.

Ask the user for the missing ticket before continuing. Exit if the review artifact scope does not match the resolved ticket or if you cannot identify:

1. The source worktree.
2. The source branch.
3. The base branch.
4. The issue or ticket.

# Process

1. Run the shared-context CLI from the source repository. Record its route table
   and resolve the workflow root with `shared-context resolve workflow --id <ticket-id>`.
2. Resolve the current worktree from `git` and `wt` state. Submit runs in the current worktree and does not ask a muxer where it is.
3. Use Worktrunk to verify the source branch and worktree state.
4. Make sure that the source worktree has no unintended changes. Commit intended changes with the `skill://commit` skill. Put the ticket reference in the commit title. Include the ticket link and a link, per the `agent-core:shared-context` skill's reference rule, to every ADR the review verdict relied on in the commit body.
5. Run the smallest validation command recorded by the successful review.
6. Look for a manual test report for the resolved ticket. See "Manual test reports" below.
7. Append a `submit` phase-start receipt before pushing the source branch.
8. Push the source branch.
9. Use the pull request creation skill if available. Otherwise use `gh pr create`.
10. Add these items to the pull request body:
   - the ticket `ref` returned by the ticket skill;
   - a link, per the `agent-core:shared-context` skill's reference rule, to the successful review artifact,
   - a link, per the `agent-core:shared-context` skill's reference rule, to every ADR the review verdict relied on,
   - a link to every manual test report found in step 6, per "Manual test reports" below,
   - validation output,
   - a concise summary of changes.
11. Append a `submit` phase-result receipt with the pull request URL and pushed commit. Append a phase-complete receipt after the result is read. Leave the source worktree open. Do not remove it after submitting the pull request.

# Manual test reports

Manual test evidence belongs under `artifacts/evidence/manual-test-<run-id>/` in
the resolved evidence store. One run contains its test plan, results,
diagnostics, screenshots, scripts, fixtures, and report. The report MUST link
to these inputs. It MUST NOT copy them into a generated `report/files/`
directory.

## Find the report

1. Read workflow receipts and list the evidence run references they created.
2. Resolve each run's evidence root:

   ```bash
   shared-context resolve evidence --workflow "<ticket-id>" --run "manual-test-<run-id>"
   ```

3. Inspect each resolved evidence root with the available filesystem tool. List
   every `index.html` under a `manual-test-<run-id>/` directory. Do not derive
   a root.
4. Treat zero results as "no manual test report". Say so in the output. Do not
   create one and do not block the pull request.

## Link the public view

A report is HTML. A raw git forge blob link renders source, not the page.

1. Commit and push the report before you build a link. An unpushed report is a
   dead link.
2. Use a public view URL only when the resolved evidence store is a public git
   store with a usable remote and the destination has the same access boundary.
   Read `PUBLIC-VIEW.md` from the resolved evidence store for the base URL and
   path rule. The URL MUST end in a trailing slash on the directory that holds
   `index.html`.
3. If the store is local-only, private, has no usable remote, or has a different
   access boundary, do not make a public URL. Use
   `SharedContext/<path relative to the resolved store root>` and say that the
   link is local/source-only, not a rendered public report.
4. Do not link a `file://` path, a path inside the worktree, or a public URL
   that crosses an access boundary.

# Safety rules

- Do not create a pull request without the matching immutable `SUCCESS` review receipt and review artifact for the current source commit.
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
