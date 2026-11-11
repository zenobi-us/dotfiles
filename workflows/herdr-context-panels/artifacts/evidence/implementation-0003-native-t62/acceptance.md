---
title: Herdr Context and Tracker native acceptance — implementation-0003
type: Report
---

# Native acceptance verification

Frozen source: `fa5a5e221fa8a31c3cae3be355f426aabf9e5e1c`, tree `67b6bdd4a5722a71d6c9c3a2306628b8d412d90c`. No source changes. This is present-day implementation verification, not historical review.

## Acceptance results

### 1. Context and Tracker controls beside Files and Changes

Passed. Loaded the exact managed CLI layout and cli-* mods in the private home. Opened Files and Changes with their native controls; both rendered actual fixture data.

Evidence: [managed-cli-actual.png](media/managed-cli-actual.png), [managed-files.png](media/managed-files.png), [managed-changes.png](media/managed-changes.png).

### 2. Explicit context onboarding and resolved file collections

Passed. A fresh Git repository with an origin showed explicit storage/preset/Create context controls. Clicking Create context created routes and context files only in fixture-A. Alignment, Tickets, Initiatives, Sources appeared. Opened the real Sources Markdown preview.

Evidence: [onboarding-settled.png](media/onboarding-settled.png), [setup-result.png](media/setup-result.png), [context-file-preview.png](media/context-file-preview.png).

### 3. Canonical initiatives, dependency trees/shared prerequisites, queues, record details and workflow events

Passed. Canonical fixture has an initiative and three tickets, with base shared by alpha and beta. Membership tree, directed shared-prerequisite graph, prerequisite navigation, Ready(base), Blocked(alpha,beta), Review(empty), record details, and an explicitly invalid event with canonical validation error/payload all rendered natively. Invalid event is test input, not a claimed workflow execution.

Evidence: [c2-alpha.png](media/c2-alpha.png), [initiative-shared-prerequisite.png](media/initiative-shared-prerequisite.png), [dependency-lineage.png](media/dependency-lineage.png), [prerequisite-opened.png](media/prerequisite-opened.png), [queue-ready.png](media/queue-ready.png), [queue-blocked.png](media/queue-blocked.png), [queue-review.png](media/queue-review.png), [activity-events.png](media/activity-events.png), [event-expanded.png](media/event-expanded.png).

### 4. C stacked drawer with expand/collapse/close, keyboard dismissal and native motion

Passed. C rendered half-height, Expand covered the tree, Escape collapsed then closed the drawer. Pointer Close reopened through a new selection. Successive real frames show native top interpolation during expansion; motion is not simulated by a browser.

Evidence: [c-drawer.png](media/c-drawer.png), [c-expanded.png](media/c-expanded.png), [c-escape-collapsed.png](media/c-escape-collapsed.png), [c-escape-closed.png](media/c-escape-closed.png), [motion-start.png](media/motion-start.png), [motion-middle.png](media/motion-middle.png), [motion-end.png](media/motion-end.png).

### 5. C2 uses the same compact tree beside record details

Passed. Better Config selected C2. Native tree and details appeared in resizable columns at 800px. At 500px the same selection used the drawer fallback. Exact managed CLI also rendered C2.

Evidence: [c2-alpha.png](media/c2-alpha.png), [c2-narrow-fallback.png](media/c2-narrow-fallback.png), [managed-cli-actual.png](media/managed-cli-actual.png).

### 6. C/C2 preference exposed through mod.schema.json for Better Config

Passed. Native Better Config discovered Tracker layout and Drawer motion. C2 saved settings.layout=C2; C restored the default. Motion off saved settings.motion=false, then motion on was restored and real animated frames captured. Private mod reload/layout round-trip preserved selection.

Evidence: [settings-motion-disabled.png](media/settings-motion-disabled.png), [c2-alpha.png](media/c2-alpha.png), [c-drawer.png](media/c-drawer.png), [motion-start.png](media/motion-start.png), [motion-end.png](media/motion-end.png).

### 7. Preserve selection per repository and discard stale responses

Passed. Selected alpha in A and beta in B. Returning to A restored alpha, B restored beta with the B-only alpha title sentinel. Switched away while the real source repository tracker read was pending; B stayed correct after other checks. Inspected revision/detailRevision guards for context, snapshot, detail, folder and preview responses.

Evidence: [repo-b-selected.png](media/repo-b-selected.png), [repo-a-restored.png](media/repo-a-restored.png), [response-pending-root.png](media/response-pending-root.png), [response-current-b.png](media/response-current-b.png), [response-b-stable.png](media/response-b-stable.png).

### 8. Setup/fresh-chat actions explicit; revalidate inputs before launch

Passed. Setup required Create context. Ask Matt required an explicit Open new pane click. Removed selected alpha after opening the menu: launch preparation rejected ENOENT and created no terminal. Restored alpha: native control launched real OMP t3 in fixture-A with canonical selector/prompt and a unique session directory, without --resume. Session header has no parent session; only user and assistant messages, zero tool calls; assistant replied NATIVE-LAUNCH-ONLY. All three tickets remained unclaimed. OMP process was stopped and removed.

Evidence: [action-menu.png](media/action-menu.png), [stale-launch-rejected.png](media/stale-launch-rejected.png), [fresh-chat-real-output.png](media/fresh-chat-real-output.png).

### 9. Exercise native panels and setting changes in Herdr-app

Passed. All captures are real herdr-app shot output from a private app home, own HC_SESSION, headless cage/Xwayland :96, and software rendering. 17 runtime JavaScript copies match source hashes; managed layout bytes match source. Private status errors empty. User live layout remained cli with errors empty. Stopped only owned app/display/core resources.

Evidence: [managed-cli-actual.png](media/managed-cli-actual.png), [settings-motion-disabled.png](media/settings-motion-disabled.png).

## Automated checks

`bun test tests <canonical preparation.test.ts>` passed: 33 tests, 106 assertions, zero failures. Scoped TypeScript check passed. Both native feature mod checks passed. See [validation output](validation.json), [source bindings](source-hashes.json), [actual chat session](fresh-session.json), [launch observations](launch-observations.json), [native/live status](app-status.json), and [structured acceptance results](acceptance.json).

## Limits

- Native captures use headless Xwayland/software rendering, not the physical user display.
- Fresh-chat check used a harmless Ask Matt request; no Start/claim/implementation/review/merge/push workflow action was launched.
- Actual OMP reported an existing ~/.omp/agent/hooks/pre extension-load warning and an update notice, but accepted the exact native argv/prompt and returned the requested harmless response.
- Private shell startup displayed mise shim-version warnings because its isolated XDG config has no user tool versions. These are terminal output, not mod errors.
- Rapid repository switching exercised an old pending tracker read and inspected response-generation guards; it did not force every possible response-completion ordering.
- No historical review is asserted. Independent review and tracker completion belong to the parent.

