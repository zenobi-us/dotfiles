---
schema: worktree-review/v1
title: Independent web review review-0045
type: Review
---

# Independent web review review-0045

## Verdict

FAILURE for frozen commit `6923f54f331697f6e8e591346d8071951909bfc7`, tree `9ed7f6b5ed3a9f93da589cfac566a29938bf9bb7`.
Standards has one P2 source finding and two unchanged P3 advisories. Spec has one P2 source finding and one P2 acceptance-evidence gate.
Timestamp: 2026-11-10T20:39:46.565568+00:00.

## Scope

- **Ticket:** `tracker/tickets/collect-evidence-feedback-01-web.md`, backend local-markdown, canonical status implemented.
- **Complete specification:** `tracker/initiatives/collect-evidence-feedback/index.md`, independently resolved from BASE.
- **Repository and workflow:** `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`; store repository; ref `workflows/collect-evidence-feedback-01-web`.
- **Source workspace:** `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web`; branch `feature/collect-evidence-feedback-01-web`; base `master`.
- **Comparison:** `git diff master...6923f54f331697f6e8e591346d8071951909bfc7`; master resolved to `87f35746d050d4fc17050cad5b60bc04f0ce7280`; merge base `859341b01ef7be474a3128b7f94772aab731c2f7`.
- **Commits:** 0acff3b4, 3d1b2825, 12b6345a, b711ef1b, 8c401541, 3dbab24c, 35b4bbe9, 6923f54f. The review covered the full 60-file cutover, not only the latest fixes.
- **Standards and context:** Loaded AGENTS.md, CONTEXT-MAP.md, docs/agents/domain.md, docs/agents/issue-tracker.md, docs/adr/index.md and ADR 0001. CONTEXT.md is absent. ADR 0001 governs Pi Ink cleanup, not this web slice.
- **Consumed provenance:** review-start-0044, fix-complete-0043, fix-0042, review-0039, pr-draft-fix-0042 and fix-0042 evidence. The already-started phase is this assigned fresh review. No second outer review or phase-start was created.

## Standards

One P2 public-workflow defect remains, plus two unchanged P3 judgement calls. Full master...6923f54f diff reviewed. STD-R6-001 is fixed: missing-media steps now have says. Optional Step validation also matches the selected fix. No relevant ADR applies. Static inspection only; no build, lint, test, browser or installation ran. Historical Surf reset timeout and Playwright failures remain ground truth, not retested. This report does not establish browser acceptance.

### STD-R7-001

- **Severity:** P2, blocking.
- **ADR or rule:** NO ADR. tracker/initiatives/collect-evidence-feedback/index.md, Testing Decisions 3 and 14: exercise public Surf workflows and retain reachable failure checks.
- **File and line:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts:119`.
- **Description:** Hard public-workflow coverage violation. Lines 119–121 require every native vars key to be unique across cases. All five identity cases deliberately use as: "identity" at line 81. surf-driver.ts:158–160 emits that literal alias unchanged. [INFERENCE] Once earlier browser gates succeed, the second completed identity case fails this assertion on the legitimate identity key. Missing-media, interruption and tamper checks below cannot run.
- **Required change:** Restrict cross-case uniqueness checks to collector-owned generated keys. Keep the authored identity alias valid in each separate workflow. Preserve checks that punctuation-distinct cases retain their correct URL and captures.
- **Validation command:** `git show 6923f54f331697f6e8e591346d8071951909bfc7:mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts`.

### STD-R6-002

- **Severity:** P3, advisory; non-blocking judgement call.
- **ADR or rule:** NO ADR. Baseline Duplicated Code; judgement call, unchanged and unselected.
- **File and line:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts:48`.
- **Description:** Possible Duplicated Code. This helper and records.ts:484 both create schema/kind frontmatter and invoke mise/mq, with different output, lock and overwrite policies.
- **Required change:** Optional: share a leaf Markdown writer with explicit caller policies; avoid a dependency cycle.
- **Validation command:** `git diff master...6923f54f331697f6e8e591346d8071951909bfc7 -- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts`.

