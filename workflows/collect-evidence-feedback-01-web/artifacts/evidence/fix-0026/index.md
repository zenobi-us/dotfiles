---
kind: evidence-index
schema: collect-evidence/v1
title: Web fix fix-0026 evidence
type: Evidence
---

# Web fix fix-0026 evidence

Both selected fixes passed focused public workflows with both real drivers. The scoped suite failed; this evidence does not claim a green suite.

## Source and provenance

Source commit 8c4015418f6b3fee244708d9937e45bb358fc45d; tree 28784b1a67c200888c53a947b3b056f2569cccbc. Captures ran outside watched trees, from /tmp, before source commits. Native bytes and third-party output are unchanged. [Smoke command records](smoke-commands.json). [Actual checks](validation.json). [Throwaway smoke helper](smoke-helper.ts).

## Owned smoke

Both drivers compiled and ran the exact IDs a and a.map together. The rendered and sealed plans retained shot: "". Navigation produced no asset; explicit step 3 produced the real screenshot. Public case and step IDs remained unchanged. Before/after session lists matched; the owned page server stopped.

[Surf sealed run](surf/run.json). [Playwright sealed run](playwright/run.json). [Original smoke results](smoke.json).

All four native PNGs were inspected. Surf images show Identity a and Identity a.map at 1984×1068. Playwright images show the same identities at 1280×720.

## Checks

| Check | Result |
|---|---|
| test-first-empty-slug | failed |
| focused-public-smoke | failed |
| focused-public-smoke-corrected-fixture | passed |
| final-scoped-suite | failed |
| corrected-public-slug-regression | passed |
| scoped-typescript | passed |
| finalized-surf-validate | passed |
| finalized-playwright-validate | passed |
| new smoke fixture diagnosis | corrected-fixture |
| scoped suite diagnosis | failed |
| visual inspection | passed |
| source commit hooks | passed |
| TypeScript LSP | unavailable |

## Retained failure diagnostics

The first throwaway smoke used an invalid capture step and omitted says. [Native failed fixture output](invalid-smoke-fixture-native/runs/case-a.log) and [commands](invalid-smoke-fixture-commands.json) remain intact. Correcting that fixture made the focused smoke pass; no extra production fix was added.

The only scoped suite returned 1: 15 passed, 2 failed, 73 expectations. The compile fixture omitted required plan metadata; the corrected focused regression passed 3/3. [Surf failed case](failed-suite-surf/cases/blocked/case.json) records blocked.1: navigate failed: Error: Request timed out. [Native output](failed-suite-surf/native/runs/case-blocked.log) shows the failure before the Surf workflow started. The timeout arose during pre-workflow about:blank navigation; its underlying cause is unknown. Credential fill did not execute. No second scoped suite ran.

## Historical limits

The earlier Playwright pass-case suite failure remains unexplained. The separate review-0023 approved-space failure also remains unexplained: expected Submitted once, got Ready. [Historical native Playwright output](historical-review-0023-playwright/native/runs/case-approved-space.log) is copied without relabelling its capture times as fresh. [Original review](../../reviews/review-review-0023.md). [Earlier failed suite record](../fix-0020/validation.json).

The single both-driver scoped suite returned 1: 15 passed and 2 failed. The new compile fixture metadata was corrected and its targeted regression passed 3/3; the full suite was not repeated. Surf blocked.1 timed out during pre-workflow about:blank navigation. Its actual native log and sealed failed case are retained. The underlying timeout cause remains unknown.

The earlier fix-0020 Playwright pass-case suite failure and the separate review-0023 approved-space assertion failure (expected Submitted once, got Ready) remain unexplained. Neither was repeated to confirm or erase it. Historical review-0023 failed native output is retained and labelled historical.

The initial throwaway smoke fixture omitted required says and capture locator/as. Its failed native output and commands are retained. Corrected fixture smoke passed both real drivers without another production change.

No current reviewer verdict covers the new source. STD-R3-001 and cleanupRow hooks remain unchanged. No new video proof, tool installation, remote Git operation, stash operation, base-store commit, formal review, merge, push or ticket completion. Existing records reported no changelog; the existing Surf driver reference was updated.

