---
title: Projects fix-0014 immutable draft
type: Concept
---

# Projects implementation and repair draft

## Current state

FIXED at 34e28395c83826cdf46e1f09b8ad7761df2be219. Both review-0011 blockers are resolved by this fix. The latest reviewer verdict remains FAILURE for f4dffcaebf159cb857eb6008fad80dfb03e214fc. This source requires a fresh independent review. No review approval is claimed. Parent phase completion remains pending.

[Canonical ticket](../../../../tracker/tickets/pi-shared-context-ux-01-projects.md). No tracker changes were made.

## Changes

- **SPEC-003, NO ADR:** Commands select a verified surviving directory from the selected project. Shared B continues to load records after the original repository-only A disappears. Pi's session directory stays unchanged.
- **SPEC-001, NO ADR:** Existing stores can recover identity with recover-identity SLUG --checkout PATH or --remote URL. The checkout origin is verified against the selected store. Explicit remotes must identify that same store. Recovery preserves existing metadata and routes; no initialization, migration, scan or clone runs. Missing hosted identity explains the recovery procedure.
- **SPEC-002 preserved:** Current-entry fallback, cached capability refresh, disabled actions and watcher behavior retain passing coverage.

Unknown remotes cannot be reconstructed from directory slugs. Without an authoritative remote or verified checkout, hosted identity remains unavailable.

## Source identity

| Field | Value |
| --- | --- |
| Branch | feature/pi-shared-context-ux-01-projects |
| Base | master |
| Execution fix commit | c986abce69cbd347b5a7160d5c88cb3a191c482d |
| Recovery fix commit | 34e28395c83826cdf46e1f09b8ad7761df2be219 |
| Source tree | 47c38e3a6260f875f97fcba05e7f83c0be62b4ec |
| Fixer | omp pi-context-projects-fix-0002 |
| Pane | w7A:p6 |
| Session | 01a17b92-6534-779c-8bf4-72ed068389bc |

## Changed files

- **Source:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/index.ts`.
- **Source:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/projects.test.ts`.
- **Source:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts`.
- **Source:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts`.
- **Source:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/README.md`.

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Focused suites | 123 passed, 0 failed; 2070 assertions | [Final log](../../artifacts/evidence/fix-0014/focused-tests-final.txt) |
| Scoped TypeScript | Exit 0 | [Compiler log](../../artifacts/evidence/fix-0014/scoped-typecheck.txt) |
| Recovery CLI | Explicit remote saved canonical identity | [Runtime output](../../artifacts/evidence/fix-0014/cli-runtime.txt) |
| Actual Pi v1.1.0 | B live tracker and Files survived A removal | [Terminal evidence](../../artifacts/evidence/fix-0014/terminal-acceptance.md) |

The complete modal regressions cover verified-checkout recovery and explicit-remote recovery, checkout removal, canonical GitHub targets, and rejection of a mismatched remote. gh responses are deterministic fixtures, not live service evidence. Pi captures cover 120x40, 80x24 and 40x12 with NO_COLOR=1. No model request ran. No new colour audit is claimed.

[Exact commands and harness corrections](../../artifacts/evidence/fix-0014/validation.json). LSP could not locate TypeScript; scoped tsc passed. Known unrelated broad compiler failures were not rerun. Existing narrow clipping and host shortcut conflicts remain outside scope.

## Historical records

[Implementation](../../events/implementation-0002.json), [prior fix](../../events/fix-0008.json), [prior snapshot](../../artifacts/snapshots/pr-draft-fix-0008.md), and [second review](../../artifacts/reviews/review-review-0011.md) remain immutable. Earlier fix claims are historical; review-0011 found the remaining legacy identity gap and execution-directory defect. [Fix start](../../events/fix-start-0013.json) and [this fix result](../../events/fix-0014.json) record this attempt.

## Delivery

Source commits are complete and the source worktree is clean. Canonical workflow records are uncommitted for the parent. No merge, rebase, push, formal review or tracker change ran. The parent owns pane closure and phase completion.

