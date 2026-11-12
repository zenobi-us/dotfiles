# Implementation log: jira-tracker-mirror-02-sync-query

## Receipt history

| Receipt | Event | Attempt | Status | Source commit | Source tree |
| --- | --- | --- | --- | --- | --- |
| [start-0001](../events/start-0001.yaml) | phase-start | 1 | started | 0d8054348a2ea89fd10f53353669d2fee083ccf1 | 74e0661ef87687eee5421cad725f2b1c9198c07e |
| [implementation-0002](../events/implementation-0002.yaml) | phase-result | 1 | completed | 5c9c2859ed8371a06dff37e159b899a8b7a82b1f | ba4e4fa1e0f24825edd8f29cb9cea35f2af6c4e3 |
| [start-0003](../events/start-0003.yaml) | phase-complete | 1 | completed | 5c9c2859ed8371a06dff37e159b899a8b7a82b1f | ba4e4fa1e0f24825edd8f29cb9cea35f2af6c4e3 |
| [review-start-0004](../events/review-start-0004.yaml) | phase-start | 1 | started | 5c9c2859ed8371a06dff37e159b899a8b7a82b1f | ba4e4fa1e0f24825edd8f29cb9cea35f2af6c4e3 |
| [review-0005](../events/review-0005.yaml) | phase-result | 1 | completed (SUCCESS) | 5c9c2859ed8371a06dff37e159b899a8b7a82b1f | ba4e4fa1e0f24825edd8f29cb9cea35f2af6c4e3 |
| [review-complete-0006](../events/review-complete-0006.yaml) | phase-complete | 1 | completed (superseded) | 5c9c2859ed8371a06dff37e159b899a8b7a82b1f | ba4e4fa1e0f24825edd8f29cb9cea35f2af6c4e3 |
| [review-complete-0007](../events/review-complete-0007.yaml) | phase-complete | 1 | completed | 5c9c2859ed8371a06dff37e159b899a8b7a82b1f | ba4e4fa1e0f24825edd8f29cb9cea35f2af6c4e3 |
| [finish-0008](../events/finish-0008.yaml) | phase-complete | 1 | FINISH_FAILED | 5c9c2859ed8371a06dff37e159b899a8b7a82b1f | ba4e4fa1e0f24825edd8f29cb9cea35f2af6c4e3 |
| [review-start-0009](../events/review-start-0009.yaml) | phase-start | 2 | started | b918ef940649f41b1bc586e68e4a4395cd124696 | da2ec59d2c877de29694405f02b979568cae2b53 |
| [review-0010](../events/review-0010.yaml) | phase-result | 2 | completed (SUCCESS) | b918ef940649f41b1bc586e68e4a4395cd124696 | da2ec59d2c877de29694405f02b979568cae2b53 |
| [review-complete-0011](../events/review-complete-0011.yaml) | phase-complete | 2 | completed | b918ef940649f41b1bc586e68e4a4395cd124696 | da2ec59d2c877de29694405f02b979568cae2b53 |
| [finish-prepared-0012](../events/finish-prepared-0012.yaml) … [finish-finished-0018](../events/finish-finished-0018.yaml) | finish checkpoints | 2 | FINISHED | b918ef940649f41b1bc586e68e4a4395cd124696 | da2ec59d2c877de29694405f02b979568cae2b53 |

## implementation-0002

### Changed files

- `references/stores/jira.md`
- `scripts/adf-markdown.ts` (new)
- `scripts/adf-markdown.test.ts` (new)
- `scripts/fixtures/twg/query-mirror-epics.json` (new)
- `scripts/jira-mirror.ts` (new)
- `scripts/jira-mirror.test.ts` (new)
- `scripts/twg-jira.ts`
- `scripts/twg-jira.test.ts`

All paths are under `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/`.

### Validation

- `mise exec -- bun test`: passed, 67 pass, 0 fail.
- `bun run typecheck`: passed (base checkout `node_modules` linked for the run, then removed).
- `records.ts check --ticket jira-tracker-mirror-02-sync-query`: passed.
- Live sync 1: 219 files, commit `9eb547603ebc9a402ff0b69ac0e44d5229c6cb53` in `/home/zenobius/Projects/zeno`.
- Live sync 2: 0 written, no commit.
- Earlier staged changes in `/home/zenobius/Projects/zeno`: unchanged.

### Unresolved questions

- The `hk.pkl` pre-commit hook in `/home/zenobius/Projects/zeno` added a rebuilt `context.json` to commits `31cef2f` and `9eb5476`. The parent must accept this or choose another commit method.
- The sync does not mark issues that no query returns. Ticket 04 adds this.
- `jira_updated` keeps the raw `twg` offset format. Ticket 04 must convert it for `updated >=` JQL.

## review-0005

- Verdict: SUCCESS for `5c9c2859` / `ba4e4fa1`. Artifact: [review-review-0005.md](../artifacts/reviews/review-review-0005.md).
- `review-0005` records a future `created_at` (`2026-11-12T12:30:00.000Z`). `review-complete-0007` supersedes `review-complete-0006` so the inspector orders the receipts correctly.

## finish attempt 2

- `finish-0008`: `origin/master` had moved. The branch was rebased to `b918ef94` (identical diff) and reviewed again in `review-0010` (SUCCESS).
- Worktrunk fast-forwarded `master` over the 2 reviewed commits; it did not squash. `master` and `origin/master` reached `b918ef94`; the ticket was completed in `008ab869`.
- The inspector reports `finish / reconcile`: it expects one squash commit whose parent is `base_before`. The integration is the reviewed commit itself.
