---
title: Native TUI independent review
type: Review
verdict: FAILURE
---

# Independent native TUI review

## Verdict

FAILURE. Standards: two blocking findings. Spec: two blocking findings. STD-01 and SPEC-2 describe the same defect on different axes. Three distinct defects require changes.

## Scope

Ticket: tracker/tickets/collect-evidence-feedback-02-tui.md. Complete specification: tracker/initiatives/collect-evidence-feedback/index.md.

Source: feature/collect-evidence-feedback-02-tui. Base: master. Reviewed commit: 68acd4074c636933fdf5e8645a09d1acf6abdf67. Reviewed tree: 68589997ea8dafb4a336777829a0105806fa44d2.

Observed master: 1565b385c7ddd77411be09ffffd02f4e8c5bd4f4. Merge-base: dee00b4124b8f4b442b8774449018308a57e32b1. Diff: `git diff master...68acd4074c636933fdf5e8645a09d1acf6abdf67`. Timestamp: 2026-11-11T11:29:00.901Z.

Reviewed native driver, plan validation, shared pipeline/records/report changes, public regressions, documentation and retained implementation evidence. No web driver changed. Pi Ink ADR 0001 does not govern this feature; all findings use NO ADR. No source edits, fixes, commits, ticket writes or projection changes.

## Standards

Fresh independent axis: ef4d3926-1517-41a2-83ac-59c5e6b5c541, terminal t54. Two documented-standard violations. No separate code-smell finding. Parent reproduced both findings.

### STD-01 — P2 — NO ADR

**Location:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/tui-driver.ts:138

After doctor succeeded, a private grim shim failed collection capture. The run exited 1 and sealed an assertion-category error with assertionResult=failed and captureStatus=not-requested, although no image assertion ran. This violates separate capture/assertion outcomes (initiative story 18; evidence-schema Results).

**Required change:** Track the failed phase. Return captureFailed for native capture errors and preserve not-run assertions. Add a public workflow regression that lets doctor succeed, then fails grim during collection.

**Validation command:** `collect-evidence run "$NATIVE_WORKSPACE" --json; collect-evidence validate "$SEALED_RUN" --json`

### STD-02 — P2 — NO ADR

**Location:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/tui-driver.ts:211

An unmet native precondition blocks every case before runTerminal registers a diagnostics destination. Observed exit 3/BLOCKED; native/workflows contained only tui-transition.json. termscope JSONL, stderr and captured precondition frames were deleted during cleanup. This violates the evidence-schema requirement to preserve native bytes.

**Required change:** Register the staging diagnostics destination before precondition checks. Preserve native outputs when all cases are blocked. Add a public workflow regression with one unmet screen precondition and check retained native bytes plus released resources.

**Validation command:** `collect-evidence run "$UNMET_PRECONDITION_WORKSPACE" --json; collect-evidence validate "$SEALED_RUN" --json`

## Spec

Fresh independent axis: 1fed1ccd-10ac-452c-80d9-54b00128c3d1, terminal t53. Two specification violations. Parent reproduced both findings.

### SPEC-1 — P1 — NO ADR

**Location:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/tui-driver.ts:113

An unexpected confirmation retaining the approved heading passes the input guard. A bounded native fixture showed Ready screen plus Delete files? [y/N]. The approved RET was delivered (input log: \r); run exited 0/PARTIAL instead of stopping with exit 3. This violates initiative decision 38 and the ticket safety criterion.

**Required change:** Bind confirmation approval to the actual expected operation and reject unexpected confirmation prompts before sending input. Add a public native workflow that retains the expected heading, introduces an unapproved confirmation, and verifies exit 3 without the confirmation side effect.

**Validation command:** `RUN_NATIVE_EVIDENCE_TESTS=1 mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts`

### SPEC-2 — P2 — NO ADR

**Location:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/tui-driver.ts:138

After doctor succeeded, a private grim shim failed collection capture. The run exited 1 and sealed an assertion-category error with assertionResult=failed and captureStatus=not-requested, although no image assertion ran. This violates separate capture/assertion outcomes (initiative story 18; evidence-schema Results).

**Required change:** Preserve capture-stage failures as captureFailed=true and leave unexecuted assertions not-run. Keep genuine image-content assertion failures separate. Add a public workflow regression for a native capture failure after doctor succeeds.

**Validation command:** `RUN_NATIVE_EVIDENCE_TESTS=1 mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts`

## Acceptance coverage

