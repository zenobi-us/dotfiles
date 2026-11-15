---
title: SPEC-03 fix evidence
type: Concept
---

# SPEC-03 fix evidence

Production SharedContext and QueryClient ran with the checked-in real helper in a scratch repository. The smoke replaced native drawing and resource APIs only.

- **Missing record:** removing selected A after a valid tree produced the real helper error. Old description/activity remained stale; the next refresh retired them.
- **Transient error:** injected transport EIO retained stale description/activity. Canonical successful recovery cleared stale state.
- **Races:** change during replacement, newer selection and target switch preserved current state.
- **Checks:** 45 focused tests, 60 Node full-suite tests, 17 Bun tests, and native mod check passed.

[Outcomes](files/smoke.json). [Calls](files/calls.json). [Replay](files/smoke.mjs). [Focused](files/focused.log). [Full suite](files/full-suite.log). [Native check](files/native-check.log). [Limits](files/limits.json). [Shutdown](files/shutdown.json).

The first smoke adapter attempt did not parse the helper nonzero-exit JSON error. The adapter was corrected; the complete smoke then passed. No native Tracker visual proof is claimed. No app or Core service was started.

