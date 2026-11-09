---
title: Pi Ink client independent review 0076
type: Report
---

# Pi Ink client independent review 0076

## Verdict

SUCCESS. Standards: 0 findings; worst issue: none. Specification: 0 findings; worst issue: none.

## Scope

Ticket: `tracker/tickets/pi-ink-bridge-02-install-client.md` (local-markdown). Parent specification: `tracker/initiatives/pi-ink-bridge/index.md`.

Source branch: `feature/pi-ink-bridge-02-install-client`. Base branch: `master`.

- **Frozen base:** `7e2faef76a47130e9e5e4c8beab5390d22bed8d4`.
- **Frozen source:** `16d1122ae182d38630af5126dcf00a0aa7e8b626`.
- **Frozen tree:** `149bf25a63f328a6e0df06004d1b397792851ec1`.
- **Review time:** 2026-11-09T05:25:30.660Z.

Reviewed `git diff 7e2faef76a47130e9e5e4c8beab5390d22bed8d4...16d1122ae182d38630af5126dcf00a0aa7e8b626`. Its sole source commit is `16d1122a feat(pi-ink): complete pi-ink-bridge-02-install-client`.

Both reviewers independently read all 26 current product paths. Prior review0069 did not determine this verdict. The current diff contains no ticket or workflow changes. Context includes injected AGENTS.md, CONTEXT-MAP.md, domain configuration, ADR index and accepted ADR0001. CONTEXT.md is absent.

## Independent sessions

Coordinator: fresh OMP session `01a1bebf-4e88-70f5-a026-73a3d227de7e`, pane `w6X:pA`, run `305c0752-5930-4621-8e93-c34da385c002`.

| Axis | OMP session | Pane | Allocated run | Outcome |
|---|---|---|---|---|
| Standards | 01a1bec1-7e67-7098-81fe-61a3d5979817 | w6X:pB | 5e4d66c0-f306-40d5-867e-a6194d0c3368 | PASS |
| Specification | 01a1bec1-7e66-71bd-97ef-547d94192f26 | w6X:pC | 1106c318-5718-456f-be27-c44ad4593660 | PASS |

Router launches initially returned `agent_pane_busy`. Liveness and pane output showed two empty shell prompts and no analysis processes. The first OMP process then started in each allocated pane. Startup waits timed out, but actual pane output and session identities proved both processes were running. No duplicate sessions launched. Both analyses ran concurrently. Herdr later reported `done` for each pane; their typed results passed transport verification and acknowledgement. Both panes closed successfully; the workspace remains open.

Caller-approved /tmp result targets preserved the allocated run and operation IDs. They avoid the default /home symlink boundary. Transport targets are not workflow authority.

## Standards

PASS.
No documented-standard violations found. No baseline smell warrants a separate finding.

Reviewed all 26 changed paths in the specified three-dot diff, including deleted coordinator discovery, dependency changes, service startup, trust bootstrap, installer, AppLoad resources/protocol, tests, and README. Confirmed commit 16d1122ae182d38630af5126dcf00a0aa7e8b626 resolves to tree 149bf25a63f328a6e0df06004d1b397792851ec1.

Applied injected AGENTS.md, CONTEXT-MAP.md, docs/agents/domain.md, ADR index and ADR 0001, plus the ticket and parent initiative. CONTEXT.md is absent as supplied.

Independently inspected native-library guards: production-install.sh:23–27 uses regular-file checks for XOVI, AppLoad, and qt-resource-rebuilder before ZIP extraction. Missing files and directories fail those checks. Shell -f follows symlinks; this is not a no-symlink guarantee.

The frozen production-install.test.ts contains behavioral sandbox checks, not installer-source or deleted-prose assertions. It observes firmware guard progression and dependency rejection before extraction/client execution. Installation and AppLoad tests exercise preservation, trust rejection, and Unix packet boundaries.

Limits: static analysis only. No build, lint, test, formatter, runtime smoke, service/listener access, device access, deployment, or hardware acceptance repetition. Historical hardware acceptance remains durable; this report neither reruns nor invalidates it. No repository changes or workflow receipts. Prior verdicts did not determine this verdict.

## Specification

Specification: PASS. No actionable specification findings.

Reviewed the complete 26-path diff from 7e2faef76a47130e9e5e4c8beab5390d22bed8d4 to 16d1122ae182d38630af5126dcf00a0aa7e8b626. Read the ticket, parent initiative, CONTEXT-MAP.md, domain rules, ADR index, and cleanup trust-boundary ADR. Also inspected the existing TLS client configuration.

The implementation covers this ticket’s installation boundary: shared Pitchfork startup, readiness and compatibility rejection, LAN setup instructions, independently supplied download digests, stable server trust, device preflight, preserved client data, and a thin sidebar launcher with verified connection state. Discovery, pairing, and job actions belong to later tickets; their absence is not a ticket-02 defect.