### STD-R6-003

- **Severity:** P3, advisory; non-blocking judgement call.
- **ADR or rule:** NO ADR. Baseline Duplicated Code and Shotgun Surgery; judgement call, unchanged and unselected.
- **File and line:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts:47`.
- **Description:** Possible Duplicated Code. The click/Enter/Space approval predicate repeats at surf-driver.ts:127 despite a shared safetyCode owner.
- **Required change:** Optional: define confirmation classification once beside safetyCode and use it in both compilers.
- **Validation command:** `git diff master...6923f54f331697f6e8e591346d8071951909bfc7 -- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts`.

## Spec

Two P2 findings: one source validation gap and one unmet cutover evidence gate. SPEC-R6-001 and SPEC-R6-002 are addressed: optional Step validation and the missing-media fixture now match their contracts. fix-0042 records public non-browser rejection checks and successful fixture compile/render. These checks do not establish browser acceptance. No future feedback, TUI or GUI requirements were applied. No commands, browsers, builds or tests were rerun for acceptance.

### SPEC-R7-001

- **Severity:** P2, blocking.
- **ADR or rule:** NO ADR; ticket acceptance: Reject invalid records, missing media and unsupported explicit schemas without a valid-looking partial run.
- **File and line:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts:345`.
- **Description:** Static source defect: checkPlan validates only the precondition check object's existence. A required precondition with check: {locator: false} passes this boundary. Both drivers treat its false locator as an omitted machine check and return ok:true. Malformed timeoutMs, text and goto fields are also unchecked. Invalid typed input can therefore bypass a required check instead of returning invalid-input exit 2.
- **Required change:** Validate present Precondition.check fields against their declared types before generation or dispatch. Preserve valid omitted checks and non-negative finite timeout boundaries.
- **Validation command:** `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts`.

### SPEC-R7-002

