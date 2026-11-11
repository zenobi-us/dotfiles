---
kind: review
schema: worktree-artifact/v1
title: Independent native TUI exact-source review
type: Review
---

# Independent native TUI review

## Verdict

SUCCESS. No new or blocking findings. Retain the two prior Low Standards findings by reference only.

## Scope

Ticket: tracker/tickets/collect-evidence-feedback-02-tui.md. Complete specification: tracker/initiatives/collect-evidence-feedback/index.md.

Source: feature/collect-evidence-feedback-02-tui. Base: master at fe759f72c0fe01e1a037ec1a7d5f03b710725141. Frozen commit: e9d1a62de21fc2b8ccff7940fa333f42a87e5e3d. Frozen tree: d879ba9c67b26a573e1b5eebb1d5741e734c15c7. Timestamp: 2026-11-11T22:30:25.934Z.

Reviewed git diff master...HEAD and the full ticket slice. The latest de8615f5..HEAD delta contains six unrelated herdr tracker/workflow records. All devtools-agent implementation, tests and documentation remain byte-identical to accepted review-0031. This review covers the current exact source, not only the merge.

Consumed review-0033 dispatch, accepted review-0031/review-0032, original fix-0023/fix-0024 provenance, accepted review-0026/review-0027, pr-draft-fix-0023 and finish-0030-smoke evidence. Read the context map, domain rules, ticket, initiative and indexed ADR. ADR 0001 concerns Pi Ink, not this slice. Prior review records CONTEXT.md as absent.

## Standards

No new documented-standard violations or actionable baseline smells. No blocking Standards findings. Reviewed the complete git diff master...HEAD and git log master..HEAD --oneline against master fe759f72c0fe01e1a037ec1a7d5f03b710725141. Verified the assigned HEAD and tree. Inspected driver, validator, plan, pipeline, records, rendering, public regression tests, capability documents and manifest changes. The implementation retains the existing typed Plan/Driver boundary and common records. Native plan checks share checkTuiPlan between load-time and sealed-record validation. Standards sources: root and devtools-agent AGENTS.md, docs/agents/domain.md, CONTEXT-MAP.md, docs/adr/index.md, ADR 0001, DESIGN.md, the complete ticket and initiative. CONTEXT.md is absent. ADR 0001 concerns Pi Ink and does not govern this driver. Initiative decision 4 requires: Keep one authored typed plan. The new TUI path follows this boundary. Tooling-enforced issues excluded; baseline smells treated as heuristic judgments. Read accepted review-review-0031.md and its review-0031/finish-0029 provenance. Its source is de8615f5eb03069289e7d594872e5dc3dff5c325. Inspected git diff de8615f5..HEAD: six unrelated herdr tracker/workflow records only; no TUI source, tests or documentation changes. STD-01 and STD-02 remain Low and nonblocking by reference to review-review-0026.md; neither is duplicated or expanded here. Bounded prior evidence is accepted, not fresh execution: review-0031 records retained public validation, original-image/hash inspection and parent suite results. No tests, builds, lint, native collection, commits, tracker writes, repository artifacts or child spawns performed. New findings: zero. Retained findings: two Low, nonblocking.

Standards: zero new findings; two retained Low nonblocking findings; worst Low. See [review-0026](review-review-0026.md). No duplicate finding or new fix scope.

## Spec

No actionable specification mismatch found.

Scope: full master...HEAD diff and master..HEAD history at the assigned frozen commit/tree; all seven ticket criteria and the initiative’s common command, storage, schema, safety and public-testing rules. The de8615f5..HEAD delta contains only six unrelated herdr tracker/workflow records; no TUI source, tests or documentation changed. No capture-feature scope creep identified.