Independently inspected production-install.sh:23–27. All three native-library guards use -f. Missing libraries and directories fail before extraction. The dependency regression cases check absent and directory paths, extraction reachability, and unchanged home entries. This is source inspection, not a fresh execution result.

The changed tests contain no setup-page prose assertions. Remaining command assertions concern the archive digest and SSH host-key checking, not exact explanatory wording.

Historical hardware acceptance remains accepted as supplied. No hardware acceptance was repeated. No build, lint, test, formatter, service, listener, device, SSH, installation, pairing, restart, or deployment operation ran. No repository files changed. This verdict reports static specification review, not fresh runtime proof.

## Prior finding checks

The historical artifact maps STD-001 to deleted prose assertions and SPEC-001 to native dependency checks. The handoff reversed these labels; this review checked both behaviors independently.

- **Prose assertions:** `test/production-install.test.ts:39–44,110–114` checks guard progression, exit codes, extraction, client reachability and preserved home entries. Deleted explanatory-prose assertions remain absent.
- **Native guards:** `tablet-client/production-install.sh:23–27` requires regular-file XOVI, AppLoad and qt-resource-rebuilder libraries before extraction at line34. The four absent/directory cases and regular-file continuation passed. Shell `-f` follows symlinks; this is not a no-symlink guarantee.

No blocking findings remain. ADR0001 defines a trusted, exclusive operation; this review does not introduce a hostile privileged-writer threat model.

## Validation

Executed from `mise/conf.d/devtools-omp/extensions/image-annotator`:

- **Installer regression:** `MISE_AUTO_INSTALL=0 mise exec bun@1.4.3 -- bun test test/production-install.test.ts`: exit0, 8pass, 0fail, 31assertions.
- **Local typecheck:** `MISE_AUTO_INSTALL=0 mise exec bun@1.4.3 -- bun run typecheck`: exit0; runs `tsc --noEmit` with local configuration.
- **Shell syntax:** `sh -n tablet-client/production-install.sh scripts/provision-tablet.sh tablet-client/build.sh tablet-appload/entry`: exit0.
- **Direct CLI smoke:** Ran the actual production installer with no arguments and with two malformed digests. Each exited1 at its argument/digest guard, before host or device inspection. Output reported the generated-command requirement and invalid expected SHA-256 digest respectively.
- **Frozen identities:** HEAD, HEAD tree and master matched the frozen values after analysis. Source staged, unstaged and untracked checks were empty.

The regression suite runs the real installer in isolated host Bubblewrap fixtures. It proves rejection before extraction and sentinel execution, not native ARM64 installation. Fixtures were removed by the suite. No permanent tests or source files changed.

## Retained evidence and limits

Consumed canonical records: implementation-complete-0074, fix-0066, prior review0069, snapshot pr-draft-review-0070 and candidate-reconciliation.json under artifacts/evidence/finish-0071. The reconciliation records exact product-byte equivalence with the prior reviewed source. This review still read the complete current diff.

Historical native launch remains bound by `events/start-complete-0057.json`. Repeat-install preservation remains bound by `artifacts/evidence/repeat-install-0058/acceptance-summary.json`. That summary records one installer execution, exit0 and 42 protected metadata records. These are historical observations, not new device checks. The later native-library preflight change has fresh host proof only; regenerate trusted instructions before any separately approved deployment.

No device, SSH, restart, reboot, pairing, mod-helper, private-record read, running-service/listener contact, deployment change or ARM64 rebuild occurred. No broad root checks ran. No staging, commits, tracker writes, source-worktree ledger writes, projections, merge, push or publication occurred. Unrelated base edits remain untouched.

## Reviewed paths

- **Path:** `README.md`.
- **Path:** `bun.lock`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/coordinator-discovery.ts`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/index.ts`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/installation-client.ts`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/installation-service.ts`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/mise.toml`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/package.json`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/scripts/provision-tablet.sh`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/server-identity.ts`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-appload/Connections.qml`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-appload/application.qrc`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-appload/entry`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-appload/manifest.json`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-appload/sidebar.qmd`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/appload.go`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/appload_test.go`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/build.sh`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/installation.go`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/installation_test.go`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/main.go`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/production-install.sh`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/test/coordinator-identity.test.ts`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/test/installation-service.test.ts`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/test/production-install.test.ts`.
- **Path:** `mise/conf.d/devtools-omp/extensions/image-annotator/tsconfig.json`.

## Authoritative result

Review artifact: `workflows/pi-ink-bridge-02-install-client/artifacts/reviews/review-review-0076.md`.

Review receipt: `workflows/pi-ink-bridge-02-install-client/events/review-0076.yaml`. Canonical workflow store root: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`.

The parent must validate the YAML, artifact, source binding and transport hash before acknowledgement. The parent owns all later phases. This review authorizes no device action or publication.

