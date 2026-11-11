---
title: Herdr Context and Tracker retrospective review — review-0008
type: Report
---

# Retrospective review

## Verdict

FAILURE. Four blocking findings remain: one Standards finding and three Spec findings. The original dependency-tree and stale-response requirements are not met.

## Frozen scope

Ticket: tracker/tickets/herdr-context-panels.md (local-markdown). Source branch: closeout/herdr-context-panels. Base branch: master. Source checkout: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/closeout-herdr-context-panels. Workflow store: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles, workflows/herdr-context-panels.

Reviewed commit: fa5a5e221fa8a31c3cae3be355f426aabf9e5e1c. Reviewed tree: 67b6bdd4a5722a71d6c9c3a2306628b8d412d90c. Fixed point: e31985e76c5f3bdc0a6223c82248321f447f6ec0. Diff: git diff e31985e76c5f3bdc0a6223c82248321f447f6ec0...fa5a5e221fa8a31c3cae3be355f426aabf9e5e1c. Initial implementation: 54ae8fda502866b531edf4e08464d643ee5438cc. Historical shells-herdr/app moved to devtools-herdrapp/app.

Scope includes native shared-context/shared-context-tabs, Context/Tracker layout and tabs, settings/preferences, installer/task integration, and direct canonical shared-context/tracker imports. Unrelated commits are excluded. Review covers current implementation, not an empty master-to-closeout diff. Source remains read-only.

The user authorized present-day verification of already-published work. This report does not establish historical review before publication and does not authorize another merge.

## Standards

Retrospective Standards review of fa5a5e221fa8a31c3cae3be355f426aabf9e5e1c against e31985e76c5f3bdc0a6223c82248321f447f6ec0, for tracker/tickets/herdr-context-panels.md. One medium correctness finding: S-001, incomplete refresh/restoration of expanded Context directories. No applicable ADR or hard documented coding-standard breach found. The ADR index contains only an unrelated Pi Ink decision. DESIGN.md and UI_FOUNDATION.md describe the Margin dashboard, not these native panels. No material baseline smell warrants a separate finding. Inspected canonical API reuse, collection containment, explicit setup, action revalidation, isolated-session launch, stale-response guards, native C/C2 rendering, settings, layout, tabs, and mise deployment/runtime integration. Read the supplied native acceptance report and PR draft; their checks are parent evidence, not checks executed by this reviewer. No source, workflow, or app changes; no build, lint, tests, or formatters run.

Session: t67; run 3a228969-f275-47b8-ab72-817300c0c51b. Fresh read-only child. No mid-flight build, lint, tests, formatters, or app mutation.

## Spec

Spec: three P2 findings; NO ADR applies.

P-001 — tree.js:15–23. Criterion: ‘Show initiatives, ticket dependency trees, shared prerequisite links, queues, record details, and workflow events from canonical data.’ The compact tree is flat initiative membership. Tickets have no expandable prerequisites. The supplied C2 screenshot confirms this. A separate graph does not supply the requested dependency tree. Restore dependency paths and shared references; verify a shared blocker in C and C2.

P-002 — action.js:18–22. Criteria: ‘Preserve selection per repository. Discard stale responses.’ and ‘Keep setup and fresh-chat actions explicit. Revalidate action inputs before launch.’ Pending preparation has no selection/repository generation guard before pane.split. [INFERENCE] Changing selection while it runs can still launch the obsolete action. Bind preparation to the originating selection. Validate delayed preparation with repository/record changes.

P-003 — main.js:185. Criterion: ‘Preserve selection per repository. Discard stale responses.’ Preview failures check only repository revision, unlike successes, which also check selection. A delayed failure for A can set a persistent error while readable B is selected. Apply request-generation guards to success and failure. Validate delayed A failure after B succeeds, including A-to-B-to-A ordering.

Coverage: read all nine original criteria, original implementation history, current Context/Tracker UI, managed layout/tabs, onboarding, collection resolution, canonical imports/parser/events, queues, C/C2, settings, selection guards and fresh-session launch. Assessed supplied acceptance JSON and native tree/graph captures. Other named behavior has implementation and supplied runtime evidence.

Read-only retrospective review of fa5a5e22 against e31985e7. No source or app changes. No builds, tests, formatters, or runtime actions were run. Supplied evidence does not cover these asynchronous orderings. No historical review is asserted.

Session: t68; run 55673dbd-20b7-48d6-afae-69f0c32df763. Fresh read-only child, launched in parallel with Standards. No mid-flight build, lint, tests, formatters, or app mutation. Parent supplied the bounded preview-failure concern; Spec assessed it and recorded P-003.

## Findings

### S-001 — medium — NO ADR

File: mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js:111.

[INFERENCE from source] Context refresh reloads only collection roots. Expanded descendant directories retain stale fileEntries. After a settings reload, fileFolders is restored but fileEntries is empty, so those descendants appear expanded with no children. The user must close and reopen each descendant to load its contents.

Required change: Reload every retained expanded directory during Context refresh and state restoration. Keep the existing repository-generation guards.

Validation: Expand a collection and a nested directory. Change that directory on disk and select Refresh; verify its children update. Reload the mod through Better Config and verify the expanded descendants still show their children. Parent must run these native scenarios; this review did not run the app.

Blocking reason: The restored Context tree hides retained expanded contents and refresh leaves nested collections stale.

### P-001 — P2 — NO ADR

File: mise/conf.d/devtools-herdrapp/app/mods/shared-context/tree.js:15-23.

The current tree renders initiative members at one depth and gives every ticket children: 0. It never traverses blockedBy. Its reference markers represent repeated initiative membership, not shared prerequisite paths. Dependency graphs and detail links exist, but they replace the requested dependency tree. The supplied c2-alpha.png confirms base, alpha and beta are siblings. The original implementation at 54ae8fda traversed blockers and emitted shared references.

