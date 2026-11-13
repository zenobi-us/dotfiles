---
title: "Review: saved feedback edits"
type: Concept
---

# Review: saved feedback edits

Verdict: **FAILURE**. The Spec axis has one blocking P2 recovery defect. The Standards axis has one non-blocking P3 documentation defect.

## Identity

Canonical ticket: `tracker/tickets/collect-evidence-feedback-06-edits.md`. Initiative: `tracker/initiatives/collect-evidence-feedback/index.md`.

Source branch: `feature/collect-evidence-feedback-06-edits`. Base branch: `master`.

Frozen source commit: `250dd929e45d26787c169b8567fc755a945d3838`. Frozen tree: `8ee708c34ce98c304203c79edd6c5efd695d00fc`.

Exact review_base_commit: `253a5fc0779c2a11497103c32e09c474c83b1621`. Review timestamp: 2026-11-13T12:09:04.074Z.

Reviewer: herdr-app:t10d, pane pe129d34250a71aa483f28ac5a8ec4bec. Standards ran independently in t10h. Spec ran independently in t10g.

Diff: `git diff 253a5fc0779c2a11497103c32e09c474c83b1621...250dd929e45d26787c169b8567fc755a945d3838`. Source commits: 93d993e4a5372f1cc17433dba396f60c536e50b6 and 250dd929e45d26787c169b8567fc755a945d3838.

The three-dot diff contains 12 files, 256 insertions and 50 deletions. Exact base-to-source comparison also shows base-only workflow publications. Those are not product deletions or requested fixes. Source inspection reported the frozen commit/tree, one source candidate and a clean worktree. Base metadata advancement does not change this review target.

## Standards

**STANDARDS-001 — P3, non-blocking, NO ADR.**

File: `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md:29`.

The contract still says, “Editing and deletion are not supported in this slice.” Its route table and new mutation paragraph document both operations. This is a documented contract inconsistency, not a heuristic code smell.

Required change: remove the obsolete restriction and keep one supported-operation definition.

Validation command:

```sh
mise exec -- mq --allow-http-import -I markdown -F grep 'import "github.com/harehare/okf.mq" | .' mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md
```

Blocking assessment: advisory only. No additional documented-standard violation or actionable heuristic smell was found. Repository standards override the smell baseline. Tooling-enforced checks were excluded. No indexed ADR applies.

## Spec

**SPEC-001 — P2, blocking, NO ADR.**

File: `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx:304`. Related state: lines 218–232 and 295.

A concurrent deletion traps an unsaved edit. The browser retained the draft and displayed saved revision 9 as Deleted after a real second-client DELETE. The textarea became read-only. The conflict panel offered no revision adoption or Undo action, and the local undo list had no tombstone. Recovery in this page requires cancelling the draft and reloading, or intervention from another client. Static inspection shows Retry uses the same stale revision and cannot restore the tombstone.

The ticket requires “Preserve the client draft after a conflict” and reversible deletion with undo. Initiative decisions 43, 51 and 53 require undo, stable identity and conflict-safe drafts. This failure combines those required operations. Persistent drafts and video remain outside this ticket.

Required change: provide an explicit, revision-checked restoration action for a deleted-version conflict. Preserve the draft and its geometry. After acknowledged restoration, update the starting revision and allow an explicit retry. Reconcile subsequent conflicts without overwriting a newer note. Add a public-browser regression.

Why blocking: This breaks conflict-safe edit and undo together. Keeping draft text in an unusable editor does not provide the required edit/delete/undo workflow. Add the browser scenario described in this review to the public suite.

### Reproduction and validation

1. Copy the existing sealed feedback fixture into a private temporary store. Start the frozen CLI with `serve <temporary-session> --port <free-port> --json`.
2. In client A, select a saved note, select Edit note, and enter a different comment. Keep the draft open.
3. In client B, send an authorized DELETE for the same ID with its current If-Match.
4. In client A, select Save note. Inspect the Deleted conflict panel, retained textarea and available actions.
5. After the fix, restore explicitly from that conflict without discarding the draft. Save it. Verify the same ID, source binding, priority and geometry through GET annotations and export.

Run the extended public regression with:

```sh
env PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test
```

## Validation observed

| Check | Observer | Result |
|---|---|---|
| Frozen diff and exact contract comparison | Reviewer | 12 product/doc/bundle files; base-only workflow records separated |
| Installed CLI serve from temporary copied session, port 19071 | Reviewer | Real bundled page and HTTP service started |
| Saved-note edit versus authorized second-client DELETE | Reviewer | DELETE 200, original note revision 8→9; browser showed Deleted conflict with retained read-only draft and no Undo/adoption action |
| Screenshot of actual conflict surface | Reviewer | Inspected real pixels; temporary screenshot, not a published evidence run |
| Missing/stale If-Match and unchanged records | Reviewer | 428 and 412; rejected requests did not change fetched records |
| Original tombstone undo and export | Reviewer | PATCH 200, revision 9→10; ID, source, comment, priority, geometry, pixel geometry and createdAt unchanged; tombstone cleared; export matched |
| Existing public workflow regression | Parent t107 | Reported exit 0: 1 pass, 0 fail, 116 expect() calls, 51.76s on frozen source |
| Shutdown | Reviewer | Tab released, service exited 0, writer lock absent, port rebound; t10h and t10g closed with confirmed process shutdown |

The parent supplied the exact regression command above. The reviewer did not rerun the full suite, build, lint or typecheck. Existing suite and implementation receipts are evidence, not proof of this untested interaction. Reload/restart and broader safety coverage come from the parent-supplied suite and implementation records, not fresh reviewer execution.

### Observation limits

After the initial conflict capture, the browser draft changed unexpectedly and the temporary store acquired additional notes. The cause is unknown. The parent reported no interaction with this tab or port. Later retry UI observations are excluded from the finding. The initial DELETE response, retained-draft inspection and screenshot support the finding. Static state transitions explain why the missing recovery action blocks it. The reviewer separately restored the original tombstone through HTTP and checked its export.

The first two screenshot helpers timed out. A raw browser screenshot with font waiting disabled succeeded and was visually inspected. No separate evidence run was created.

## Changed scope

- **Source:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/SKILL.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/how-to-browse-evidence.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/annotations.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/server.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/types.ts`

## Affected contracts

- **Contract:** collect-feedback/v1 annotation records and export
- **Contract:** PATCH/DELETE If-Match and ETag revision contract
- **Contract:** Bun.serve write authorization and immutable-source checks
- **Contract:** single-file bundled React viewer and saved-note editing
- **Contract:** shared developer bundle version metadata

## Integration checks

The exact phase-start integration_checks value is retained below. It is a required integration check, not a reviewer claim that a combined candidate passed.

```json
[
  {
    "argv": [
      "env",
      "PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome",
      "mise",
      "exec",
      "--",
      "bun",
      "test",
      "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test"
    ]
  }
]
```

Reassess shared developer bundle version metadata against the integration base. This source review does not approve product changes introduced during integration. Unrelated stream inventory remains incomplete but does not block this isolated read-only review.

## Outcome

Standards: 1 finding; worst P3, non-blocking. Spec: 1 finding; worst P2, blocking. Verdict: FAILURE for the exact frozen source commit and tree. No source, test, configuration, ticket or projection was modified. Parent owns publication, tracker comments and phase completion.

