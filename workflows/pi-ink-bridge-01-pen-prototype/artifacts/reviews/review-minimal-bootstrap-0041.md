# Minimal bootstrap review 0041

- Ticket: `tracker/tickets/pi-ink-bridge-01-pen-prototype.md`.
- Branches: source `master`; base `master`.
- Baseline: `029e232162273d8822fb2b151e98504c23bc152a`.
- Reviewed commit: `b6819cea343179875db1ba256e7cc7fe27ef8989`.
- Reviewed tree: `b06bed881cff8805cd066ad174d96161c2831ce4`.
- Review completion: `2026-11-04T23:04:47.799Z`.
- Scope: the three minimal bootstrap parts. This is a separate source review, not a prototype workflow takeover or phase transition.
- Validation: tablet build, typecheck, eight tests with 44 assertions, shell syntax, and local HTTP/client/install/dry-run/quoting/lifecycle smoke passed. No tablet access or live OMP restart ran.

Paths below are relative to `mise/conf.d/devtools-omp/extensions/image-annotator/`.

## Standards

**FAILURE — one standards breach.**

`index.ts:106–118` introduces `startCoordinator` as a named helper nested inside `imageAnnotatorExtension`. This conflicts with `iso-24495-code`, rule 2: helpers belong at module level or as class members. The helper owns lazy startup, promise caching, and failure reset; it is not merely an event callback.

Move this logic to module scope. Preserve per-extension state, shared startup promises, and reset-on-failure behavior. Do not replace the closure with a process-global coordinator.

The earlier HTTP helper fix is present at `coordinator.ts:53–93`. The installer now calls `validate-url` before it creates the prefix, and the regression checks both a usable installed client and rejection without prefix creation. The public coordinator remains separate from the private editor. No additional concrete functional defects or heuristic findings were identified.

## Spec

**SUCCESS.**

- The desktop coordinator provides the requested local HTTP health, bundle, and checksum endpoints.
- The tablet bundle contains the Linux ARM64 client, installer, and version file. The client provides status and verified download commands.
- The extension-owned script fetches and checks the bundle, transfers it through SSH, and installs it into a new directory. The installer validates the URL before creating that directory.

No blocking omission, material scope expansion, or incorrect implementation was found within this scope. The browser editor stays separate and available. Drawing, XOVI, pairing, a daemon, process detection, pen input, and full hardware acceptance remain deferred. The source does not close the older prototype ticket.

Both reviews were read-only. Parent-reported smoke evidence was not independently reproduced. ARM64 hardware execution and live OMP lifecycle behavior remain unverified.

## Verdict

**FAILURE for this source commit.** Standards: 1 hard finding, the nested startup helper. Spec: 0 findings. Preserve this report and run a fresh review after the fix.

