# Review review-0005: jira-tracker-mirror-03-snapshot-from-mirror

## Verdict

FAILURE. 3 blocking findings.

- Frozen source commit: `498bed919039bcaf27df3e98be67e58f0ac530d4`
- Frozen tree: `edf3774fee84a03b479d3c916dba5c820bde69cb`
- Diff: `git diff 721046aa...498bed91` (commits `458559a9`, `498bed91`)
- Worktree was clean. HEAD and tree matched the frozen target.

## Scope

- Ticket `tracker/tickets/jira-tracker-mirror-03-snapshot-from-mirror.md`: all 8 acceptance criteria.
- Initiative `tracker/initiatives/jira-tracker-mirror/index.md`: "Implementation Decisions", sections Snapshot and Herdr-app mod. The `sync` button and `synced_at` age belong to ticket 05. Closure and stale marking by the writer belong to ticket 04.
- Changed files: `workflow.ts`, `inspect.test.ts` (worktree skill), `pi-shared-context/model.ts`, Herdr-app `tree.js`, `main.js`, `tests/tree.test.ts`.
- Standards: `AGENTS.md`, `~/.claude/CLAUDE.md`.
- ADRs: `docs/adr/0001-pi-ink-cleanup-trust-boundary.md` does not apply. All findings are `NO ADR`.

### Acceptance criteria

| Criterion | Result |
| --- | --- |
| No scope loads every mirror file; old error gone | Met. Tested. |
| Each Epic is an initiative; members by `parent` | Met. Direct children in `rootTicketIds`, transitive in `ticketIds`. Tested. |
| `blocked_by` gives edges; cycle and unknown-blocker checks as for local Markdown | Met for the unscoped load. Scoped loads regress (F2). |
| Issues without a mirrored epic go to "Ungrouped" | Met. Tested. |
| Stale records are marked in the pane | Not met against the specified field (F1). |
| Missing or empty mirror says to run a sync | Met. Tested, including a missing `mirror` block. |
| Unit tests use a mirror directory fixture | Met. |
| `collect-evidence` captures the reckonone Tracker pane | Not met (F3). |

### Correctness checks that passed

- `mirror.root` path safety: `validateRelativePath` rejects absolute, `..`, `.`, empty and backslash parts (`layout.ts:10`). `DocumentReadSession.collect` and `readAll` use the alignment root as store root, and `document-cache.ts:218,226,279-281` reject symlink escape. Only direct children of the mirror root are read (`workflow.ts:484`).
- Unknown `schema`, id and file-name mismatch, wrong `ref`, and parent cycles are rejected and tested.
- A `parent` outside the mirror leaves the child in "Ungrouped". Epics count as assigned, so an epic is not also listed in "Ungrouped".
- Status maps through `jiraStatus` from `status` and `status_category`. `archived` is rejected and tested.
- Epics list under Planning in `tree.js:53` and `model.ts:106`. Tested in `tree.test.ts`.
- Other backends keep their behaviour. `localSnapshot` and `githubSnapshot` are not changed. `scope ? scopedSnapshot(...)` equals the old `scope && backend !== "jira"` for both. The "assigned" change applies to `jira` only.
- Standards: no new script, no Python, no tsconfig change. The cross-bundle import is acceptable (N2).

## Findings

### Blocking

NO ADR : The snapshot reads a stale field that the specified writer contract does not write.

  - [mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow.ts:509] The code reads `doc.fields.stale === true`. The initiative (Sync command, step 6) and ticket 04 (acceptance criterion 4) say a `--full` sync marks a key with `mirror_status: stale`. When ticket 04 lands as written, no row ever shows as stale.
  - [mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.test.ts:146] The fixture writes `stale: true`, so the test proves the wrong contract.

  Why it blocks: the criterion "Stale mirror records are marked as stale in the pane" is not met for the field the initiative defines. Required change: read `mirror_status` (`stale` marks the row; reject an unknown value), and change the fixture to `mirror_status: "stale"`. If the field name must change instead, change the initiative and ticket 04 first, with Q's approval.

