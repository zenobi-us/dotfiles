# PR draft: Sync configured Jira queries into mirror files

- **Ticket:** [jira-tracker-mirror-02-sync-query](../../../../tracker/tickets/jira-tracker-mirror-02-sync-query.md)
- **Initiative:** [jira-tracker-mirror](../../../../tracker/initiatives/jira-tracker-mirror/index.md)
- **Receipt:** [implementation-0002](../../events/implementation-0002.yaml), parent [start-0001](../../events/start-0001.yaml)
- **Source:** `feat/jira-tracker-mirror-02-sync-query` at `5c9c2859ed8371a06dff37e159b899a8b7a82b1f` (tree `ba4e4fa1e0f24825edd8f29cb9cea35f2af6c4e3`)

## Problem

A Jira tracker has no local copy of its issues. The Tracker pane cannot list epics, and each read needs a live `twg` call. This ticket adds the sync command that writes the mirror. The snapshot reader is ticket 03.

## Implementation

- `scripts/adf-markdown.ts` converts an Atlassian Document Format (ADF) description to Markdown. It keeps mentions, inline cards, emoji, dates, status lozenges, links, code, lists, panels, tables, and media placeholders. An unknown node keeps its child text.
- `scripts/twg-jira.ts` now requests the `updated` field and returns `updated` and `descriptionMarkdown`. The plain-text `description` stays as it was.
- `scripts/jira-mirror.ts sync --repository <path>` reads the `mirror` block of `docs/agents/issue-tracker.md` through shared-context. It runs each query unchanged (no status filter), and writes `<root>/<KEY>.md` with `schema: tracker-mirror/v1` frontmatter. Each frontmatter value is JSON, which is valid YAML, so quotes in Jira text cannot break it.
- A file keeps its earlier `synced_at` when nothing else changed. A sync with no Jira changes therefore writes nothing and makes no commit.
- The command commits only the mirror root with `git commit --only -- .`. Changes that someone else staged stay staged.
- `references/stores/jira.md` describes the `mirror` block and the command.

## Changed files

- `.../reading-and-writing-tickets/references/stores/jira.md`
- `.../reading-and-writing-tickets/scripts/adf-markdown.ts`
- `.../reading-and-writing-tickets/scripts/adf-markdown.test.ts`
- `.../reading-and-writing-tickets/scripts/fixtures/twg/query-mirror-epics.json`
- `.../reading-and-writing-tickets/scripts/jira-mirror.ts`
- `.../reading-and-writing-tickets/scripts/jira-mirror.test.ts`
- `.../reading-and-writing-tickets/scripts/twg-jira.ts`
- `.../reading-and-writing-tickets/scripts/twg-jira.test.ts`

## Validation

| Check | Result |
| --- | --- |
| `mise exec -- bun test` in the skill | Passed: 67 pass, 0 fail. 19 new tests. |
| `bun run typecheck` in `bundles/matt-pocock` | Passed. The base checkout `node_modules` was linked for the run and removed after. |
| `records.ts check --ticket jira-tracker-mirror-02-sync-query` | Passed. |
| Live sync 1 on the reckonone shared context | 219 mirror files, commit `9eb547603ebc9a402ff0b69ac0e44d5229c6cb53` in `/home/zenobius/Projects/zeno`. |
| Live sync 2 | 0 files written, 219 unchanged, no commit. `HEAD` stayed `9eb5476`. |
| Earlier staged changes in `/home/zenobius/Projects/zeno` | Unchanged. The index diff against the pre-check `HEAD`, without the new paths, hashes to `f77909cf…` before and after. |

## Live check deviation

The `hk.pkl` pre-commit hook in `/home/zenobius/Projects/zeno` rebuilds `context.json` and adds it to every commit. Both live-check commits therefore also contain a rebuilt `context.json`:

- `31cef2f34f5e50642421afaaeaa348f87c2080c5`: tracker definition plus `context.json`.
- `9eb547603ebc9a402ff0b69ac0e44d5229c6cb53`: 219 mirror files plus `context.json`.

The staged `context.json` (blob `d3b842f`) stays staged and unchanged. Nothing was pushed.

## Review history

No review yet.

## Merge status

Not merged.