- **Severity:** P2, blocking.
- **ADR or rule:** NO ADR; ticket acceptance: Remove the old active entrypoints and aliases only after both driver workflow checks pass.
- **File and line:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/SKILL.md:1`.
- **Description:** Unmet evidence gate, not a newly diagnosed runtime cause. The full diff deletes the old skill and entrypoints. review-0039 and pr-draft-fix-0042 retain Surf blocked.1 reset timeout (queueMs 0, hard timeout 60041 ms) and Playwright pass-case/approved-space failures. fix-0042 explicitly leaves browser acceptance unverified. Successful compile/render and scoped tests do not satisfy both-driver visible-page, actual-image, assertion and cleanup proof.
- **Required change:** Keep cutover approval blocked. Resolve the retained browser failures or prerequisites, then obtain authorized real controlled-page acceptance for both drivers before approving removal.
- **Validation command:** `COLLECT_EVIDENCE_REAL_DRIVERS=1 mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts`.

## Reviewer checks

SPEC-R6-001, SPEC-R6-002 and overlapping STD-R6-001 are resolved at their selected boundaries. checkPlan now validates the optional Step types. The missing-media fixture now has reader instructions and compiles. The current blockers are different findings.

The parent reproduced SPEC-R7-001 without opening a browser. A required precondition with `check: {locator: false}` compiled and rendered successfully for both drivers. Both native checkPrecondition implementations return ok:true when locator is false. Runtime bypass is a source inference; no driver executed it. Malformed goto, text and timeoutMs were inspected but not reproduced.

STD-R7-001 is static evidence, not a rerun failure. The test excludes only base and shots from native vars. Each identity case deliberately supplies the authored alias identity. The Surf compiler emits that alias literally. Its reuse across separate workflows is valid; the global uniqueness assertion is not. Keep the assertion focused on collector-generated keys. No new permanent test or source edit was made.

## Validation

- **Scoped regression command:** `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/verdict.test.ts mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/playwright-driver.test.ts`. Exit 0; 67 pass, 0 fail, 603 expectations. Browser workflow tests were excluded. [Observed suite output](../evidence/review-0045/scoped-suite.json).
- **Public CLI smoke:** The executable source entrypoint ran from unrelated `/tmp` workspaces. Both drivers passed init, fixture compile, fixture render and run --dry-run. Eight commands returned 0. Twenty-four compile/render/run commands rejected malformed attr, dom, gone and timeoutMs with exit 2 and versioned errors. Directory entries did not change during dry-run or rejection. [Commands and outputs](../evidence/review-0045/public-cli-smoke.json).
- **New defect reproduction:** Six public commands ran for malformed required preconditions. Both init commands and all four compile/render commands returned 0. [Commands and outputs](../evidence/review-0045/public-precondition-smoke.json). Generated acceptance of malformed input proves the boundary defect, not a browser result.
- **Source identity:** Initial and final status were clean. Branch, HEAD and HEAD tree match the handoff. No source, test, generated source, tracker or projection file changed.
- **Resource limits:** No driver, browser workflow, fake driver, installation command, credential entry, browser/service restart, remote Git operation, commit, push or merge ran. All reviewer-owned temporary CLI workspaces were removed. No new screenshot or browser acceptance is claimed.

Finding validation commands describe the check required for a fix. Except for the scoped suite named above, they are not new execution claims. SPEC-R7-001 needs new public malformed-precondition cases. SPEC-R7-002 needs separate authorization and prerequisite repair before any real workflow rerun. Do not rerun known failures merely to seek green output.

## Acceptance evidence

The cutover gate remains open. The ticket requires both real driver workflows before removing the old skill. The diff already deletes the old active skill and entrypoints. Compile output, unit results and earlier partial successes cannot satisfy visible-page, real-image, assertion and owned-cleanup acceptance.

Retained fix-0026 evidence records 15 pass and 2 fail. Its Surf blocked.1 case reports a navigate timeout before credential fill, with no assets. review-0039 and fix-0042 preserve earlier Playwright pass-case and approved-space failures. Historical native tracing records queueMs 0 and hard timeout 60041 ms. These facts do not identify a browser or extension root cause. No known failed scenario was rerun.

Missing proof: current complete controlled-page workflows for both drivers, actual screenshot inspection, intended assertion outcomes, credential/confirmation stops, and owned-versus-borrowed cleanup. Missing-media, interruption and tamper checks must also remain reachable after earlier workflow gates. This is an evidence gate, not a fabricated runtime diagnosis.

## Independent sessions and transport

Standards and Spec ran concurrently in fresh read-only sessions t2g and t2h. They ran no builds, lint, tests, formatters or browsers. Each returned code-review-axis/v1. The reviewer verified schemas, run and operation identities, frozen source identities, required finding fields, payload hashes and equality with retained recovery payloads, then acknowledged both results.

Initial artifact delivery failed because /home is a symlink and the transport rejects symlink path components. Parent t2c explicitly authorized canonical /var/home targets and refs for all three handoffs. The reviewer verified the same existing real directories and absent result files, retained original context bytes and immutable authorization evidence, then updated only transport paths. Both axes delivered unchanged payloads. No review or domain operation was repeated. [Recovery provenance](../evidence/review-0045/transport-recovery-authorization.json), [validated axis identities](../evidence/review-0045/axis-transport-validation.json).

## Next step

Parent owns receipt validation, tracker summary, publication, projections, reviewer closure and phase completion. Correct current P2 source findings in a separately authorized fix. Keep the cutover blocked until real acceptance evidence is available. Preserve all earlier receipts and evidence. P3 advisories remain unselected. No merge, push or ticket completion is authorized.

Standards: 3 findings, worst P2. Spec: 2 findings, worst P2. The axes remain separate.

