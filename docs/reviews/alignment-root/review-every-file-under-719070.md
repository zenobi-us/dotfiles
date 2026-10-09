# Agent review: developer ALIGNMENT_ROOT references

- Agent: `review-every-file-under-719070`
- Scope: all files under `.mise/conf.d/devtools-agent/bundles/developer/skills` containing `ALIGNMENT_ROOT`, including `writing-reports`
- Result: no files edited

## Findings

### P0 — Manual report discovery bypasses the CLI

File: `worktree/references/playbooks/submit.md:55-61`

The fixed `find "$ALIGNMENT_ROOT/{ticket-id}"` command can use a stale root, miss CLI-managed locations, and assumes a fixed report layout. Replace it with a CLI-resolved report anchor or evidence directory.

### P0 — `submit` requires publishing when storage may be local-only

File: `worktree/references/playbooks/submit.md:67-71`

Make commit, push, public-view URL, and fallback behaviour conditional on the CLI-reported storage mode, remote, and access boundary. Local-only storage must remain valid and report that no remote link exists.

### P1 — Worktree playbooks resolve the root from injected context or fallback text

Files:

- `worktree/references/playbooks/start.md:17-20`
- `worktree/references/playbooks/review.md:17-21`
- `worktree/references/playbooks/fix.md:17-20`
- `worktree/references/playbooks/finish.md:15-17`
- `worktree/references/playbooks/submit.md:15-17`

Run the shared-context CLI from the active repository. Treat its `root` and `storage` fields as authoritative. Do not resolve the root from injected context or derive it from the repository root.

### P1 — `new-report.ts` documents hand-built shared-context paths

File: `devtools/writing-reports/scripts/new-report.ts:16-20`

Obtain the destination from the shared-context CLI and do not construct an `ALIGNMENT_ROOT` path by hand.

### P2 — `issue-tracker.md` uses an unresolved shell variable

File: `worktree/references/issue-tracker.md:5-10`

Tell callers to run the CLI and read the tracker document under the reported root. Do not rely on an ambient variable.

### P2 — Playbooks mix CLI-first wording with legacy `ALIGNMENT-ROOT.md` resolution

Files:

- `start.md:17-18`
- `fix.md:17-18`
- `review.md:17`
- `finish.md:15-16`
- `submit.md:15-16`

Keep `ALIGNMENT-ROOT.md` for storage scope and classification. Do not use it as the root-resolution mechanism.

## Acceptable uses

Workflow and handoff records may retain the resolved root and storage mode as metadata, provided the values come from the CLI.
