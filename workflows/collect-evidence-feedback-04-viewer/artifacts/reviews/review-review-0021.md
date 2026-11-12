---
schema: worktree-artifact/v1
title: Independent viewer review attempt 4
type: Concept
---

# Independent viewer review

Review the frozen viewer implementation for the workflow owner.
Reader: the parent reviewer. Date: 2026-11-12T09:15:29.799685+00:00.
Verdict: FAILURE. One low-severity Standards finding blocks the explicit typography acceptance criterion. Spec has no findings.

## Scope

Ticket: `tracker/tickets/collect-evidence-feedback-04-viewer.md` (local-markdown).
Initiative: `tracker/initiatives/collect-evidence-feedback/index.md`.
Branch: `feature/collect-evidence-feedback-04-viewer`. Base: `master`.
Frozen commit: `9f9834003647d29efbc0ac19b49fd310ae1a1758`.
Frozen tree: `431e49b346e6db78658a5a74cd85a76c2a77234f`.
Command: `git diff master...9f9834003647d29efbc0ac19b49fd310ae1a1758`.
Base resolved to `9f6c737e40be822dc4105addec516179b499e742`.
The complete ticket implementation and both fixes were reviewed, not only previous findings.
Changed product files, plugin registrations, maintained frontend, distributed HTML, and public regression were in scope.
The canonical ticket, complete initiative, DESIGN.md, context documents, ADR index, prior review and fix receipts informed the review.
ADR 0001 concerns Pi Ink cleanup and does not apply.
The inspector accepted the repaired receipt graph. The parent confirmed review-only authorization.
No source, tests, configuration, generated files, ticket, projections, or other workflow state were changed.

## Standards

Reviewed the complete read-only viewer implementation and its public workflow checks against DESIGN.md, repository context, and the canonical ticket and initiative. One documented typography breach remains. No additional baseline smells warrant a finding. ADR 0001 does not apply. Static review only; no builds, tests, formatters, or browser checks ran.

### STANDARDS-01 — low severity, blocking acceptance breach