Exact-source checks (paths below are relative to collect-evidence/scripts/browser-evidence): drivers/tui-driver.ts:46–95 implements prerequisite checks and private CPU foot/Cage/wlroots/grim capture. Lines 288–307 bind termscope and foot to the same pane/PTY and record display identities. Lines 150–202 require matching buffer/OCR, consecutive native frame hashes, dimensions, RGB probes and separate text-line positions. This implements “A matching terminal buffer alone cannot pass the visual check.”

Input checks at drivers/tui-driver.ts:117–121,150–169 enforce approved step IDs and current-screen scope. Credential rejection precedes approval. Cleanup at 212–235 targets owned resources. tui-plan.ts:5–35 validates exact command/directory approval and native assertions. pipeline.ts:178–250 retains common routing, dry-run, external staging, cancellation, cleanup-before-sealing and immutable finalization. records.ts adds native identities without a second record contract. The playbook and capability documentation state OCR, platform, video and application-side-effect limits. Neither existing web driver implementation changes.

Evidence: accepted review-review-0031.md and review-review-0026.md, plus finish-0029 approval provenance. They record real delayed-screen PNG inspection, colour/spacing/dimensions/hash checks, borrowed-session preservation, owned cleanup, 13 public smoke scenarios, 28 native passes and 99 common passes. These are bounded prior observations, not fresh execution. Read domain rules, context map and ADR index/0001; the Pi Ink ADR does not govern this driver.

No edits, tests, runtime capture, commits or tracker writes performed. No new platform or visual verification claimed. Prior STD-01 and STD-02 remain Low/nonblocking by reference; not duplicated. Spec findings: zero.

Spec: zero findings; worst none.

## Independent validation

- **Public consumers:** Ran the source worktree's executable collect-evidence.ts through mise from /tmp. validate and verdicts on retained transition and credential-0-fill all exited 0. Transition reports PASS; credential-fill reports BLOCKED.
- **Original media:** Opened the retained Ready and Details PNGs. The native headings differ. Selected item occupies the next line. The purple bar and unmodified tmux padding are visible. ImageMagick reports 1280×720 and RGB(201,166,255) at (10,55).
- **Source hashes:** Recomputed Ready 2493a3a4e51d475e6f0bac03014d1c51e4e182d9526a78c6de677aa4cdbf5a6f and Details b6c7cd3ce3061d69feb27c979bf960ed49c44f411734afb9219626e3aeb8ca5a. Both match retained records. Public validation checks source bytes, dimensions and terminal metadata.
- **Retained safety:** Inspected 13 retained scenario results: transition PASS with only n received; twelve API-token/API-key/PIN/OTP cases BLOCKED with no input. Independently checked that all 13 recorded runtime paths and fixture/server PIDs are absent. No fresh collection claimed.
- **Parent checks:** Retained finish-validation.json reports native 28 passes/362 assertions and common 99 passes/892 assertions. It records 94 public commands across 13 scenarios. Full suites were not rerun, as instructed.
- **Independent sessions:** Fresh depth2 Standards run 1821d60a-77f0-4a39-a3e1-162cac037d14 in t6h and Spec run 47fbdf4d-6ddb-4883-b2f7-6a2926d03c8b in t6j. Both completed at sequence 2. Validated schema, run/operation identity, frozen source and payload hash. Read, acknowledged and removed only these child terminals. The source workspace remains open.
- **Transport hashes:** Standards 769fc6020be4404abf511f6285e7dfbfb20821a5cc695ab9d25f510bed2934d4; Spec 4900275f8d3ea05e3decec524dc0393e4761c46e4fc581d7b0f7252b7d857258.

## Limits and next step

Bounded prior native execution supports the unchanged implementation. Current direct proof covers public consumers, original images, source hashes and retained cleanup identities. No fresh native collection, compiler success or web runtime validation claimed. Private Linux CPU display and English prompt/OCR limits remain explicit. Native video and borrowed-terminal capture remain unavailable.

The parent must validate review-0034, close this reviewer and append phase completion before finish. The parent owns tracker comments, projections, commits and publication. This reviewer changed no source, tests, tracker, projection or prior artifact.

