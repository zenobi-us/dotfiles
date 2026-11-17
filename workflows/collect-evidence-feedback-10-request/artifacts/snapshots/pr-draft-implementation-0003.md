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

No review was requested or performed. Latest reviewer verdict: none. Resolved findings: none. Remaining review findings: none recorded.

## Open questions and limits

Fresh Surf and Playwright capture and real video remain unverified on this host because required installed browser access is unavailable. The source retains the existing drivers unchanged. A prepared browser host is needed to close those coverage gaps. Native video remains explicitly unavailable.

The resource observer still sees this active implementation harness and its shared browser runtime; whole-pane shutdown belongs to parent closure. All owned feedback servers, native display and fixture have stopped. No user window or terminal was closed.

## Merge and publication

Implementation only. Not reviewed, merged, pushed or ticket-completed. Workflow records are committed locally in the designated context checkout after result publication. Capture and serving performed no remote Git operation, credential entry, installation or automatic publication.

## Supporting records

- **Phase start:** [start-0001](workflows/collect-evidence-feedback-10-request/events/start-0001.yaml).
- **Child launch:** [launch-0002](workflows/collect-evidence-feedback-10-request/events/launch-0002.yaml).
- **Implementation result:** [implementation-0003](workflows/collect-evidence-feedback-10-request/events/implementation-0003.yaml).
- **Evidence and limits:** [request-0002](workflows/collect-evidence-feedback-10-request/artifacts/evidence/request-0002/index.md).
- **Suite output:** [public Bun suite output](workflows/collect-evidence-feedback-10-request/artifacts/evidence/request-0002/suite-output.json).
- **Shutdown proof:** [owned server and display observations](workflows/collect-evidence-feedback-10-request/artifacts/evidence/request-0002/shutdown.json).
