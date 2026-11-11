---
blocked_by: []
id: herdr-context-panels
schema: tracker-ticket/v1
title: Add native Context and Tracker panels to Herdr
triage: ready-for-agent
type: task
work_status: claimed
---

## What to build

Implement the accepted Herdr-app Context and Tracker panels. Use the existing shared-context and tracker TypeScript modules through direct imports in a local Bun service. Keep the existing Files and Changes panels.

## Acceptance criteria

- Add Context and Tracker controls beside Files and Changes.
- Show explicit context onboarding and the resolved file collections.
- Show initiatives, ticket dependency trees, shared prerequisite links, queues, record details, and workflow events from canonical data.
- Provide C as a stacked bottom drawer with expand, collapse, close, keyboard dismissal, and native motion.
- Provide C2 as the same compact tree beside record details.
- Expose the C or C2 preference through mod.schema.json for Better Config.
- Preserve selection per repository. Discard stale responses.
- Keep setup and fresh-chat actions explicit. Revalidate action inputs before launch.
- Exercise the native panels and setting changes in Herdr-app.

## Comments

The user selected C and C2 after the interactive prototype. This session owns this new ticket. No earlier owner or workflow exists for this new identifier. Keep the ticket incomplete until merge and push succeed.


### Native implementation — 2026-11-09

The implementation is in `mise/conf.d/shells-herdr/app/`. The installer adds Context and Tracker to the `shared-context` layout. It keeps the existing Files and Changes mods.

C uses a stacked bottom drawer. Expand covers the tree. Escape collapses the drawer, then closes it. C2 puts details beside the tree when the panel is at least 600px wide. Narrow panels use the drawer. Better Config exposes Tracker layout and Drawer motion.

The Bun service imports the canonical TypeScript APIs. The GUI does not execute the shared-context or tracker CLI to read its output. The canonical tracker reader uses `mq` and `okf.mq` to parse Markdown. Context previews render file text in the native app.

The README contains the install command and the operating limits.

#### Verification

- Source checks ran in `mise/conf.d/shells-herdr/app/`. `bun test tests` passed: 5 tests, 10 assertions. `bun x --package typescript tsc --noEmit --project tsconfig.json` passed.
- Both installed mods passed `herdr-app check` in the private app and the normal app. The normal app reports layout `shared-context` and no runtime errors.
- Native checks exercised C expansion, collapse, close, Escape handling, C2, repository changes, and selection retention. Better Config saved both settings.
- Native onboarding controls worked with the pointer and keyboard. Repository setup created context files. The file tree displayed a real file preview. Both storage modes passed isolated API setup checks.
- The canonical reader parsed an isolated invalid event. The GUI showed its validation error and expanded its body and fields.
- The confirmation dialog prepared a canonical prompt. An input change cleared it. Cancel closed the dialog. I did not submit a launch from this dialog. A harmless native terminal verified argv and folder delivery.
- API checks rejected missing authorization, a foreign Origin, an escaped file path, and a stale preparation key. File browsing hid symlinks and `.git`.

#### Prototype source

The accepted HTML prototype is on local branch `prototype/herdr-context-c-c2-20261110`, commit `cd8b7808862115acae5fb59ceac15a4be4b52433`. The commit records the question and the C/C2 decision. The working tree no longer contains the HTML prototype.

#### Commit prerequisite

The feature remains uncommitted. These required canonical API files remain untracked and belong to other work:

- `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/preparation.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/document-cache.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspection-exec.ts`

A feature commit without these files would omit required imports. I did not include unrelated API work in a feature commit. The ticket remains claimed and incomplete. No merge or push was performed.


#### Commit resolution

The canonical read APIs are committed in `a13e114e`. The guarded handoffs are committed in `ba7d4569`. The earlier untracked API prerequisite is resolved. This change adds the native C and C2 panels, installer, settings, and guide.

The staged reader passed 46 tests with 226 assertions. Handoff preparation passed 7 tests with 22 assertions. Existing action coverage passed 14 tests with 74 assertions. The staged reader check used the exact index blob and did not include the unrelated receipt-repair changes.

The actual bundle manifests and marketplace entries match. `agent-core` is `0.1.22`. `developer` is `0.2.13`. The existing version task points to the absent `.mise/` directory, so direct staged-manifest checks verified the version increases.

Other work remains outside these commits. The ticket remains claimed until merge and push succeed.


### Independent review — review-0008

Verdict: FAILURE. Reviewed commit: `fa5a5e221fa8a31c3cae3be355f426aabf9e5e1c`. Timestamp: `2026-11-11T22:14:38.698Z`. [Immutable review](../../workflows/herdr-context-panels/artifacts/reviews/review-review-0008.md). The ticket remains claimed. Current implementation path: `mise/conf.d/devtools-herdrapp/app/`.
