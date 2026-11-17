# Collect feedback from one workflow request

## Ticket and problem

[collect-evidence-feedback-10-request](tracker/tickets/collect-evidence-feedback-10-request.md) requires one fresh collection-to-feedback workflow. Earlier commands imported sealed evidence but did not compose fresh capture and serving.

## Implementation

The request command invokes the sibling installed collector, keeps its approved typed plan and native safety checks, validates and imports sealed records, then starts the existing server. Explicit --historical uses the existing historical importer. Readiness returns the actual loopback URL, destination reference and saved-record paths. Blocked capture stops before import; sealed assertion failures retain their FAIL result for review. Signals pass through owned capture cleanup and normal server shutdown. No second capture driver, routing configuration or server was added.

Source: a1bb88ca440543bce3b1db6d8539972f9f857cb0. Tree: f9a88b8fa75e5d6a89727747912e5231f484a150. Branch: feature/collect-evidence-feedback-10-request. Base: master. Source commits: 5337dec9 and a1bb88ca. The normal bundle-version hook updated both plugin registries.

## Changed files

- **Source path:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- **Source path:** `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- **Source path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md`
- **Source path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/SKILL.md`
- **Source path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/how-to-browse-evidence.md`
- **Source path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/request.md`
- **Source path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/commands.ts`
- **Source path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/request.ts`
- **Source path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/request-workflow.test.ts`

## Validation

- **Fresh TUI and GUI:** Real installed-copy requests produced native captures and feedback sessions. The actual bundled viewer saved point pins; exports retain source hashes and coordinates.
- **Historical branch:** The actual viewer showed HISTORICAL EVIDENCE; export retained original times and hashes.
- **Blocked branches:** Missing X11 access, unavailable web prerequisites, API-token prompts and unexpected confirmations stopped without feedback import.
- **Failure distinction:** A real native GUI dimension mismatch remained FAIL in a served review.
- **Interruption and cleanup:** Interrupted capture returned exit 1 without a session. Four feedback servers exited 0 and released locks and ports. The owned private GUI fixture and display stopped; their runtime was removed. Temporary smoke scaffolds were removed after evidence retention.
- **Public suites:** One run reported 103 passed, 32 skipped and two failed. Both failures stopped at the missing configured Chrome distribution. This is a coverage gap, not a passing full-suite claim. Checks ran on the implementation working tree before source commits.
- **Diagnostics limit:** The configured TypeScript language server failed to start. No passing LSP check is claimed.

## Review history

Review attempt review-0007 returned FAILURE. Resolved findings: none. Open finding: R-001. See the review attempt below.

## Open questions and limits

Fresh Surf and Playwright capture and real video remain unverified on this host because required installed browser access is unavailable. The source retains the existing drivers unchanged. A prepared browser host is needed to close those coverage gaps. Native video remains explicitly unavailable.

The implementation-time resource observation was superseded by parent closure and the final review shutdown observations below. All owned feedback servers, native display and fixture have stopped. No user window or terminal was closed.

## Merge and publication

Reviewed with FAILURE. Not merged, pushed or ticket-completed. Workflow records are committed locally in the designated context checkout after result publication. Capture and serving performed no remote Git operation, credential entry, installation or automatic publication.

## Supporting records

- **Phase start:** [start-0001](workflows/collect-evidence-feedback-10-request/events/start-0001.yaml).
- **Child launch:** [launch-0002](workflows/collect-evidence-feedback-10-request/events/launch-0002.yaml).
- **Implementation result:** [implementation-0003](workflows/collect-evidence-feedback-10-request/events/implementation-0003.yaml).
- **Evidence and limits:** [request-0002](workflows/collect-evidence-feedback-10-request/artifacts/evidence/request-0002/index.md).
- **Suite output:** [public Bun suite output](workflows/collect-evidence-feedback-10-request/artifacts/evidence/request-0002/suite-output.json).
- **Shutdown proof:** [owned server and display observations](workflows/collect-evidence-feedback-10-request/artifacts/evidence/request-0002/shutdown.json).

## Parent completion

Parent verified the exact receipt, all output paths, retained TUI session validation and GUI saved export. Parent inspected both saved viewer images. The implementation terminal was closed; the resource observer confirmed all registered processes stopped. [Completion receipt](workflows/collect-evidence-feedback-10-request/events/start-complete-0005.yaml) and [parent checks](workflows/collect-evidence-feedback-10-request/artifacts/snapshots/parent-check-0004.json) retain the observations. At implementation completion, the source was unreviewed and unmerged; the review outcome follows below. Browser prerequisites and suite failures remain explicit coverage limits.



## Review attempt review-0007

Latest reviewer verdict: FAILURE. Source: `a1bb88ca440543bce3b1db6d8539972f9f857cb0`. Tree: `f9a88b8fa75e5d6a89727747912e5231f484a150`. Base: `512e2ec7eb0709365f76ba460b8336d8d33bf5eb`.

One open P2 finding, R-001. No resolved findings. Read the [immutable review](workflows/collect-evidence-feedback-10-request/artifacts/reviews/review-review-0007.md) for the finding and required validation.

Parent validation: scoped public request regression passed (1 test, 25 expectations). Public validate and export of the retained TUI feedback session passed and retained one saved annotation. The independent reviewer exercised the historical public CLI and HTTP saved-pin/export path; its wrapper exited 1 on immutable-directory cleanup, which was then completed. No full-suite pass is claimed.

All review tabs closed. The user approved termination of the stopped Standards process after identity verification. Final resource observations confirm shutdown. No source change, merge or push occurred.

- **Review start:** [review-start-0006](workflows/collect-evidence-feedback-10-request/events/review-start-0006.yaml).
- **Review result:** [review-0007](workflows/collect-evidence-feedback-10-request/events/review-0007.yaml).
- **Parent completion:** [review-complete-0009](workflows/collect-evidence-feedback-10-request/events/review-complete-0009.yaml).
- **Parent validation:** [public CLI proof](workflows/collect-evidence-feedback-10-request/artifacts/snapshots/parent-review-check-0008.json).
- **Shutdown:** [verified observations](workflows/collect-evidence-feedback-10-request/artifacts/snapshots/review-shutdown-0008.json).

Next: fix R-001 in a fresh fixer session, then obtain a new exact-source review.