NO ADR : One unmirrored blocker anywhere in the mirror rejects every scoped load.

  - [mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow.ts:514] The unknown-blocker check runs on the whole mirror before `scopedSnapshot` at `workflow.ts:54`.
  - Live, read-only: `inspect.ts https://reckon.atlassian.net/browse/RWR-10411 --json` in `reckonone-monorepo` fails with "Missing ticket blocker: POR-6673. Jira issue RWR-12833 is blocked by POR-6673". RWR-10411 has no blockers. Before this change, a scoped load used the `cli:` adapter and worked.

  Judgement on the rejection rule:
  - For the unscoped Tracker pane, rejecting the snapshot matches criterion 3 ("as for local Markdown"). It is correct for this ticket. Ticket 04 adds `closure: [blockers]`, which fetches outside keys with `key in (...)`, including keys from another project such as POR. Severity of the pane error alone: minor, temporary until ticket 04.
  - For scoped loads, the rule is a regression. The initiative (Herdr-app mod) says "Per-ticket Git inspection keeps working". After merge, every worktree playbook and `inspect.ts` call for a reckonone Jira ticket fails until ticket 04 is merged and a sync runs. It also fails after ticket 04 if one blocker is not readable by the user. Severity: major.

  Why it blocks: it breaks a working flow for one Jira ticket, which the initiative requires to keep working. Required change: for a scoped load, check unknown blockers only in the blocker closure of the selected tickets. Keep the whole-mirror check for the unscoped load. Add a test: a scoped load of a ticket succeeds while another mirror file has an unmirrored blocker.

NO ADR : Acceptance criterion 8 (`collect-evidence` captures the reckonone Tracker pane) is not met.

  - [tracker/tickets/jira-tracker-mirror-03-snapshot-from-mirror.md:26] No capture exists. `implementation-0002.yaml` records that the installed mod runs from the base checkout and the live snapshot fails.

  Why it blocks: a ticket cannot complete with an unmet acceptance criterion. Required change, one of: (a) capture the pane with a fixture mirror or after closure, with the mod linked to the worktree for the run; or (b) Q approves moving this criterion to ticket 04 or 05, and the ticket text records the move.

### Non-blocking notes

- N1 (minor) `workflow.ts:502`: when `status_category` is null, `state` becomes the raw status name, such as "To Do". The pane and recovery do not know that state. The writer always writes a category (`twg-jira.ts:100`). Reject a missing category instead.
- N2 (info) `workflow.ts:9`: the import of `MIRROR_SCHEMA` from the `matt-pocock` CLI script `jira-mirror.ts` is acceptable. `workflow.ts:8` already imports `record-schema` from the same bundle, and `jira-mirror.ts:231` guards its CLI with `import.meta.main`. The import loads the writer's `twg` modules for one constant. Moving the constant to `record-schema.ts` is cleaner.
- N3 (info) `workflow.ts:54`: a scoped load for an unknown or malformed Jira ref now returns an empty snapshot. The old code rejected a malformed ref. `inspect.ts:16` still reports "No ticket matches the canonical reference", so the user sees an error.
- N4 (info) `references/playbooks/tasks.md:22` still says not to list every Jira epic. The mirror is now a bounded listing. Ticket 06 can update it.
- N5 (info) The live mirror has 219 epics and no children. Even with closure, epic membership stays empty until `closure: [children]` runs. This is ticket 04 scope.

## Validation

| Command | Result |
| --- | --- |
| `git rev-parse HEAD HEAD^{tree}`; `git status --porcelain` | Matched frozen commit and tree; clean. |
| `mise exec -- bun test` in `developer/skills/git/worktree` | 63 pass, 0 fail. |
| `mise exec -- bun test tests` in `devtools-herdrapp/app` | 38 pass, 0 fail. |
| `inspect.ts .../browse/RWR-12833 --json` in `reckonone-monorepo` (read-only) | Error: "Missing ticket blocker: POR-6673". |
| `inspect.ts .../browse/RWR-10411 --json` in `reckonone-monorepo` (read-only; ticket has no blockers) | Same error. Confirms F2. |

Not run:

- `pi-shared-context` tests. The change is one string added to a list, the same as `tree.js:53`, and the implementation receipt records 152 pass. No `node_modules` were linked.
- `bun run typecheck`. The receipt records two known errors in files outside this diff. The reviewer did not repeat it.

No file in `/home/zenobius/Projects/zeno` was changed. No sync ran.

### Recorded validation in `implementation-0002.yaml`

The recorded test counts match the reviewer's runs. The receipt reports the live failure and the missing pane capture honestly as open questions. It does not mention the scoped-load regression (F2) or the `mirror_status` mismatch (F1).
