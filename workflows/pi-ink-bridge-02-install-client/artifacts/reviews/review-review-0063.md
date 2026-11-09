---
title: Pi Ink client independent review 0063
type: Report
---

# Pi Ink client independent review 0063

Review the frozen installation change before merge. Reader: parent operator and implementer. Date: 2026-11-09T02:09:59.396087+00:00.

## Overview

Verdict: FAILURE. Fix SPEC-001 before merge. STD-001 also violates the documented testing rule. Hardware acceptance remains valid; this review does not request new device access.

Ticket: `tracker/tickets/pi-ink-bridge-02-install-client.md`. Parent specification: `tracker/initiatives/pi-ink-bridge/index.md`.

Source branch: `feature/pi-ink-bridge-02-install-client`. Base branch: `master`.
Frozen base: `997d05ccf6daf98fd9c49b69129636790e808a22`.
Frozen source commit: `e7f90b0b5b6233c3fb21b33b3924633115d32d6c`.
Frozen source tree: `c1526ae02dc828ab1a75ac479e7a4c3b782edc21`.

## Scope

Reviewed `git diff 997d05ccf6daf98fd9c49b69129636790e808a22...e7f90b0b5b6233c3fb21b33b3924633115d32d6c`, not only the framing fix. The diff names 339 files. Product changes span the extension command and lifecycle, persistent service, verified installation, stable identity, release preservation, native transport, launcher, packaging, tests, dependencies, and README. Workflow changes record the approved execution history and acceptance. Historical evidence was assessed for current acceptance, not replayed as executable instructions.

Independent Standards and Spec agents ran in separate new OMP processes. Both completed analysis. Their assigned transport paths failed because `/home` is a symlink; retained temporary JSON supplied the analysis. The parent approved a canonical context for this final handoff. No second review body or workflow event was created by either axis agent.

Read `CONTEXT-MAP.md`, domain configuration, ADR index, and accepted ADR0001. `CONTEXT.md` does not exist. ADR0001 permits the trusted, exclusive operation model. Neither finding requires protection against a deliberately racing privileged process. It does not authorize this reviewer to access a device.

## Standards

### STD-001 — Low; hard testing-rule violation; NO ADR

