---
title: Independent historical evidence review
type: Concept
---

# Independent review: collect-evidence-feedback-09-history

## Verdict

FAILURE. Standards: no findings. Spec: one blocking finding, SPEC-02 (medium).

## Frozen scope

Ticket: `tracker/tickets/collect-evidence-feedback-09-history.md`.
Specification: `tracker/initiatives/collect-evidence-feedback/index.md`.
Source branch: `feature/collect-evidence-feedback-09-history`. Base branch: `master`.
Source: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-09-history`.
Commit: `9f744831bc9a5edee5ab7a37aa2c089dd82fbf7f`.
Tree: `00625a17e78c1b5728098f45a41c5ec7239c8cd7`.
Review base commit: `421909c1cec309a8321d176822e680ca8bb0245c`.
Timestamp: `2026-11-16T09:31:34.110146+00:00`.
Diff: `git diff 421909c1cec309a8321d176822e680ca8bb0245c...9f744831bc9a5edee5ab7a37aa2c089dd82fbf7f`.
Source commits: `67c190e3`, `710abe78`, `9f744831`.
Source was clean and exact before and after investigation and checks.
Publication checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`. Both checkouts use the same Git common directory.

### Changed scope

- **Path:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/evidence-schema.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/SKILL.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/how-to-browse-evidence.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/annotations.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/commands.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/records.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-fixture.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/cases/original/case.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/cases/original/events.jsonl`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/cases/original/index.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/cases/original/media/step-002-step-original-002-original--capture-001--capture-001.png`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/cases/original/media/step-002-step-original-002-original--capture-002--capture-002.png`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/index.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/native/plan.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/native/report/shots/step-original-002-original--capture-001.png`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/native/report/shots/step-original-002-original--capture-002.png`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/native/runs/case-original.log`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/native/workflows/smoke-test-original.js`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/plan.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/plan.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/run.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/history-workflow.test.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/main.tsx`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/types.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/CHANGELOG.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/SKILL.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/report-cli.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/test/report-cli.test.ts`.

### Affected contracts

- **Contract:** collect-evidence/v1 common evidence records and report rendering.
- **Contract:** collect-feedback/v1 historical session provenance and exports.
- **Contract:** writing-reports evidence public command.
- **Contract:** Bundled feedback viewer.
- **Contract:** Developer bundle version manifests.

## Standards

Independent axis: run `887c50bf-5fa2-4a79-805a-ab68d5ee566e`, terminal `t1cr`.

No actionable documented-standard breaches or baseline smells found in 421909c1...9f744831. Reviewed historical selection, shared-record imports and reports, viewer source and bundle changes, manifests, documentation, and public-command regressions. The initiative requires versioned CrustJS commands, read-only report consumption, preserved source identity, and public workflow tests; the changes follow those conventions. Independently inspected Crust 0.0.19: it records the evidence route before argument parsing, invokes middleware on parsing failures, and validates required arguments inside middleware. The new report middleware therefore covers the previously identified missing-directory and unknown-flag paths without changing legacy command handling. No applicable ADR governs this slice. Static read-only review only; no checks, tests, builds, browser runs, repository edits, or workflow reports were performed.

## Spec

Independent axis: run `3c87905a-ac5d-4983-acbb-3fe9a72837a8`, terminal `t1cq`.
The axis found one blocking error-classification defect. This review assigns it SPEC-02 to preserve the prior SPEC-01 identity.
The axis inspected explicit selection, immutable copies, source references, dates, unsupported versions, assertion results, shared identities and historical labels.

### SPEC-02 — medium — NO ADR

`mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/report-cli.ts:34`

The initiative, Commands and execution decision 14, requires “2 for invalid arguments or schemas”.
The new feedback report path maps `AnnotationError` to operation failure instead of invalid input.
`exportSession` validates saved annotations. Unsupported schemas and malformed JSON throw `AnnotationError`.
The report catch recognizes only `CliError` and `SyntaxError`. Its outer parser middleware cannot handle errors already consumed by this catch.

Observed from `/tmp`, using a temporary copy of a valid historical session with a saved note:

- **Unsupported schema:** Change only the saved annotation schema to `collect-feedback/v999`. The command emits one `collect-evidence/v1` error with `success:false`, `code:1`, and exits 1.
- **Malformed JSON:** Replace only that annotation JSON with `{`. The command emits the same error contract with `code:1`, and exits 1.

Required change: classify invalid saved annotation records as invalid input at the report boundary. Preserve one JSON error, `success:false`, `code:2`, and exit 2. Keep operation failures distinct.
Validation: run `report-cli.ts evidence <copied-session> --feedback --json` for each invalid annotation variant. Assert the full error envelope and process exit 2.
Blocking reason: machine consumers cannot distinguish invalid saved feedback from an operation failure, contrary to the specified public command contract.

## Prior finding resolution

Prior SPEC-01 is resolved for its original parser cases. Missing directory, unknown flag and invalid boolean each emitted exactly one JSON error with `schema:collect-evidence/v1`, `success:false`, `code:2`, and exit 2.
Evidence help and the existing doctor command succeeded. This resolution does not cover SPEC-02.

## Validation

The independent axes ran no tests or builds. After both investigations, the declared integration command ran once:

```sh
mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/test/report-cli.test.ts mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/history-workflow.test.ts
```

Result: exit 0; 7 tests passed; 0 failed; 72 assertions. The historical workflow includes unknown capture times, unsupported evidence versions and unchanged source/session hashes.

Actual absolute public commands ran from `/tmp` with a temporary repository-backed store:

- **Historical import:** A real earlier-run fixture imported with explicit `--historical`. Versioned session and immutable media retained source IDs, hashes and the original 2026-11-13 capture date.
- **Browser inspection:** The actual bundled page displayed the historical warning and original “Feedback edit evidence” pixels. The case showed its existing assertion results and both assets.
- **Saved feedback:** A note saved through the viewer. After reload and pin selection, the saved comment remained visible. Export included its revision and original source hash.
- **Read-only reports:** Two writing-reports feedback reports agreed with collector reports on cases and verdicts. Feedback JSON equalled the public export. Complete file hashes of the earlier run and saved session stayed unchanged.
- **Report pixels:** The actual HTML report displayed the historical warning, case PASS result and original image.
- **Negative checks:** Unsupported and malformed saved annotation records reproduced SPEC-02 with exit 1. No source or original session data changed.

Browser text waits initially used title-case text while CSS exposed uppercase text. Direct page inspection and screenshots confirmed the label. A saved note uses a read-only panel until Edit note; no textarea is present there. These automation assumptions were corrected without source changes.

## Coordination and limits

Parent `review-start-0010` authorizes this fresh review after `fix-complete-0009`. The inspector found valid history and the exact clean source. Its retry/unknown-owner classification describes this already-assigned active child; no duplicate formal review was launched.
The parent records confirmed fixer shutdown and no reservation or hard blocker.
Current master was `0aec24c1ac786d3ffb415f72d4f864a224c489ed`. Its two generated version manifests had no changes since the review base. Frozen manifests agree on developer version 0.2.46.
Generated manifest overlap with the muxer stream remains an integration warning. Stale linked tracker copies and unrelated Pi journals leave the wider inventory incomplete. This review does not approve unknown scopes or a future merge candidate.
Only this artifact and its phase-result receipt are published. No source, test, generated file, tracker or projection changed. No commit, merge or push ran. No new evidence run was invented.

## Resources

Both axis results were verified and acknowledged through result-delivery. Both owned axis terminals were stopped and removed; unrelated spaces and terminals remained open.
The viewer stopped with exit 0. Port 19871 refused new connections. Both owned browser tabs closed. The parent owns terminal `t1cm` and final reviewer shutdown. Resource observations remain in muxer transport.

## Axis totals

Standards: 0 findings. Spec: 1 blocking medium finding, SPEC-02. Prior SPEC-01: resolved.

