# Minimal bootstrap review 0040

- Ticket: `tracker/tickets/pi-ink-bridge-01-pen-prototype.md`.
- Branches: source `master`; base `master`.
- Baseline: `029e232162273d8822fb2b151e98504c23bc152a`.
- Reviewed commit: `3bfd53b444b45b8ed63982bc7c8cba2ca5b53759`.
- Reviewed tree: `6f57775dc787ed48d6ccafd47d0d54a0902bac2b`.
- Review completion: `2026-11-04T22:46:11.038Z`.
- Scope: the new HTTP coordinator, downloadable client, and initial installer. This is a separate source review, not a takeover or phase transition for the preserved prototype workflow.
- Validation: build, typecheck, seven existing tests, shell syntax, and local HTTP/client/install/dry-run/quoting/lifecycle smoke passed. No tablet access or live harness restart ran.

Paths below are relative to `mise/conf.d/devtools-omp/extensions/image-annotator/`.

## Standards

**FAILURE.**

1. **Hard standards breach:** `coordinator.ts:52–92` nests the substantial `handleRequest` helper inside `createCoordinatorServer`, after its return statement. `iso-24495-code`, rule 2, requires helpers at module or class scope. Move the handler to module scope and pass `bundleDirectory` explicitly.
2. **Heuristic — duplicated validation drift:** `tablet-client/install.sh:51–56` accepts any whitespace-free `http://?*` or `https://?*` string. It saves that value at line 40 and reports installation success at line 43. However, `tablet-client/main.go:153–155` rejects credentials, queries, and fragments. For example, `http://desktop:47840/?x=1` passes installation but cannot serve as the installed client URL. The provisioning script repeats the permissive shell validation. Align these rules before creating the install directory.

No isolation breach was found. The coordinator allowlists `/health` and two fixed bundle files. It receives no image state and does not forward requests to the token-protected editor server.

This was a static review. It does not independently establish hardware behavior.

## Spec

**SUCCESS. No scope findings.**

| User requirement | Committed implementation |
| --- | --- |
| Local HTTP coordinator in the OMP extension | `coordinator.ts:16–93` implements health and bundle routes. `index.ts:105–130` manages server startup and shutdown. The existing extension name stays unchanged. |
| Minimal tablet bundle served by HTTP | `tablet-client/build.sh:12–27` builds and packages a Linux ARM64 client, installer, and version file. `coordinator.ts:67–90` serves the bundle and checksum. `tablet-client/main.go:30–132` provides status and download commands. |
| Extension-owned SSH provisioning and installation | `scripts/provision-tablet.sh:38–63` fetches, checks, and transfers the bundle through SSH. `tablet-client/install.sh:31–45` creates a new installation and refuses an existing path. |

No requested part is missing within this scope. No material scope expansion was found. No incorrect implementation was found on the Spec axis. The existing editor stays separate. No annotation UI, process detector, pairing, or daemon was added.

The parent supplied runtime evidence. This review does not close the older blocked prototype ticket.

## Verdict

**FAILURE for this source commit.** Standards: 2 findings; the hard breach is the nested handler. Spec: 0 findings. Preserve this report and run a fresh review after the fixes.

