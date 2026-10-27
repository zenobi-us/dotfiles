---
type: Report
title: Initiative navigation terminal acceptance
---
# Runtime acceptance
Actual Pi v1.1.0 loaded the extension from the source worktree. No model or service request ran.
The records are deterministic fixture data. The normal loader, schema validation, directory watcher, renderer and input handlers ran unchanged.

## Terminal matrix
Each size used the dark theme and a greyscale theme fixture: 40x12, 80x24 and 120x40.
The verified captures cover root rows, child rows, secondary fields through paging, existing detail, mouse ancestors, Esc return, keyboard ancestors, zero-item Ungrouped and separate queues.
[Action ledger](runtime-actions-complete.json) records actual input operations. [Capture inventory](runtime-captures-complete.json) records the source extension, terminal dimensions and fixture labels.
Only files named `verified-*` are final settled acceptance evidence. Earlier `colour-*` and `dark-*` captures are exploratory; some preceded settled rendering. They are retained, not acceptance claims.

## Colour evidence
[Wide colour children](verified-dark-120x40-children.png) show separate type, ID, title and state fields. [Recorded RGB spans](verified-dark-120x40-children.spans.txt) preserve real theme roles and selection backgrounds.
[Narrow greyscale focus](verified-mono-40x12-focus.png) preserves semantic markers. [Greyscale secondary fields](verified-mono-40x12-child-secondary.png) show narrow-field paging. [Theme fixture](monochrome-theme.json) defines grey foreground and selection background without semantic hues.
Native termscope SVG output lost colour and aligned spacing. Final PNGs render recorded text and RGB spans at fixed terminal-cell positions through ImageMagick. Matching JSON and span captures are retained. No UI content was invented.

## Exceptional states
[Live selection](verified-mono-live-selected.png) retains item-2 after its title changes. [Removal](verified-mono-selected-removal.png) explains the fallback after that selected record disappears.
[Refresh failure](verified-mono-refresh-failed.png) keeps the last readable child. [Stale action gate](verified-mono-stale-action-gate.png) retains the error after Start input.
[Initial unreadable](verified-mono-initial-unreadable.png), [recovery](verified-mono-recovered.png), and [loading](verified-mono-loading.png) distinguish failure, retry and pending reads. The loading fixture delayed actual mq subprocesses by 0.3 seconds using a disposable PATH wrapper. It did not mock the loader.
[Empty initiative](colour-120x40-empty-initiative.txt) was inspected during exploratory navigation. Final zero-item Ungrouped is covered at every dimension, including [40x12](verified-mono-40x12-ungrouped.png).

## Preserved behavior
[Independent Files](verified-mono-independent-files.png) stays separate from Tracker. [Path insertion](verified-mono-files-path-insertion.png) shows the existing `shared://docs` editor insertion after y. The command remains unsent.
The automated suite covers fresh-session actions, receipt safety, project filtering, checkoutless recovery, watcher ownership and independent Files state.

## Automated validation
[Focused suite](focused-tests-final.txt): 128 pass, 0 fail, 1750 expectations across 11 files.
[Scoped TypeScript](scoped-typescript-final.txt): exit 0. [Compiler configuration](scoped-tsconfig.json) records the checked source boundary. [Verification dependency versions](verification-package.json) record the isolated installation.
Initial failed runs document missing dependency resolution and the migrated focus test. A disposable isolated installation supplied the same real packages; no source manifest or lockfile changed. The temporary dependency link, fixture records and fixture scripts were removed after verification.

## Review and merge
No independent formal review exists yet. No merge, rebase, push, tracker mutation, or helper-agent review ran.