Location: [production-install.test.ts lines42–45](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-ink-bridge-02-install-client/mise/conf.d/devtools-omp/extensions/image-annotator/test/production-install.test.ts#L42-L45).

Rule: parent initiative, Testing Decisions / External behaviour: “Do not test internal forwarding, copied data, source text, incidental defaults, or exact error wording.”

The firmware regression checks “Stock Xochitl does not match” and “Unsupported firmware”. A harmless diagnostic rewrite fails the tests without changing firmware rejection or installation safety. This is a test-maintenance defect. It is not a product wording defect or a request to change the messages.

Required change: delete production-prose assertions. Keep exit-status checks and the controlled `fixture-stock-check` assertions. They distinguish accepted firmware reaching the stock-binary guard from rejected firmware stopping earlier. Keep the firmware-boundary coverage.

Validation: a disposable copy changed only the two production diagnostics. `MISE_AUTO_INSTALL=0 mise exec bun@1.4.3 -- bun test test/production-install.test.ts` exited1: 0pass, 3fail. The supported case still emitted `fixture-stock-check`; rejected cases did not. The source checkout stayed unchanged.

No additional substantiated Standards violation or optional baseline smell was reported. Repository rules took precedence over smell heuristics. Tooling-enforced style was excluded.

## Spec

### SPEC-001 — P2; hard AC6 violation; NO ADR

Location: [production-install.sh lines23–25](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-ink-bridge-02-install-client/mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/production-install.sh#L23-L25).

Requirement: AC6, “Check model, tested firmware range, dependencies, and permissions before changes.”

Preflight checks `appload.so` and writable AppLoad and qt-resource-rebuilder directories. It does not check `/home/root/xovi/xovi.so` or `/home/root/xovi/extensions.d/qt-resource-rebuilder.so`. Leftover directories pass when either required native library is absent. The generated flow then invokes `install-client` and reports successful staging and restart instructions.

Consumer impact: a partially removed XOVI installation passes setup but lacks the native integration needed for sidebar launch. The successful approved device had those dependencies. That evidence does not cover this missing-dependency boundary.

Required change: check both required native libraries before extraction or persistent changes. Reject absent or non-regular dependencies with actionable repair instructions. Add a bounded regression that proves rejection before the install-client boundary.

Validation: an isolated Bubblewrap run used the unchanged production shell. Both missing libraries were absent. Only `appload.so` and writable integration directories existed. Real fixture ZIP and trust-record SHA-256 checks passed. A synthetic client executable wrote `INSTALLER_REACHED`. The shell exited0 and printed “Installation is staged. No process was restarted.”

The fixture replaced hardware metadata, root/architecture probes, and the stock-Xochitl hash check. The stock guard alone was controlled; archive and trust-record checks used real hashes. Network namespaces were isolated. The host root was read-only; only a private temporary home was writable. This proves the preflight bypass and success message, not execution of the native ARM64 installer. [INFERENCE] A real install reaches the persistent release/config/link writes documented in [installation.go lines109–194](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-ink-bridge-02-install-client/mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/installation.go#L109-L194).

Reproduction command after preparing those synthetic files (`SOURCE` is the extension directory):

```sh
bwrap --ro-bind / / --unshare-all --die-with-parent --dev /dev --tmpfs /tmp --ro-bind "$FIXTURE" /tmp/review --tmpfs /var/home --dir /var/home/root --bind "$FIXTURE/home" /home/root --tmpfs /sys/firmware --dir /sys/firmware/devicetree/base --ro-bind "$FIXTURE/model" /sys/firmware/devicetree/base/model --tmpfs /etc --ro-bind "$FIXTURE/os-release" /etc/os-release --setenv PATH /tmp/review/bin:/usr/bin:/bin --chdir /tmp/review/downloads sh "$SOURCE/tablet-client/production-install.sh" "$ZIP_SHA256" "$SERVER_SHA256"
```

All eight acceptance criteria were assessed. No other missing requirement, incorrect implementation, or scope creep was substantiated. Discovery, pairing, and annotation features belong to later tickets.

## Validation and coverage limits

The first two namespace setup attempts stopped before the installer: `/review` was under a read-only root, then `/etc/os-release` was a symlink. Correcting only the disposable mount layout allowed the single successful reproducer. Prior passing builds and suites were not rerun to confirm their reported results.

Existing durable evidence reviewed:

- **Host boundary:** `artifacts/evidence/host-20261108-install-001/verification.json` records concurrent extension startup, retained service identity, trusted/public surfaces, altered-download rejection, and isolated UI checks.
- **Native launch:** `events/start-complete-0057.json` and `artifacts/evidence/fixed-client-upgrade-0055/parent-native-owner-observation.json` record the owner opening once and reporting an available server after at least15seconds.
- **Binary identity:** `parent-native-verification-result.json` records PID8409, binary SHA-256 `433d53403a9d3568a00458fe9a02af33813cbdce0489b0b8602693f0ff135051`, UI7146, and boot `8e816d98-6bf4-4f9e-9abe-891fbf83d06f`.
- **Repeat preservation:** `artifacts/evidence/repeat-install-0058/acceptance-summary.json` and `preservation-verification.json` record one exit0 installation, 29 public hashes, 42 protected metadata records, 34 preservation records, 13 QMD names, and unchanged links.
- **Framing proof:** `artifacts/evidence/host-framing-fix-0046/compiled-cli-smoke.json` records four valid connection replies over real Unix packets and explicit termination. It is host proof, not native UI proof.

These paths are under `workflows/pi-ink-bridge-02-install-client` in the surviving base checkout. Implementation0059 and product completion0061 establish their current acceptance. Superseded BLOCKED statements remain historical, not new findings.

Production `state.json` was absent before and after repeat installation. Nonempty pairing preservation has host-fixture coverage only. No private records were read. No device, SSH, native launch, pairing, port47840 connection, service mutation, install, restart, reboot, or firmware operation occurred during review. Temporary reproduction files were removed after recording the results. No repository source, tests, tracker, projections, or commits were changed.

Standards: 1 hard finding; worst low-severity test-maintenance violation. Spec: 1 hard finding; worst P2 dependency-preflight defect. Final verdict: FAILURE for the frozen commit and tree only.

