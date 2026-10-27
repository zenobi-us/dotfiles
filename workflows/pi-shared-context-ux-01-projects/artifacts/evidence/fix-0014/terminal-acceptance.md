---
title: Projects fix-0014 runtime evidence
type: Concept
---

# Runtime evidence

## Actual Pi

Opened the source extension in Pi v1.1.0 with isolated temporary storage. Started in repository-only A. Opened Projects with Esc and selected shared B. Removed A, then created a new ticket in B. The modal displayed **B live after A removal** and **Surviving B ticket**. Files displayed B's notes.txt and shared root. The session footer still named A.

Captured 120x40, 80x24 and 40x12. NO_COLOR=1; no new colour audit. Small Files views truncate labels and hints as before. The known host shortcut conflict remained. No model request ran. Pi and termscope exited 0. A subsequent close request timed out after child_exit; this was a harness ordering error.

[Terminal protocol](pi-runtime.json) contains the observed screens and exit event.

## Explicit identity recovery

The real CLI recovered a missing identity file from an explicit remote, without initialization or migration. [CLI output](cli-runtime.txt). Complete-modal regression tests independently cover verified-checkout and explicit-remote recovery, then remove the checkout and load the intended GitHub issue through deterministic gh fixture responses. A mismatched remote is rejected without creating metadata. No live GitHub request is claimed.

## Verification

[Final suites](focused-tests-final.txt): 123 passed, 0 failed, 2070 assertions. [Scoped TypeScript](scoped-typecheck.txt): exit 0. [Commands and earlier harness failures](validation.json).

Temporary smoke directories were removed. No ticket, route configuration, session instructions or canonical workflow history was changed by the smoke.

