---
schema: worktree-draft/v1
title: Native ID regression evidence fix-0020
type: Evidence
---

# Native ID regression evidence

Both real drivers passed approved-space, a-b, a.b and a_b. Captures ran outside the watched source tree through the installed CLI and temporary resolved stores. Sealed native runs were copied here unchanged and validated again.

- [Surf sealed run](surf/run.json)
- [Playwright sealed run](playwright/run.json)
- [Smoke observations](smoke.json)
- [Validation history](validation.json)
- [Final suite](final-suite.txt)
- [Earlier suite failure](suite.txt)
- [Compiler configuration](tsconfig.json)
- [Surf sessions before](surf-sessions-before.txt) and [after](surf-sessions-after.txt)
- [Playwright sessions before](playwright-sessions-before.txt) and [after](playwright-sessions-after.txt)

Native screenshot review confirmed Case approved-space and Submitted in both drivers. Public IDs remain unchanged. Native logs and third-party outputs remain under each run's native directory. Session lists matched before and after collection.

An earlier scoped suite attempt had one Playwright failure in the existing pass case. A targeted diagnostic copy then passed without source changes. The final unchanged suite passed 14/14. The original failure cause is unknown; it is not suppressed. The first post-fix regression used the wrong native-log path; corrected runs/ to native/runs/. TypeScript LSP was unavailable; the scoped compiler used existing base-checkout dependencies. No installation, remote Git operation, stash operation, merge, push, formal review or ticket completion occurred. No existing changelog was present, as recorded in the prior draft. STD-R3-001 remains advisory and untouched, including cleanupRow hooks.