| Requirement | Observed result |
|---|---|
| Common commands, routes, records, notes and reports | Public init/render/compile/run/validate/verdicts/report succeeded in a temporary repository store from /tmp. comment without --url correctly returned 2; no publication occurred. |
| Exact controlled/captured terminal | Both transition assets name session ce-tui-a921edd6-f2ac-4837-9683-d5ae817e8095, pane %0, PTY /dev/pts/19, private socket/runtime, wayland-0, Cage PID 2324509 and foot PID 2324510. |
| Native CPU playbook and documentation | foot/Cage/pixman/grim path implemented and exercised. Native reference and capability documentation updated. Both existing web-driver diffs were empty. |
| Doctor tools and permissions | Prepared PATH: exit 0, real private native capture. Normal PATH: exit 3, missing foot/grim/tesseract named. Graphics override: exit 3 with useful reason. No tools installed. |
| Visible transition | Ready screen changed through a 1.5-second Loading screen to Details screen. Both actual PNGs inspected. Matching buffer alone cannot satisfy native OCR plus stable image hashes. |
| Colour, spacing, dimensions and hash | Both 1280×720 originals show the correct heading, Selected item on the next 20 px line, purple bar and dark background. RGB probes [201,166,255] and [36,36,36], line tops 12/32 ±2 passed. SHA-256 matched each original. |
| Credential and unapproved step safety | Credential case and missing-approved-step case returned 3/BLOCKED. Combined fixture log contained only n and c; no credential Enter. Unexpected confirmation bypass remains SPEC-1. |
| Capture outcomes | Native capture failure becomes an assertion failure incorrectly: STD-01/SPEC-2. |
| Borrowed sessions and cleanup | A separate private borrowed tmux server remained live after collection. Collector runtime was absent after transition. SIGINT during native wait returned 1, removed its runtime and left no sealed interrupted run. |
| Limits and side effects | Case records warn about native video, OCR limits, application side effects and owned cleanup. All-precondition-blocked native diagnostics are lost: STD-02. |

## Validation

Native commands used PATH prefix /home/zenobius/.local/share/collect-evidence/native-tools/fedora-45-x86_64/bin. The executable was the frozen source scripts/collect-evidence.ts, not an unrelated installed checkout. Workspaces, fixture copies and resolved stores remained outside source.

1. `RUN_NATIVE_EVIDENCE_TESTS=1 mise exec -- bun test <source>/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts`: 1 pass, 0 fail, 11 assertions, from /tmp. This was the one final scoped test run.
2. Public native transition workflow: init/render/compile/run/validate/verdicts/report returned 0. Credential/unapproved workflows returned 3; validate/verdicts returned 0 against their sealed BLOCKED records.
3. Native hashes: ready 2493a3a4e51d475e6f0bac03014d1c51e4e182d9526a78c6de677aa4cdbf5a6f; details b6c7cd3ce3061d69feb27c979bf960ed49c44f411734afb9219626e3aeb8ca5a. Both compared with actual bytes.
4. Unexpected-confirmation fixture: harmless prompt retained Ready screen, introduced Delete files? [y/N], received approved RET. Input log contained '\r'. No deletion or external action existed in this fixture. Sealed step reported Input completed on the owned terminal.
5. Capture-failure fixture: doctor captured successfully, then local grim shim returned 1 during collection. Sealed case stored category assertion and first expect assertionResult failed; no asset existed.
6. Unmet precondition: compile 0, run 3/BLOCKED. native/workflows contained only tui-transition.json, not native logs or frames.
7. SIGINT during a real wait: exit 1, runtime removed, destination absent. Incomplete diagnostics retained outside source. Borrowed tmux has-session returned 0 before its owner removed that throwaway server.

Temporary harness corrections: initial smoke stopped on comment's required --url; collection had already passed. Safety work resumed without repeating transition. Finding harness used says instead of precondition.desc; compile returned 2. The corrected precondition then ran. These harness errors are not product failures. No rerun of known unrelated Chrome/Surf failures.

## Provenance and limits

Consumed review-0007, implementation-0006, implementation-0005, PR draft and validation snapshots; retained transition-02, credential-01 and unapproved-01 evidence. Fresh native scratch: /tmp/review-0008-9B5ODu. This scratch is diagnostic only, not an authoritative output or independently resolved workflow evidence run. Existing evidence stayed unchanged.

Axis artifacts used assigned result-delivery transport, passed hash verification and acknowledgement, and were not copied as second review bodies. Both axis terminals were closed after delivery. Reviewer terminal t52 remains open for the parent.

## Next step

Fix the three current defects, then run a new independent review on the new commit. This verdict applies only to the frozen commit and tree. Parent owns workflow completion, ticket comments and terminal close.

Standards: 2 findings; worst P2. Spec: 2 findings; worst P1.