Required change: Restore expandable dependency paths and shared prerequisite references in the compact tree used by C and C2. Keep the graph as an additional view, not the only dependency hierarchy.

Validation: Use alpha and beta blocked by base. Verify dependency nesting, a shared reference to base, reference navigation, and identical tree behavior in C and C2. No new checks were run during this read-only review.

Blocking reason: The behavior fails an original acceptance criterion.

### P-002 — P2 — NO ADR

File: mise/conf.d/devtools-herdrapp/app/mods/shared-context/action.js:18-22.

After awaiting prepare, launchAction checks only whether the captured pane still exists. It does not check the panel revision, current repository, or selected record. follow() and choose() can clear the action menu while preparation remains pending, but the old response still reaches pane.split. [INFERENCE] Switching repositories or records during preparation can therefore launch an obsolete action after the originating selection has disappeared. Canonical record revalidation does not validate the current GUI selection.

Required change: Bind launch preparation to an action generation and repository/record identity. Invalidate it on repository or record changes and discard obsolete results before pane.split, including stale error/state updates.

Validation: Delay a real preparation request, switch repository or record, then release it. Verify that no pane opens and the new selection receives no old error. Also verify unchanged selection still opens one fresh session. This ordering was not exercised in the supplied evidence.

Blocking reason: The behavior fails an original acceptance criterion.

### P-003 — P2 — NO ADR

File: mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js:185.

openFile captures the selected collection/path and checks it on success, but its catch checks only the repository revision. If preview A fails after the user selects B, A's error enters the panel-wide error banner. B's successful response does not clear it. The current file can therefore display a stale error, including an obsolete binary, size-limit, or missing-file error. This same-repository ordering is not covered by the supplied cross-repository checks.

Required change: Apply the current file-request identity guard to failure responses as well as successful previews. Use a monotonically increasing preview request generation so repeated selections of the same path cannot revive old responses.

Validation: Delay a failing preview A, select readable B, complete B, then release A. Verify B remains visible without A's error. Check A-to-B-to-A ordering as well. No runtime check was run during this review.

Blocking reason: The behavior fails an original acceptance criterion.

## Runtime evidence consumed

Evidence root: workflows/herdr-context-panels/artifacts/evidence/implementation-0003-native-t62. Read acceptance.md, acceptance.json, validation.json, source-hashes.json, launch-observations.json and fresh-session.json. Inspected managed-cli-actual.png, stale-launch-rejected.png, event-expanded.png, motion-middle.png and c-escape-closed.png. Spec also inspected c2-alpha.png and initiative-shared-prerequisite.png.

Evidence supports Context/Tracker beside usable Files/Changes, explicit onboarding and file preview, canonical records/queues/events, C drawer controls and Escape, native motion, C2 and narrow fallback, Better Config, and per-repository selection. Real OMP session 01a1cc9b-058e-7575-9258-07e96fb9fed0 received the canonical Ask Matt request and returned NATIVE-LAUNCH-ONLY with zero tool calls. Deleted-record preparation was rejected without launch. Seventeen module hashes and managed layout match the reviewed source independently.

Evidence does not prove dependency nesting: the current tree shows flat initiative membership. Its pending-read repository check does not exercise pending launch preparation or same-repository stale preview failures. The new controlled checks reproduce those gaps.

Consumed authoritative events: implementation-0003.yaml, implementation-complete-0005.json, implementation-reconciled-0006.json and review-start-0007.json. Consumed draft: artifacts/snapshots/pr-draft-implementation-0003.md. All resolve within the base workflow store.

## Actual validation

After both axis reports returned, the reviewer ran these checks:

- **node --experimental-vm-modules /tmp/herdr-review-state-smoke.mjs:** S-001 reproduced: expanded alignment:nested retained; only root directory requested; nested entries absent.
- **node --experimental-vm-modules /tmp/herdr-review-races.mjs:** P-001 reproduced: base/alpha/beta all depth 1, children 0, reference null. P-002 reproduced: after selection/repository switch to /B, obsolete /A preparation invoked captured pane.split. P-003 reproduced: B body remains current while obsolete A error sets panel banner.
- **Independent SHA-256 comparison of retained native source bindings:** 17/17 current modules equal evidence and private-copy hashes; managed CLI layout hash matches.

The two smoke programs loaded the unchanged current source through Node VM modules. Synthetic native/API boundaries controlled response order and captured pane.split rather than opening a pane. They exercised the real class methods and tree function. S-001 and P-002 are no longer source-only inferences at aggregation. No physical/native UI reproduction of these failures was performed. Node emitted its expected experimental VM-module warning. No new permanent test was added. Temporary scripts are removed after capture.

The implementation receipt records 33 passing tests, 106 assertions, scoped TypeScript and native mod checks. These are consumed evidence, not checks rerun by this reviewer.

## Limits and ownership

Native evidence used private headless Xwayland/software rendering. Its fresh-chat action was harmless; no claim/start/review/merge/push action ran. It includes existing OMP extension/update notices and private shell mise-version warnings. Those do not explain the four source defects. No applicable ADR exists in the ADR index; its only decision concerns Pi Ink. CONTEXT.md is absent.

Reviewer terminal t66; pane p857cb0c4a64a3c66c2c48c797b1c74bb; session/run 4e907f5c-b10f-4d2e-9dbc-005f9cf3b54f. Both owned child terminals were acknowledged, stopped and removed. No user app settings, verifier app, source, tracker, or unrelated terminal was changed. Parent t60 owns integration, tracker state, publication and cleanup.

## Axis totals

Standards: one medium finding. Spec: three P2 findings. Both axes fail independently.

Timestamp: 2026-11-11T22:14:38.698Z.

