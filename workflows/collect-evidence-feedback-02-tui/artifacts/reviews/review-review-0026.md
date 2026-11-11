---
kind: review
schema: worktree-artifact/v1
title: Independent native TUI review
type: Review
---

# Independent native TUI review

Check the native-terminal implementation against repository standards and the complete specification.

Reader: workflow owner. Attempt 4. Date: 2026-11-11T22:04:48.401Z.

[Overview](#overview) · [Scope](#scope) · [Standards](#standards) · [Spec](#spec) · [Validation](#validation) · [Limits](#limits)

## Overview

SUCCESS. No blocking findings remain. Standards: two Low, nonblocking findings. Spec: no findings. Parent must validate this result before recording phase completion. This verdict applies only to the frozen source below.

## Scope

Ticket: tracker/tickets/collect-evidence-feedback-02-tui.md. Complete specification: tracker/initiatives/collect-evidence-feedback/index.md. Both authoritative records were read in the parent store.

Source branch: feature/collect-evidence-feedback-02-tui. Base branch: master. Source checkout: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-02-tui.

Frozen commit: 3d05a5611dae33c992d8bbd81ed265a27d23892c. Frozen tree: e758e20e8bc45d732d01028960802390d347d11b. Initial and final source status were clean.

Pinned master: d3ab12587223a61c97f51982398aa72cbe53bd22. Merge-base: dee00b4124b8f4b442b8774449018308a57e32b1. Master remained at the pinned commit.

Comparison: `git diff d3ab12587223a61c97f51982398aa72cbe53bd22...HEAD -- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`. Nonempty: 16 files, 755 additions, 51 deletions. Full ticket implementation reviewed, not only the latest fix. Unrelated master changes excluded. Existing Surf and Playwright implementations are unchanged.

Consumed parent review-0025, fix-0023/fix-0024, implementation-0005, review-0020 and its artifact, latest pr-draft-fix-0023.md, retained smoke records and fixture. Read the complete ticket, initiative, context map, domain rules and ADR index. CONTEXT.md is absent. ADR 0001 concerns Pi Ink cleanup, not this collector; findings use NO ADR.

Both axes ran concurrently in fresh muxer terminals inside the exact source worktree space sp2fc383910a3914d554f504430da4abcc. Standards: d357aa54-2fca-4bc5-9728-3cb52a81f52b, t65. Spec: 30605b17-36a8-4c28-8a5c-dfdb38688f85, t64. Saved contexts bind their schema, run, operation and payload hashes. Both completion signals were completed, sequence 2. Both deliveries were verified, acknowledged and closed; only coordinator t63 remains in that source space.

## Standards

Two Low, nonblocking findings. STD-01 is a documented script-standard breach in a test-only grim shim. STD-02 is possible Duplicated Code in native test-store setup. No blocking Standards finding was identified. The reviewed slice retains the existing Plan/Driver boundary and common record consumers. The Pi Ink ADR concerns a separate device operation and does not override these findings. This review does not establish runtime correctness. The coordinator owns runtime proof.

### STD-01 — Low — Nonblocking

ADR: NO ADR. Location: [native-workflow.test.ts:131](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-02-tui/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts#L131).

Documented standard breach. mise/conf.d/devtools-agent/AGENTS.md, Scripts: 'Write every script as TypeScript run by bun' and 'Do not write Bash beyond a one-line wrapper. Logic belongs in the `.ts` file.' The added grim fixture contains '#!/bin/sh' and a case branch that permits doctor.png and rejects other captures. This is test-only shell logic, not a production capture fallback.

Required change: Move the fixture branch into a TypeScript executable with the prescribed mise Bun shebang. Keep only a one-line launcher if the grim executable name requires it.

Validation: After replacement, run the opt-in native capture-failure scenario. Confirm doctor succeeds and the later capture fails with assertionResult not-run and capture failure recorded. Not executed in this read-only review. Command: `RUN_NATIVE_EVIDENCE_TESTS=1 mise exec -- bun test /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-02-tui/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts`.

### STD-02 — Low — Nonblocking

ADR: NO ADR. Location: [native-workflow.test.ts:76](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-02-tui/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts#L76).

Heuristic: possible Duplicated Code, from the code-review smell baseline. Added hunks at lines 16–19 and 72–76 repeat repository creation, git init, origin setup and the complete .context-routes.toml literal: 'await writeFile(join(repository, ".context-routes.toml"), ...)' appears in both. A route change must update both test-store builders. No documented repository override was found.

Required change: Extract one private native-test repository setup helper. Pass the origin when the distinct test identity is useful. Keep each test's temporary root isolated.

Validation: Run the delayed-transition scenario and one native outcome scenario after extraction. Confirm both still resolve evidence into their own temporary repository. Not executed in this read-only review. Command: `RUN_NATIVE_EVIDENCE_TESTS=1 mise exec -- bun test /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-02-tui/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts`.


The coordinator verified both locations. STD-01 remains the prior test-only finding. STD-02 is a heuristic, not a hard rule. Neither establishes a production capture defect. Standards counts: two Low; zero blocking; worst severity Low.

## Spec

No actionable specification mismatch found in the full committed slice. Read the complete authoritative ticket and initiative, the native playbook, and the common evidence contract. The implementation retains the common Plan/Driver, command, store, record, validation and report boundaries. It adds a private CPU-rendered foot/Cage display, termscope control of the same tmux pane, native grim captures, terminal identities, visible-image synchronization, RGB/dimension/line-position assertions, and owned cleanup. Existing Surf and Playwright driver implementations are unchanged. Input requires approved step identity and expected current screen. Confirmation checks cover preconditions, waits, assertions and input. Credential checks precede approved input and cannot be overridden by approval. The token fix covers the documented English token/API-key/PIN/OTP field and request forms; this is not evidence of universal credential detection. Public workflow regressions cover delayed rendering, capture/assertion separation, blocked checks, confirmation boundaries and credential variants. Static inspection found no missing ticket capability or unrelated feature expansion. Runtime acceptance remains with the coordinator; this report does not claim visual verification or passing tests.

Spec counts: zero findings; zero blocking; worst severity none. Prior SPEC-01 and SPEC-02 are resolved for the exercised confirmation and credential cases. The unconditional credential guard runs before input approval in [tui-driver.ts:150–169](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-02-tui/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/tui-driver.ts#L150-L169).

The Spec child reported a combined Markdown read failure for context files. The coordinator read the parent context map, domain rules, ADR index and ADR 0001 separately. This closes that context gap without changing the child report.

## Validation

Use `<skill>` for `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-02-tui/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence`. Native commands used PATH=/home/zenobius/.local/share/collect-evidence/native-tools/fedora-45-x86_64/bin:$PATH. No tools were installed.

- **Native suite:** `RUN_NATIVE_EVIDENCE_TESTS=1 mise exec -- bun test <skill>/scripts/browser-evidence/test/native-workflow.test.ts`, source cwd. Observed 28 pass, 0 fail, 362 assertions, 67.63 seconds. Ran once. Includes six credential forms across expect/fill/Enter, confirmation boundaries, ordinary nonprompt words, capture/assertion separation and owned cleanup.
- **Common suites:** `mise exec -- bun test <skill>/scripts/browser-evidence/test/workflow.test.ts <skill>/scripts/browser-evidence/test/verdict.test.ts`, source cwd. Observed 99 pass, 0 fail, 892 assertions, 58.19 seconds.
- **Fresh public workflow:** `mise exec -- bun /tmp/ce-review0026-Vvoq5P/smoke.ts`, cwd /tmp. Adapted the retained fixture only to omit its parent-store copy. Doctor/init/render/compile/run/validate/verdicts/report exercised through the public executable. Diagnostic result: /tmp/ce-fix-0023-aIE9wY/validation.json. Of 94 commands, 82 exited 0 and twelve safety runs exited 3 as expected.
- **Fresh transition:** Real Ready → Loading → Details transition delayed 1.5 seconds; run exited 0/PASS. Only approved n reached the fixture. Actual images passed dimensions, RGB and line-top assertions. Terminal buffer text alone did not establish the pass.
- **Fresh credential stops:** API token:, API-key:, PIN: and OTP: each exercised expect-only, approved fill and approved Enter. All twelve exited 3/BLOCKED; no input file existed. Each recorded a credential safety stop. Snapshot stops can precede a prompt PNG; no prompt-image claim is made.
- **Original pixels:** Inspected fresh and retained original Ready and Details PNGs. Dimensions 1280×720; purple RGB [201,166,255] at (10,55); Selected item occupies the next 20px line. Text tops 11/31px checked by native image assertions. Tmux padding remains visible; no crop, recolouring or reconstruction.
- **Source hashes:** Fresh and retained bytes match common records. Ready SHA-256 2493a3a4e51d475e6f0bac03014d1c51e4e182d9526a78c6de677aa4cdbf5a6f. Details SHA-256 b6c7cd3ce3061d69feb27c979bf960ed49c44f411734afb9219626e3aeb8ca5a. Fresh assets share session ce-tui-58a01f5c-5121-41f8-bb2b-fbeb463349e4, pane %0, socket /tmp/ce-native-axvNJY/tmux.sock, display wayland-0, Cage PID 3024048 and foot PID 3024061.
- **Owned cleanup:** Fresh fixture verified every runtime directory absent and every owned fixture/server/display PID stopped. Transition fixture PID 3024200 and server PID 3024025 stopped. Fresh borrowed-session doctor exited 0; sentinel pane %0 PID 3047722 stayed unchanged. Only the owned sentinel server was then removed. Unrelated terminals were not touched.
- **Historical consumers:** Public validate/verdicts/report on all thirteen unchanged parent fix-0023-smoke runs: 39 exits 0. Recorded transition remains PASS; twelve credential cases remain BLOCKED. These reads are historical verification, not fresh capture. Original parent evidence is unchanged.
- **Axis transport:** Standards SHA-256 7f28b6e860e23f1e7b1785779f2c5002012f42c8ecc7351b69ea228820341cd3; Spec SHA-256 fd9ed204d02fb3ae53ee90ddfd51f87fb5f93fd6bcf276eb9dcc7ea5283567e7. Verified schema, run, operation, payload hash and exact frozen source. Native completion signals observed; only t64/t65 acknowledged and removed. Source workspace remains open.

## Limits

Only the prepared private Linux CPU-rendered display and English prompt/OCR cases were exercised. This is not a reproduction of an existing user terminal. Native video is unavailable. Credential protection claims are bounded by the listed cases, not universal wording recognition. No new web-driver runtime proof is claimed.

Compiler/LSP was not run because the prior prerequisite was unavailable. No compiler success is claimed. Existing failed observations remain historical; no old failure was rerun merely to confirm it.

Fresh diagnostics remain outside source under /tmp/ce-fix-0023-aIE9wY; owned application resources are released. The fixture's printed retained-path field is inherited text, not a new parent-store copy. The unchanged parent evidence remains the durable image reference.

Exactly this immutable review artifact and review-0026 phase-result are new workflow records. No source, ticket, generated configuration, projection, merge, rebase or push changed. Parent owns publication, ticket reference, phase-complete, acknowledgement and coordinator shutdown. No goal context applies.

