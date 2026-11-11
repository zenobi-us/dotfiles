---
schema: collect-evidence/v1
kind: procedure
---
# Web evidence

Resolve the installed skill directory. Use its absolute scripts/collect-evidence.ts entrypoint from any working directory. Keep the authored working plan and native temporary outputs outside the watched source tree. Descendants with names such as ..captures remain inside that tree and are rejected. The repository in scope selects the shared-context route, not a second output configuration.

## Drivers

| Driver | Operation | Recording | Reference |
|---|---|---|---|
| Surf | Attended Chrome extension and native host; fresh named session | Explicit unavailable limit | [Surf](drivers/surf-cli.md) |
| Playwright | Existing playwright-cli; fresh isolated browser session | Real WebM when requested and available | [Playwright](drivers/playwright-cli.md) |

## Plan approval

The typed Plan requires schema collect-evidence/v1, kind plan, workId, driver, base, approval and tests. Each test has a stable id, claim, pass, fail and ordered steps. Declare preconditions once and select them with requires. Compilation and record validation share structural checks. Case and precondition IDs start with a letter or digit and contain at most 160 letters, digits, dots, underscores or hyphens. Invalid IDs and unknown precondition references stop compilation before browser execution. An unmet precondition produces BLOCKED without running the affected case. A human step produces PARTIAL and stops further actions in that case.

Precondition check fields are optional. Present locator, text and goto fields must be strings. Present timeoutMs must be a finite non-negative number; zero and fractional values are valid. Invalid checks fail before generation or driver dispatch.

The says field is the human procedure. Keep selectors in locator fields. An expect needs text, visible or url criteria. Name screenshot scenes with shot. The drivers keep pre-assertion and settled images as distinct capture sequences.

Compile, render and run validate required Step fields first. Reader-facing actions require says. Navigation requires to. Click, fill, capture, wait and scroll require locator. Fill also requires text; capture also requires as. Press requires key; human steps require needs. These fields must be strings. Invalid fields return a versioned error with exit 2 before generated outputs or driver execution. Wait and scroll may omit says. Capture may omit attr; URL-only assertions may omit locator. Empty fill text, empty screenshot slugs and visible: false remain valid. Present optional Step fields must match their types: attr is a string; dom, gone and visible are booleans. Wait and expect timeoutMs values must be finite non-negative numbers. Omitted fields, false, timeoutMs: 0 and fractional timeouts remain valid. Locators retain driver-specific syntax.

Confirm origins, actions, attended operation and optional recording before run. approval.origins records approved HTTP(S) origins. approval.confirmations records approved click, Enter and Space activation step IDs. Spacebar and literal-space key names also require approval. These fields record consent; they do not grant it. The drivers inspect the live page before each action. Credential prompts, native dialogs, unapproved origins and unapproved confirmation steps stop the case. A frame that cannot be inspected needs human handling.

## Interruption and cleanup

Doctor and run handle SIGINT and SIGTERM from the start of each command. Run shares its cancellation state with the prerequisite doctor. An interruption waits for browser acquisition and owned-session cleanup before returning exit 1. It does not start capture after a cancelled prerequisite or report an interrupted command as completed. Repeated signals do not cancel cleanup. Borrowed sessions stay open.

## Collection and consumers

Run doctor, init, render, compile and run in order. If the plan changes, regenerate render and compile with --force. A compiled fingerprint does not authorize changed actions. run --dry-run performs no driver execution or writes.

Inspect actual images, assertion events and cleanup. Validate the sealed run. report prints self-contained HTML. comment prints manual steps with an explicitly supplied published URL. Neither command publishes or changes the run. Retain exports in a caller-owned path outside the sealed run.

Run Bun tests in the installed scripts/browser-evidence/test directory. Set COLLECT_EVIDENCE_REAL_DRIVERS=1 to include real controlled-page workflows. Complete browser setup separately. Set COLLECT_EVIDENCE_ACCEPTANCE_OUTPUT to an external evidence directory to retain the validated real-driver runs before destructive tamper checks. Use a new directory for each attempt. The checks never install tools. Keep the missing-media plan valid through public compile and render before running its screenshot-deletion scenario. Its navigation and heading assertion need reader-facing says fields. Compile success does not verify missing-media rejection or browser acceptance.



