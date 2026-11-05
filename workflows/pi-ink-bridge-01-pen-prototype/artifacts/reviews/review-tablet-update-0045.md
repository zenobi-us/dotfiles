# Tablet client update review 0045

- Ticket: `tracker/tickets/pi-ink-bridge-01-pen-prototype.md`.
- Branches: source `master`; base `master`.
- Baseline: `3e202d7ad552a25b3ae8e547e2bc3e59f7a47f1a`.
- Reviewed commit: `116dda7a9423e42987618966252afe563e71f8c2`.
- Reviewed tree: `6527b37d0916c425ad34dceaf44d57e893239b71`.
- Review completion: `2026-11-05T05:12:34.491Z`.
- Scope: a one-shot update command that a tablet UI can execute. The UI itself, tablet deployment, stock-editor integration, and full pen-ticket acceptance are outside this source slice.
- Validation: [runtime proof](../evidence/tablet-update-0045/verification.json) and [final-source coverage](../evidence/tablet-update-0045/verification-final.json).

Paths below are relative to `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/` unless stated otherwise.

## Standards

**PASS.**

Reviewed the complete committed diff from `3e202d7a` to `116dda7a9423e42987618966252afe563e71f8c2`.

### Documented-standard breaches

None found in the changed code. Applied `AGENTS.md`, `skill://iso-24495-code`, and `skill://code-comments`. Excluded rules enforced by tooling.

The update code uses a named result type and places its entry point before private helpers. Comments explain replacement semantics and the installer boundary.

The test refactor uses named fixture types, a fixture method for HTTP handling, and module-level helper operations. The `t.Run` closure only adapts the test case to its assertion helper.

### Judgement calls

No actionable smell findings. The small test adapter does not introduce a separate operation that needs extraction.

### Review boundary

Read-only source review. No checks, network commands, tablet operations, prototype-worktree access, or child agents. This verdict does not claim runtime verification or a successful tablet update.

## Spec

**PASS.**

Reviewed the complete committed diff from `3e202d7` to `116dda7` against requirements 1–7 and the canonical ticket. No missing requirements, incorrect implementation, or unrequested behavior found within the approved self-update slice.

- Requirements 1–2, UI execution and errors: `main.go:73–113` reuses saved selection, discovery, and matching health. `main.go:121–130` performs replacement before writing JSON. Errors reach stderr and exit 1 through `main.go:24–28`. No UI, SSH, daemon, process detection, or pen handling is added.
- Requirement 3, safe replacement: `main.go:152–175` verifies SHA-256 and bounds downloads. `update.go:50–65` stages beside the executable and validates before replacement. `update.go:85–125` requires the three expected, unique regular files and rejects other paths. The installer is not executed. `update.go:129–170` sets executable permissions, syncs staged bytes, and checks ELF architecture and an executable load segment. Only `update.go:68` replaces the installed executable through rename.
- Requirements 3–4, concurrency and preservation: `update.go:38–49` uses a persistent lock file with nonblocking flock. Concurrent replacement is refused. `update.go:54–71` cleans staging and replaces only the executable. Neither `coordinator-id` nor installed `VERSION` is rewritten.
- Requirement 5, version and deployment limits: `build.sh:5,12–17` packages version `0.2.0` and embeds that version. Repository-root `README.md:315,350–353` distinguishes desktop proof from tablet verification and states the setup-time deployment prerequisite for installed `0.1.0`.
- Requirements 6–7, security and scope: repository-root `README.md:355–357` explicitly states unsigned HTTP and publisher-authentication limits. The six-file diff leaves the browser editor, stock integration, device files, workflow events, phase projections, and full-ticket acceptance unchanged. No automatic update policy is added.

This was a read-only source and canonical-context review. No checks, device commands, source mutations, old-worktree inspection, or child sessions ran. The reviewer did not repeat the supplied runtime evidence. This verdict does not establish tablet deployment or full pen-ticket acceptance.

## Validation and review resolution

- A real native CLI fixture discovered an owned Avahi registration, downloaded the served bundle, replaced its own executable, and reported embedded version `0.2.0` on the next launch. The replacement bytes matched the served binary. The fixture used current source with an older embedded version, not the deployed `0.1.0` binary.
- A bad SHA-256 and an actual ARM64 bundle offered to the AMD64 fixture both failed without changing the working executable or saved coordinator ID. Test stages were removed. The throwaway smoke driver and owned temporary binaries were removed.
- Go tests with race checking passed. Ten Bun tests with 46 expect calls, the ARM64 bundle build, and shell syntax passed. The live desktop coordinator checksum matched the built ARM64 bundle. Production source and that bundle are unchanged after the test-only review correction.
- The initial Standards review required module-level test operations. Commit `116dda7a` moves rejected-update assertions and asynchronous work into helpers and HTTP dispatch into a named fixture method. Go tests with race checking passed again. Fresh final Standards and Spec sessions reviewed the complete source. No reviewer session was resumed.
- The installed `0.1.0` client still needs one setup-time deployment of the new executable before it can call `update`. No tablet update, SSH operation, or device execution occurred. The live OMP harness was not restarted.
- This path installs code from unsigned HTTP. SHA-256 does not authenticate the publisher. Use only a trusted development network and coordinator. The installed `VERSION` file remains the original installation manifest; the executable version command reports the current version.
- The preserved prototype worktree, workflow events, phase projections, and full hardware acceptance remain unchanged.

## Verdict

**PASS for this source commit and update slice.** Standards: 0 findings. Spec: 0 findings. The canonical pen ticket remains claimed and its physical acceptance remains open.

