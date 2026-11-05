# DNS-SD bootstrap review 0044

- Ticket: `tracker/tickets/pi-ink-bridge-01-pen-prototype.md`.
- Branches: source `master`; base `master`.
- Baseline: `c2bede58b786d822e3e2e643d8852cb4b2ae56b4`.
- Reviewed commit: `63ccece760fb03bc20d58f66e51c32f56ea25384`.
- Reviewed tree: `8380d6d442fbf9e23f75164d9a9699fe7b1bc479`.
- Review completion: `2026-11-05T03:34:20.330Z`.
- Scope: all-interface public HTTP, DNS-SD coordinator discovery, and local-bundle SSH provisioning. This source slice does not authorize a takeover or phase transition for the preserved prototype workflow.
- Validation: [final desktop proof](../evidence/dns-sd-0044/desktop-smoke.json). [Initial source proof](../evidence/dns-sd-0044/desktop-smoke-e824899d.json) remains immutable.

Paths below are relative to `mise/conf.d/devtools-omp/extensions/image-annotator/`.

## Standards

**PASS.**

Reviewed the complete committed diff on `master`: `c2bede58b786d822e3e2e643d8852cb4b2ae56b4...63ccece760fb03bc20d58f66e51c32f56ea25384`.

### Documented-standard breaches

None found in the changed hunks.

Applied the loaded `AGENTS.md`, repository domain instructions, `skill://iso-24495-code`, `skill://code-comments`, `skill://typescript`, and the fixed review contract. Excluded rules enforced by tooling.

The final source addresses the previously reported named-type and file-header findings. No further breaches warrant file/line findings.

### Judgement calls

No actionable smell findings. The repeated notifications at the two OMP entry points remain an accepted judgement call, not a documented-standard breach.

### Review limits

Read-only source review. The reviewer ran no builds, tests, linters, formatters, provisioning, or device commands. The reviewer did not inspect the tablet or old prototype worktree, spawn children, or write a second review artifact. This verdict covers Standards only. It does not establish full ticket acceptance.

## Spec

**PASS.**

Reviewed the complete committed diff from `c2bede58` to `63ccece7` on `master`, plus the canonical ticket. The seven approved slice requirements govern this verdict.

Findings: (a) No missing or partial approved requirements found. (b) No unrequested behavior found. (c) No incorrect implementation of an approved requirement found.

- Requirements 1, 2, 6: `coordinator.ts:38–44` binds the dual-stack wildcard listener with an optional port. Lines 61–83 restrict HTTP access to health and the two public bundle assets. The browser editor remains separate. The diff adds no annotation transport or authentication claim.
- Requirement 3: `scripts/provision-tablet.sh:27–41` locates and verifies a local bundle independently of the working directory or coordinator. Lines 46–56 transfer it through SSH. `tablet-client/install.sh:25–37` refuses an occupied prefix and copies files without executing the ARM64 client, discovering a coordinator, writing a URL, or installing a daemon.
- Requirement 4: `coordinator-discovery.ts:69–90,108–110` persists the coordinator ID and registers the required service metadata through Avahi. `tablet-client/mdns_records.go:19–83` keeps service-instance metadata separate from host addresses. Multiple instances can share a host without losing their distinct ports or IDs. Split records accumulate before assembly.
- Requirements 4, 5: `tablet-client/mdns.go:126–151` scopes multicast queries to their interface. `tablet-client/discovery.go:142–155` preserves IPv6 link-local zones. Lines 51–67 reject ambiguity and missing selected IDs rather than switching coordinators.
- Installed-client behavior: `tablet-client/main.go:71–119` loads an optional saved ID, discovers current addresses, checks matching health, and saves only an explicit selection.
- Requirement 7: The diff adds no device experiment, pairing, annotation implementation, or old-workflow cleanup.

This was a read-only review. No checks or device commands ran. Reported prior execution results were not independently repeated. Full physical pen acceptance remains open. This PASS applies only to the approved source slice.

## Validation and resolved findings

- The real desktop smoke passed after the Go-only review corrections. It exercised IPv4 and IPv6 loopback, a configured desktop address, Avahi registration, two discovered coordinators, independent client selections, missing-selection refusal, and the actual bundle download.
- The local provisioning dry-run passed from another working directory before test coordinators started. SSH and curl boundary stubs were not called. The real ARM64 bundle installed offline into a fresh private prefix. The installer did not execute the ARM64 binary and refused an occupied prefix.
- Go tests and the ARM64 build passed after the corrections. TypeScript checking, 10 Bun tests with 46 expect calls, shell syntax, and the full browser build passed before those Go-only corrections. Those source surfaces are unchanged. Vite reported dependency directives and large chunks. No warning was suppressed.
- The initial Standards review found unnamed health/test-case shapes and a missing regression-file purpose header. Commit `63ccece7` resolves both findings. Fresh final Standards and Spec sessions reviewed the complete final source. Earlier reviewer sessions were not resumed.
- All owned test HTTP servers, D-Bus registrations, temporary install directories, the native smoke binary, and the throwaway smoke driver were closed or removed. Authorized multicast queries used configured desktop interfaces. No directed tablet connection, SSH operation, tablet install, or ARM64 device execution ran. The live OMP harness was not restarted.
- The old prototype worktree, workflow events, phase projections, and hardware acceptance remain unchanged.

## Verdict

**PASS for this source commit and scope.** Standards: 0 findings. Spec: 0 findings. Full physical pen acceptance remains open.