**Location:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/styles.css:74`.
**Rule:** DESIGN.md, Typography / Hierarchy: default body and control text is 13px. Initiative decision 59 also requires 13px control text.
**ADR reference:** NO ADR: DESIGN.md typography and initiative decision 59 govern this control size. ADR 0001 concerns unrelated Pi Ink cleanup.
**Description:** The .back rule overrides navigation button text to 10px. Both Session and Cases actions use this class. These are controls, not section labels, so they breach the documented 13px control typography.
**Required change:** Remove the .back font-size override or set it to 13px. Rebuild the distributed viewer/index.html.
**Validation command:** `On the served viewer, run in the browser console: [...document.querySelectorAll('button.back')].map(button => getComputedStyle(button).fontSize). Both values must be '13px'.`
**Observed validation:** Both distributed Back controls render at `10px` in Chromium. The required value is `13px`.
This remains a low-severity finding. It blocks approval because the ticket explicitly requires DESIGN.md typography.
No heuristic smell finding was reported.
The prior STD-01 focus issue is resolved in the exercised desktop Back and narrow ArrowLeft paths.

## Spec

No Spec findings. Reviewed master...9f9834003647d29efbc0ac19b49fd310ae1a1758 against the complete canonical viewer ticket and initiative. Checked immutable source snapshots and media copies, provenance and schema validation, read API, CLI modes and installed-path resolution, shared loopback server and exclusive lock, Host/Origin checks, registered asset and symlink boundaries, request limits, maintained Base Nova components, bundling, and inspector-column behavior. The plain-output fix preserves JSON precedence and quiet output. Annotation, editing, export and historical-labelling features remain outside this viewer slice. Confirmed the reviewed commit and tree. Read-only static review only; no builds, tests, formatters or browser execution performed, as instructed. Findings: [].

The prior SPEC-01 plain-output issue is resolved. Public plain, JSON and quiet validation modes returned their expected formats.

## Validation

- **passed:** `git rev-parse master 9f9834003647d29efbc0ac19b49fd310ae1a1758 HEAD HEAD^{tree}; git status --porcelain; git diff --stat master...9f9834003647d29efbc0ac19b49fd310ae1a1758; git log --oneline master..9f9834003647d29efbc0ac19b49fd310ae1a1758`. Frozen commit/tree match; initial source clean; nonempty diff, four commits.

- **passed:** `worktree/scripts/inspect.ts tracker/tickets/collect-evidence-feedback-04-viewer.md --json`. Valid repaired graph; decision review/retry; current review-start-0020 and explicit review-only approval.

- **passed:** `mise exec -- env PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome bun test /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-04-viewer/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts`. 1 pass, 0 fail, 58 assertions; 9.80 seconds.

- **passed:** `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-04-viewer/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts validate /tmp/review0021-i4f9_uc3/session --plain; same --json and --quiet`. All exit 0; plain dotted-field text 63444 bytes; versioned JSON 45508 bytes; quiet stdout 0 bytes.

- **passed:** `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-04-viewer/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts serve /tmp/review0021-i4f9_uc3/session --port 18821 --json; BrowserTab review0021`. Real bundled viewer at 1440x900 and 390x844, screenshots inspected. Image decoded width 1280, JetBrains Mono, 13px body, background rgb(25,21,33). Back at desktop and ArrowLeft at narrow restore second asset button focus. Narrow body width 390, finder scrollLeft 390. Browser error list empty.

- **passed:** `HTTP registered image byte/hash comparison and refusal requests on owned 127.0.0.1:18821`. HTTP/source bytes identical; SHA-256 9c3004a6ec3b9f0f72f4055016202e553c17d69ea5a60cbec6e0876839811449. Wrong Host/Origin 403; unregistered asset and session.json route 404; normalized encoded traversal 404. Changed bytes and symlink return 409; restored bytes return 200. Second writer exits 3.

- **passed:** `Occupy 127.0.0.1:18821; public serve; release socket; direct serve.ts <copy> --port 18821 --plain; SIGTERM`. Busy port exits 1 without retained lock. Direct entrypoint emits plain readiness, HTTP session 200, SIGTERM exits 0 and releases lock. Main owned service also exits 0 and releases lock. Browser closed; owned temporary session removed.

- **finding reproduced:** `BrowserTab: [...document.querySelectorAll("button.back")].map(button => getComputedStyle(button).fontSize)`. Distributed viewer renders both Session and Cases Back controls at 10px instead of required 13px. Fresh owned server/tab closed; SIGTERM exit 0; copied session removed.

The independent interactive Standards and Spec sessions ran in parallel. Both delivered source-bound `code-review-axis/v1` results and native completion sequence 2.
Their schema, source identities, delivery hashes and results were verified and acknowledged before closing only the owned terminals.
Standards run: `8334aafb-e5e8-465f-b644-85fe841bca4d`, terminal `t8d`.
Spec run: `1ff2d288-c490-4189-ba66-aec63e366b6e`, terminal `t8c`.
The first hidden worker pair failed because its model endpoint refused connections. Those failed workers supplied no review evidence.

## Limits

No frontend build or formatter ran. Axis workers ran no tests or runtime checks.
The parent reviewer ran the focused public regression and actual CLI, HTTP and Chromium checks listed above.
Screenshots were temporary observations, not retained evidence artifacts. No new evidence run is claimed.
This review reused copies of an existing real-browser session. Its original evidence stayed unchanged.
Annotation creation, editing, drafts, export, video collection and historical labelling belong to other tickets.
Parent owns ticket comments, projections, phase completion, publication and terminal cleanup for this review session.
No fixes, merge or push were performed.

Standards: 1 low-severity finding; worst issue is the explicit Back-control typography breach. Spec: 0 findings.

