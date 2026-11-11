---
kind: review
schema: worktree-artifact/v1
title: Independent native TUI review
type: Review
---

# Independent native TUI review

## Verdict

SUCCESS. No new or blocking findings. The two prior Low Standards findings remain nonblocking, by reference.

## Scope

Ticket: tracker/tickets/collect-evidence-feedback-02-tui.md. Complete specification: tracker/initiatives/collect-evidence-feedback/index.md. Read both authoritative records, context map, domain rules, ADR index and ADR 0001. CONTEXT.md is absent. ADR 0001 covers Pi Ink, not this slice.

Source: feature/collect-evidence-feedback-02-tui. Base: master. Frozen commit: de8615f5eb03069289e7d594872e5dc3dff5c325. Frozen tree: 503685216d7702a7da97712d1799cde2a77088b3. Compared git diff master...HEAD with master at fe759f72c0fe01e1a037ec1a7d5f03b710725141. Reviewed full implementation, not only conflict resolutions.

Consumed review-0030, finish-0029 approval, fix-0023/fix-0024 implementation provenance, pr-draft-fix-0023, prior SUCCESS review-0026/review-0027 and fresh finish-0030-smoke evidence. Parent owns tracker, projections, commits and finish. No source edits. Timestamp: 2026-11-11T22:22:26.317Z.

## Standards

Standards: no new findings; no blocking finding. Reviewed the complete committed master...HEAD slice, not only the merge. Verified HEAD, tree and master against the assigned identities. Read CONTEXT-MAP.md, domain rules, ADR index and ADR 0001. CONTEXT.md is absent. ADR 0001 concerns Pi Ink and does not govern this driver. Read mise/conf.d/devtools-agent/AGENTS.md, DESIGN.md, the ticket, initiative, native procedure, source comments and changed hunks. The implementation keeps the existing Plan/Driver and common record boundaries. Native plan checks share one validator between loading and sealed-record inspection. No additional documented-standard violation or actionable baseline smell was identified. Tooling-enforced issues were excluded. Retain STD-01 and STD-02 from workflows/collect-evidence-feedback-02-tui/artifacts/reviews/review-review-0026.md by reference: the test-only shell grim shim and duplicated native test-store setup remain Low and nonblocking. They are not new findings and are not counted again. This read-only review ran no build, lint, tests or native collection. Parent-reported suite and smoke results were not independently rerun. No source or workflow record was changed.

Prior STD-01 and STD-02 remain recorded in [review-0026](review-review-0026.md). They are not new findings or new fix scope. Standards: zero new, two retained Low nonblocking; worst Low.

## Spec

No actionable specification mismatch found. Reviewed the full master...HEAD slice and commit history, not only the merge. Read the complete ticket and initiative, context map, domain rules, ADR index, native playbook and common evidence contract. CONTEXT.md is absent. The indexed Pi Ink ADR does not govern this slice.

The implementation retains the public CLI, typed Plan/Driver boundary, shared-context routing, sealed records, notes and reports. Doctor checks required binaries, exclusive publication support, actual private display launch, PNG capture and OCR; missing prerequisites map to exit 3. Both existing web driver implementations remain unchanged.

The private CPU-rendered foot/Cage/wlroots/grim path binds termscope and native capture to the same tmux pane and PTY. Asset records include terminal/display identities, dimensions and source-byte hashes. Visible synchronization requires expected buffer and OCR content plus consecutive identical native frames. Image assertions check dimensions, RGB probes and distinct text-line positions. The public native regression includes a delayed transition.

Exact command/directory approval and approved input-step IDs gate input. Current snapshot and native OCR checks reject credentials unconditionally, including approved input paths. Unexpected confirmations stop read-only checks and inputs; approved confirmations must name the actual prompt. Cleanup targets only private owned resources before sealing. Native video, OCR limits and application-side-effect inspection remain explicit. No unrelated feature expansion identified.

Validation: source and public-workflow regression review only. No build, lint, tests or fresh native execution performed, as instructed. Parent-supplied evidence reports 28 native passes/362 assertions, 99 workflow passes/892 assertions and 13 public smoke scenarios; these are not fresh child observations. No new visual or platform verification claimed. Prior accepted Low test-standards findings are not duplicated. Spec findings: zero.

Spec: zero findings; worst none.

## Independent validation

- **Public consumers:** Ran installed collect-evidence.ts validate and verdicts on retained transition and credential-0-fill. All four commands exited 0. Results: transition PASS; credential-fill BLOCKED.
- **Original images:** Opened retained Ready and Details PNGs. Distinct headings, purple bar and Selected item on the next line are visible. Details remains 1280×720 with RGB(201,166,255) at (10,55), checked through magick. Dotted tmux padding remains visible, not reconstructed or cropped.
- **Source hashes:** Recomputed Ready SHA256 2493a3a4e51d475e6f0bac03014d1c51e4e182d9526a78c6de677aa4cdbf5a6f and Details b6c7cd3ce3061d69feb27c979bf960ed49c44f411734afb9219626e3aeb8ca5a. Both match retained records. Shared session/socket/pane/PTY/display identities match.
- **Retained scenarios:** Inspected all 13 results: transition PASS with only n received; twelve API-token/API-key/PIN/OTP expect/fill/Enter cases BLOCKED with no input. All 13 runtime paths and recorded owned fixture/server PIDs are absent now. This is read-only retained evidence verification, not a new native run.
- **Parent suites:** Parent reported native28 pass/0 fail/362 assertions/63.44s and workflow-verdict99 pass/0 fail/892 assertions. Full suites were not rerun, as instructed.
- **Independent sessions:** Standards run1db0c874-c49c-4f1d-9b1f-7b364733c3af terminal t6f; Spec run51802b75-57ed-423c-a055-b4d56eceeac6 terminal t6d. Both fresh depth2 sessions used the source workspace. Verified typed schema, run/operation identity, frozen source and payload hashes; acknowledged both. Read terminals and killed/removed only these completed children. Workspace remains open.
- **Transport hashes:** Standards943d156015b31ec79921b0f62337aecceecb9ffda523aa08359e18a537c48166; Spec ed07400cb21a9493f4d7ebb98e63b8407fd9b932959e5ca270dc0a52ff0f31e6.

## Limits and next step

Prepared private Linux CPU display and English prompt/OCR scope only. No borrowed-session capture or video capability claimed. Native suite and fresh collection results are parent observations. No compiler or new web runtime verification claimed. Both existing web driver implementations remain unchanged in the diff.

Parent must validate this receipt and source identity, then record phase completion before finish. No tracker update, source commit, merge, push or workspace cleanup was performed by this reviewer.

