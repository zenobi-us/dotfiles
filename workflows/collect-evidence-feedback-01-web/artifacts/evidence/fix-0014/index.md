---
schema: collect-evidence/v1
kind: index
type: Evidence
title: Fix 0014 real browser proof
---
# Fix 0014 real browser proof

Source commit 3d1b282520a74db5409457f83ed0f766670b86cb; tree 0c68cbc0d31e344ea2071352e81ca33c13c31b9f.

Both real drivers blocked unapproved Space and passed the approved Space case. The owned HTTP server observed one approved submission per driver. Native screenshots were inspected. Both transferred sealed runs passed the public validator.

- [Surf sealed run](surf/index.md): 1984×1068 PNGs.
- [Playwright sealed run](playwright/index.md): 1280×720 PNGs.
- [Exact smoke commands and outputs](smoke-results.json).
- [Regression, final suite and compiler results](validation-results.json).
- [Reproducible smoke script](smoke.ts).
- [Scoped compiler configuration](tsconfig.json).

The final public suite passed 14 tests with 93 expectations. The missing-media check preserved native diagnostics before rejecting the run. Capture and assertion status remain separate. No fresh review ran. STD-002 remains unresolved and outside this fix scope. No remote Git operation or tool installation ran.
