---
description: Fix result awaiting independent review
title: Scoped review repair
type: Report
---

# Scoped review repair

Ticket: tracker/tickets/pi-shared-context-ux-07-feedback.md.

## Problem and correction

SPEC-01: Progress aliases had broadened the initial recovery boundary. Restore the exact master accepted-state list. Keep new and to do in progress display only.

SPEC-02: Hide the inactive copy shortcut in actions. Retain Local Markdown list copy and hosted suppression.

## Frozen source

Branch: feat/pi-shared-context-ux-07-feedback.
Commit: 75e4ba2e7ff18479992382e8df84f53380615f42.
Tree: 0ed7813b64078f610c57f845520d1440f1ba2a7c.
Base and merge base: 188d65733aca442f860b18d323cf6db03bad1744.
Source worktree is clean.

## Changed files

- agent-core/extensions/pi-shared-context/explorer.ts: suppress inactive hint.
- developer/skills/git/worktree/scripts/recovery.ts: restore base authorization boundary.
- developer/skills/git/worktree/scripts/recovery.test.ts: allowed canonical states and blocked progress-only aliases.
- agent-core/docs/USAGE.md: distinguish display from authorization.

Paths above are relative to mise/conf.d/devtools-agent/bundles/.

## Validation

Scoped extension and worktree suite: 133 pass, 0 fail, 2063 assertions, 12 files. Affected-scope TypeScript check passed. Commit bundle-version hook passed. Temporary configuration and harnesses were removed.

Behavior smoke exercised recovery and GraphExplorer for Local Markdown and GitHub. Canonical initial states select start/begin; new and to do block. Actions omit copy, c leaves actions unchanged, and normal Local Markdown lists retain copy. Hosted lists suppress copy.

Fresh native Pi 1.4.0 at 160x50 showed progress todo for new/to do fixtures, no copy hint in actions, unchanged actions after c, and copy hint restored in the normal ticket list.

## Evidence and limits

Evidence: workflows/pi-shared-context-ux-07-feedback/artifacts/evidence/fix-reconcile-0017/. See validation-results.json, behavior-smoke.json, termscope-protocol.json, and captures 01 through 04. Native records are labeled in-memory fixtures. Text captures only; no PNG or native clipboard byte proof. Phase launch was not exercised. Known unrelated full-bundle wait.ts errors were not rerun. LSP initialization failed because workspace TypeScript was unavailable; scoped tsc passed.

## Review history and integration

Consumed events/review-reconcile-0015.json and events/review-reconcile-linked-0017.json, with artifacts/reviews/review-review-reconcile-0015.md. That review reported FAILURE for the prior source. Both finding IDs are repaired; no new verdict is claimed.

Result: events/fix-reconcile-0019.json. Parent owns fresh independent review, projections, integration and tracker completion. No merge, push, tracker mutation, resource removal, or prior artifact alteration occurred.

