---
source_commit: e1a8cccee968e5c63ccdfec9bd48e7aff5ff41ce
source_tree: 6135e1c1d522af9f050a18eab21bb06961a3d272
ticket_ref: tracker/tickets/herdr-query-cache-01-selective-refresh.md
title: SPEC-02 verification evidence
type: Concept
---

# SPEC-02 verification

Reader: parent orchestrator and independent reviewer. These are actual command results, not a sealed collect-evidence capture run.

- **Runtime result:** [smoke.json](files/smoke.json), [helper requests and results](files/calls.json), [scratch smoke harness](files/smoke.mjs).
- **Focused tests:** [focused.log](files/focused.log), 22 passed.
- **Full suite:** [full-suite.log](files/full-suite.log), 54 Node and 17 Bun passed.
- **Native contract:** [native-check.log](files/native-check.log), passed.
- **Cleanup:** [shutdown.json](files/shutdown.json), private app and Core stopped.

## Limits

The smoke substitutes native drawing/resource adapters only. It runs production data.js and main.js with the real generated helper and a scratch repository. Workflow activity contains a real scratch receipt; its incomplete historical envelope deliberately remains visible as invalid activity.

A private native home and Core session were launched. Layout switches, a scratch space and overlay.close returned success, but the captured frame stayed on the welcome screen. No Tracker visual result is claimed. No live user app configuration or installed mod links changed. Formal independent review belongs to the parent.

