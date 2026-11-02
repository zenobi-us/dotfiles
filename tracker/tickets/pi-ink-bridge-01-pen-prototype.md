---
schema: tracker-ticket/v1
id: pi-ink-bridge-01-pen-prototype
title: "Prove Paper Pro pen input"
parent: pi-ink-bridge
sequence: 1
type: task
triage: ready-for-agent
work_status: claimed
blocked_by: []
---

## What to build

Prove one client/server-to-stock-editor-to-PNG workflow on a real Paper Pro. Build only the temporary integration needed to test pairing, local document storage, server associations, and an editor toolbar. The user performs normal tablet drawing operations. Do not build or replace a drawing app.

This ticket records a prototype and its findings, not a complete production client. Keep the parent initiative requirements for authenticated LAN transfer, request isolation, explicit Send, cancellation, browser availability, and the completed PNG result. Use its approved integration seam. Hardware checks require a real Paper Pro and its owner.

### Revised responsibilities

- **Client and server:** Pair tablets with servers, authenticate connections, and transport source images, PDFs, and completed annotations. Use the same client/server connection for content and status.
- **Tablet client:** Save received files, create local folders, and persist document/folder associations with stable server and job identities. Keep associations independent of the active conversation or a mutable display name.
- **Tablet app:** Facilitate pairing and visually associate local folders with paired servers. Show the server identity, connection state, and relevant document/job status.
- **Normal tablet editor:** Let the user find, open, draw on, and save documents through normal tablet operations. Leave pen input, erasing, undo, zoom, and editable drawing data to that editor.
- **Custom editor toolbar:** Identify the current image or PDF, show its bound server and submission status, and provide explicit Send through the tablet client. The toolbar is not a drawing surface.

### Prototype sequence

1. Pair the tablet with a desktop server and associate a local folder with that server through the tablet app.
2. Receive a known source image or image-backed PDF through the authenticated client/server connection. Save it locally with its server and job association.
3. Let the user locate and open the document through normal tablet operations, then draw and save with the stock editor. Do not require automatic document opening.
4. Use the editor toolbar to resolve the current document and display its association and status. Saving remains separate from Send.
5. Select Send to obtain output that includes the visible pen marks and upload it to the bound server. Return a flattened PNG to the originating Pi/OMP request at the source dimensions.

### Scope limits and integration checks

- **No custom drawing:** Do not implement stroke capture, rendering, erasing, undo, pan, or zoom. Verify that the toolbar does not disrupt normal drawing.
- **No editor automation prerequisite:** Do not make a private Xochitl import/open/export automation service or the USB web interface a prerequisite for this model. Do not continue the USB-address or localhost probes as the implementation path.
- **Normal-use transport:** Use the authenticated LAN client/server connection without SSH or USB. SSH remains limited to cable-connected installation and repair. Preserve the parent WebSocket and HTTPS transport contract.
- **Document visibility:** Prove that received files are available through normal tablet operations. A filesystem folder is not automatically a folder in the stock document library. Record the actual integration instead of assuming equivalence.
- **Annotated output:** Prove how the toolbar obtains the current visible annotation through the normal editor capabilities. Stock pen marks can be separate from the original PDF. Uploading an unchanged source file does not satisfy Send.
- **Safe document access:** Do not modify private notebook files while Xochitl runs. Keep the original source and editable annotation data recoverable through the normal editor. Do not silently change cloud or account settings.
- **Optional destination choice:** Evaluate sending to another paired server as an optional toolbar action, not a prerequisite. Require an explicit destination choice. Do not silently change the original server/job association or deliver to an unrelated active request.

## Acceptance criteria

1. On a real Paper Pro, demonstrate tablet-app access to pairing and visual folder-to-server associations. Record the device model, firmware, desktop dependencies, and AppLoad/XOVI versions if used. Record any restart and lifecycle limits.
2. Receive and save a known source through authenticated LAN transfer with USB disconnected and without runtime SSH. Demonstrate that normal tablet operations can find and open it. Preserve its source dimensions and stable document/server/job association.
3. Draw and save with the normal tablet editor. Observe pen latency and palm handling with the custom toolbar present. Record the owner verdict and any interference. Do not claim a quality-gate pass from launch or transport alone.
4. Demonstrate the custom toolbar in the current editing document. Show the bound server, connection state, and submission status. Switch documents and verify that the displayed association follows the document. If no association exists, show that state instead of selecting an unrelated server or job.
5. Save or close the document without completing the Pi/OMP request. Select Send explicitly and return a flattened PNG containing the actual annotation to the originating request through the same authenticated client/server transport. Distinguish local save, server acceptance, and agent delivery.
6. Compare source dimensions and marked pixels. Check image edges, display scaling, and orientation using normal editor controls. Confirm that Send obtains the visible pen marks rather than the original source alone. Preserve editable work in the normal editor.
7. Verify that current-document resolution and server/job associations prevent wrong-server or wrong-request submission. Preserve terminal cancellation. If alternate-server Send is prototyped, require an explicit choice and retain the original association.
8. Record only the tested firmware boundary. Preserve the earlier failed experiments and all evidence. Record unresolved document-visibility, toolbar-context, annotated-output, and lifecycle questions. Remove temporary code after the experiment. Keep dependent production work blocked until the revised quality gate passes.

## Comments

### Revised client, folders, and editor toolbar approach — 2026-11-02

The user requested this revised model: use the client/server for pairing and transport; use the tablet client for local files, folders, and server associations; use the tablet app for pairing and visual folder associations; and add an editor toolbar for Send and status. The user performs normal tablet drawing operations. No replacement drawing program is required. Alternate-server Send is a possible optional extension.

The current What to build and Acceptance criteria now describe this model. This direction supersedes the earlier custom drawing prototype and the assumption that automated Xochitl import/open/export through the USB web interface must be solved first. The failed USB-interface test remains valid evidence about that tested interface, not a blocker for every implementation of the revised model.

Two integration facts still need proof: received files must be available through normal tablet operations, and toolbar Send must obtain the actual visible annotation. The toolbar must also resolve the current document and its server/job association. Do not treat these as already implemented.

This update changes only this ticket. It does not change its ID, title, parent, claim, triage, dependencies, earlier comments, or evidence. It does not mark the prototype complete or clear production blockers.

### Independent cable-free diagnostic review — 2026-11-02

**Ticket:** `tracker/tickets/pi-ink-bridge-01-pen-prototype.md`. **Branch:** `master`. **Reviewed HEAD and baseline:** `def4cedd8aac6590172b3ac1a82a47fe2be9760f`. **Timestamp:** `2026-11-01T23:20:13.173Z` (UTC).

**Scope:** Committed changes since the baseline (empty), staged changes (empty), unstaged tracker updates, and the three JSON evidence files under `workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/stock-editor-cable-free-001/`. No permanent source changes.

#### Review history

The first independent Standards and Spec reviews requested two corrections. The update inserted the new experiment comment inside an earlier review paragraph as well as under the actual Comments heading. It also overstated all disconnected listing errors as `no route to host`, although the first selected listing timed out. Both defects were corrected. Two fresh independent sessions reviewed the corrected worktree. The earlier reviews and failed experiments remain intact.

#### Standards

**Verdict:** PASS. Findings: 0 documented-standard breaches; 0 actionable possible-smell findings.

Both previous defects are corrected. The new experiment heading occurs once. The earlier review and all subsequent text match baseline `def4cedd8aac6590172b3ac1a82a47fe2be9760f` through mq. Both tails produce SHA-256 `851058a05383414b45bb0c0a4d491e25509d2ffb8bf6e3c33a4605663b255599`.

The samples record a timeout for the first disconnected listing attempt. Later selected listing attempts report `no route to host`. The ticket, initiative, and findings now distinguish these outcomes.

The scoped changes follow `docs/agents/issue-tracker.md`. Experiment updates sit under the Comments heading, and the ticket retains `work_status: claimed`. Production blockers and prior quality-gate failures remain intact.

The three evidence files are internally consistent. Selected disconnected reports show both USB controllers not attached, no USB IPv4 address, and continued LAN reporting. Selected export and synthetic-import attempts report `no route to host`; loopback attempts report connection refusal. Restoration records successful remote Stop, an inactive unit, and removal of temporary files.

No credentials, document titles, PDF payloads, or private document-store contents appear in the inspected evidence. LAN addresses and document identifiers remain visible. Diagnostic HTTPS polling is temporary, not a replacement production transport. Findings limit conclusions to the tested endpoints and firmware.

Only selected reports remain. The 116-report aggregate, authentication checks, recorded build/test results, and device cleanup cannot be independently re-established from those samples alone. This review checked consistency, not device state.

#### Spec

**Evidence verdict:** PASS. The follow-on cable-free diagnostic request is satisfied. No new specification findings or scope creep were found.

Both record corrections are verified. The ticket tail starting at the earlier stock-editor review matches the baseline byte-for-byte through mq and cmp. The new experiment heading occurs once. Findings, ticket, and initiative distinguish the initial listing timeout from later selected routing errors.

Sequence 1 establishes connected HTTP 200 listing/export. Sequence 103 shows both USB controllers detached, no 10.11.99.1 address, a listing timeout, export routing failure, and continued Wi-Fi reporting. Sequence 108 records the LAN-commanded import failure. Sequence 116 confirms continued disconnected reporting.

The retained totals report 116 samples, including 14 disconnected samples. Only selected reports remain. They support the failure modes but do not independently reproduce every aggregate count.

The restoration record reports `REMOTE_STOP_ACCEPTED`, successful inactive service state, removed temporary files, active Xochitl/rm-sync, and an unchanged stock binary. This review did not independently inspect the tablet. The conclusion applies only to the tested endpoints on firmware 3.28.0.172. It does not establish that every Xochitl integration is impossible.

**Implementation acceptance:** NOT PASSED. The completed diagnostic does not complete the ticket or approve production.

The initiative requires: “Normal use must not require SSH, a USB connection, or manual file transfers.” Outbound LAN reporting passes this diagnostic. Safe cable-independent document import/export remains blocked.

Ticket criteria still require sidebar integration, observation of pen latency and palm handling, and source-coordinate checks through display scaling and orientation changes. The research also requires explicit Send, draft-save separation, cancellation, and document ownership checks. This diagnostic does not satisfy those requirements or clear the earlier quality-gate failure. Keep the ticket claimed and all production blockers.

#### Review validation

All four review sessions were read-only. They ran no tests, builds, lint, formatters, edits, commits, or device commands. Execution validation appears in the findings: the ARM64 build and Go vet passed; the existing annotation suite passed 7 tests with 39 assertions and 0 failures.

**Review counts:** Two initial record defects were corrected. Final Standards: 0 findings. Final Spec: 0 new diagnostic findings; implementation acceptance remains not passed.

### Autonomous cable-free document test — 2026-11-02

**Result:** Outbound authenticated LAN communication works without USB or SSH. The existing USB-bound Xochitl document interface fails without USB on firmware 3.28.0.172. This resolves the earlier inconclusive transport check for these endpoints, not for every possible stock-editor integration. Keep `work_status: claimed` and all production blockers.

**Evidence:** [Findings](../../workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/stock-editor-cable-free-001/findings.json) and [selected raw reports](../../workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/stock-editor-cable-free-001/samples.json). The selected reports preserve the connected baseline, first disconnected sample, explicit import result, and final sample. Repeated reports are omitted.

The user confirmed that SSH works only while USB is connected. The existing claim and approved scoped takeover remain unchanged. Cable-connected SSH installed a temporary ARM64 background process and private server trust. After installation, the tablet fetched commands and sent reports through certificate-verified, authenticated HTTPS over Wi-Fi. No SSH command ran during the cable-free test. No sidebar app was needed. This polling control belongs only to the diagnostic probe, not the production WebSocket protocol.

The desktop received 116 reports: 102 with USB configured and 14 with both USB controllers not attached. All disconnected reports arrived from the tablet Wi-Fi address. The connected baseline returned HTTP 200 for the document list and known-document PDF export. After USB removal, the tablet lost 10.11.99.1. All 14 disconnected listing and export attempts failed. The first selected listing attempt timed out while awaiting headers; later selected listing attempts reported `no route to host`. The selected export attempts reported `no route to host`. The localhost document endpoint returned `connection refused`. A single synthetic PDF import, commanded over the LAN after disconnection, also failed with `no route to host`. Recorded status 0 means no HTTP response, not an HTTP code.

The desktop then sent Stop over the LAN. The user reconnected USB only for cleanup verification, after all results were already on the desktop. The journal confirmed `REMOTE_STOP_ACCEPTED`; the unit was inactive with a successful result; its temporary directory was absent. Xochitl and rm-sync remained active. The stock binary hash was unchanged. No binary patch, network-setting change, private document-store access, account change, or new renderer was attempted. The original annotated document remains.

The ARM64 build and Go vet passed. The full existing annotation suite passed: 7 tests, 0 failures, 39 assertions across 2 files. No permanent source or tests were added.

**Decision:** Establish a safe cable-independent on-tablet import/export interface before the stock-editor adapter or sidebar job client proceeds. Preserve the existing no-SSH normal-use contract. Programmatic opening, tablet Send, production ownership, cancellation, recovery, and the pen-quality acceptance limits remain unresolved.

### Independent stock-editor review — 2026-11-02

**Ticket:** `tracker/tickets/pi-ink-bridge-01-pen-prototype.md`. **Branch:** `master`. **Reviewed HEAD:** `3c901287fd8029bb2e469d5b050e82ffb4d374fe`. **Baseline:** `91f23fbc98e99d5bc2288ff5e7e98ce7147fcd30`. **Timestamp:** `2026-11-01T22:29:50.639Z` (UTC).

**Scope:** Committed approval changes since the baseline, staged changes (empty), unstaged tracker findings, and all ten files in `workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/stock-editor-round-trip-001/`. No permanent source changes. Two independent review sessions inspected the worktree.

#### Standards

**Verdict:** PASS. Count: 0 documented-standard breaches; 0 actionable possible-smell findings.

The ticket follows `docs/agents/issue-tracker.md`: it records updates under `## Comments` and retains `work_status: claimed`. The initiative records the experiment without declaring production completion.

The changes preserve the earlier failed experiment and its blockers. They distinguish the successful manual annotation round trip from unverified normal-use API availability and programmatic opening. The cable logs support the stated inconclusive result: they show no disconnected HTTP outcome.

The inspected PNGs contain a synthetic grid; the result adds visible handwriting. All three PDF hashes match `findings.json`. PDF inspection reports one 800 × 1000 page per file, without JavaScript or metadata streams. The annotated PDF has no embedded files or extractable text.

No credentials appeared in the inspected evidence. `restoration.json` records removal of temporary code, credentials, and services. This review did not independently inspect the tablet or verify that cleanup.

The reviewer applied the Fowler baseline as possible smells, not hard violations: Mysterious Name, Duplicated Code, Feature Envy, Data Clumps, Primitive Obsession, Repeated Switches, Shotgun Surgery, Divergent Change, Speculative Generality, Message Chains, Middle Man, and Refused Bequest. No actionable smell applies to this evidence-only change. No permanent source changes require refactoring. Truthful implementation limits are not standards failures.

#### Spec

**Evidence verdict:** SUCCESS for a truthful, partial feasibility result. **Implementation acceptance:** NOT PASSED.

The evidence supports stock import, manual opening, real annotated export, and an 800 × 1000 PNG. The inspected PNG contains handwriting. The recorded comparison identifies 2,259 changed pixels against the unmarked export. It does not establish a completed adapter.

Five acceptance limits remain:

1. **Drawing quality:** Ticket criterion 3 requires: “Observe pen latency and palm handling during drawing.” Research also requires: “Check latency, palm handling, erasing, undo, zoom, and source alignment.” No explicit owner verdict or corresponding observations establish these checks. Selecting Send does not establish stock drawing performance.
2. **Client integration:** Criterion 1 requires: “Open the temporary client through the proposed sidebar integration on a real Paper Pro.” The approval states: “the AppLoad client manages jobs and explicit Send.” AppLoad was not loaded; opening used the stock document list. Chat-authorized export proves explicit experimental consent, not a sidebar client or tablet Send implementation.
3. **Cable-independent operation:** The initiative requires: “Normal use must not require SSH, a USB connection, or manual file transfers.” SSH invoked temporary commands. Cable-free probes produced no usable disconnected HTTP result. Safe programmatic opening also remains unverified. These are prerequisites, not proof that cable-free operation is impossible.
4. **Geometry:** Criterion 4 requires: “Check source-image coordinates through display scaling and orientation changes.” Research requires: “Check margins, page rotation, and marks near the image edges.” Matching dimensions and page bounds establish only partial evidence. Edge, scaling, and orientation checks remain open.
5. **Request semantics:** Research requires: “Verify that a draft save does not complete the request” and “Check cancellation, document ownership, and any cloud participation before expanding the experiment.” Manual orchestration does not prove adapter ownership, cancellation, or recovery. Actual cloud receipt remains unknown; permission covered only the synthetic PDF.

No scope creep or incorrect implementation claim was found. Cleanup, retained prior failures, firmware limits, and production blockers are stated correctly. Keep the ticket claimed and production blocked.

#### Review validation

Both reviews were read-only. Neither reviewer ran tests, builds, lint, formatters, edits, commits, or device commands. The execution session ran the existing annotation suite: 7 tests passed, 0 failed, 39 assertions across 2 files. The reviewers did not rerun it.

**Review counts:** Standards: 0 findings. Spec: 5 acceptance limits. The evidence record passes review; the adapter does not pass implementation acceptance.


### Stock editor round trip — 2026-11-02

**Result:** The stock-editor feasibility experiment imported the synthetic PDF and returned a real annotated PNG. This is not an implemented adapter or a quality-gate pass. Keep `work_status: claimed` and all production blockers.

**Evidence:** [Findings](../../workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/stock-editor-round-trip-001/findings.json), [annotated PNG](../../workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/stock-editor-round-trip-001/result.png), [annotated PDF](../../workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/stock-editor-round-trip-001/result.pdf), and [cleanup](../../workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/stock-editor-round-trip-001/restoration.json).

The tablet downloaded the generated image-backed PDF over authenticated, certificate-verified LAN HTTPS. Its existing Xochitl upload endpoint returned HTTP 201. The user opened the document manually in the normal document list. After drawing and closing it, the user explicitly selected Send in this conversation. Xochitl exported the annotation, and the tablet uploaded the PDF over authenticated LAN HTTPS. The rendered result has 800 × 1000 pixels. It differs from the unmarked exported baseline at 2,259 pixels. Source and export page bounds both remain [0, 0, 800, 1000]. The visible marks are not near the image edges.

The first export had no pen marks. It remains as the unmarked comparison baseline, not annotated proof. No private document-store files were accessed. The user permitted only the synthetic test document to enter existing cloud synchronization. Actual cloud receipt was not checked.

**Unresolved prerequisites:** Establish a cable-independent local document API and a safe document-opening interface. Implement the sidebar job manager and tablet Send action only after these prerequisites pass. The tested stock HTTP listener used the USB address. Cable-free checks were inconclusive because the probes did not obtain a disconnected HTTP sample. One probe observed removal of the USB address but could not find curl. The final probe used a verified absolute curl path but recorded no disconnected sample. Do not describe these limits as proof that cable-free export is impossible.

SSH provisioned and invoked the temporary probe. Source and result bytes used LAN HTTPS. This does not prove normal operation without SSH or USB, production request isolation, cancellation, or saved-draft recovery. The user did not give an explicit latency or palm-handling verdict. Erasing, undo, zoom, edge alignment, and orientation remain unverified. Only firmware 3.28.0.172 was exercised.

The existing annotation extension suite passed: 7 tests, 0 failures, 39 assertions across 2 files. No permanent source or tests were added. Temporary code, credentials, and services were removed. Xochitl and rm-sync remain active. The stock binary hash is unchanged. The annotated stock document remains on the tablet. AppLoad is not enabled; this experiment used the stock document list.


### Xochitl experiment takeover — 2026-11-02

The user approved this session to take over this ticket for the first option in the latency research. Keep the existing failed experiment and all production blockers. Use the stock Xochitl editor, not a new drawing program. Prove safe local PDF import, document opening, and annotated export before production work.

The workflow inspector reported unknown ownership and an archived prototype branch without a checked-out worktree. Herdr lists this implementation session and an unrelated report session in this repository. No active pen-prototype session was identified. Preserve the archive branch and all previous evidence. Retain `work_status: claimed`.

The user permits a generated alignment PDF to synchronize to the tablet account. Keep account and synchronization settings unchanged. Do not transfer project content during this experiment.


### Independent two-axis review — 2026-11-01

**Verdict:** SUCCESS for the accuracy and scope of this failed experiment. This verdict does not pass the hardware quality gate or approve production. The ticket remains claimed.

**Review target:** Prototype snapshot `d17c0898f2219b3097f6a4e37bafd430f4c53b89` on `prototype/pi-ink-bridge-01-pen-prototype`. Current branch: `master`, HEAD `2f55982a6bea2e5bb57b8ce4aca91ad5edb1f590`, plus scoped working-tree findings, untracked run-002 evidence, and source deletions. Base: `36cec71d9964147ca65246d8c3cf1c29471b7990`. Both reviewers ran in independent sessions. They reviewed committed and pending changes. They excluded unrelated commits.

#### Standards

No blocking standards findings apply to the proposed result. Source headers identify temporary code and explain relevant constraints. The small programs avoid production frameworks and speculative interfaces. Direct HTTP callbacks and local socket state are reasonable for this disposable experiment. No actionable Fowler smell requires changing the archived experiment.

The source deletions must be committed with the evidence before removal becomes the committed branch state. The archive branch resolves to the stated source commit.

The inspected images contain the synthetic grid and red ink. The JSON contains stroke coordinates, versions, hashes, and qualified findings. No credentials or crash dumps appeared in the scoped evidence. The restoration record reports SIGSEGV without retaining a dump.

The findings fail the quality gate and block production. Owner reports support the latency, palm, and client Scale/Rotate observations. They do not establish calibrated latency or a supported firmware range.

**Standards verdict:** SUCCESS. No blocking findings. The cleanup commit remains required.

#### Spec

No false implementation-success claim or unjustified production approval was found. This is a truthful failed experiment, not a completed feature.

Three acceptance limits remain:

- **Sidebar evidence:** Criterion 1 requires opening the client through the proposed sidebar integration. AppLoad execution is established. The session directed sidebar launch, but retained artifacts do not independently prove that route. Do not treat the manifest alone as proof.
- **Integration seam:** The approved seam is extension submission through the real service and tablet protocol to the returned image. The temporary server and returned PNG prove the experiment's path, not the production extension/protocol seam. That seam remains unverified.
- **Quality gate:** The parent requires usable pen latency and palm handling. Palm handling passed the owner's check. Latency failed. Controlled shutdown also produced SIGSEGV. Builds and pixel checks do not clear these blockers.

Criterion 6 requires a specification decision before production starts if the approach fails. The ticket records that requirement and remains claimed. Only firmware `3.28.0.172` was exercised. Source pixels and strokes remain separate. Client Scale/Rotate checks do not claim system-orientation verification. The source snapshot is local and unpushed.

**Spec verdict:** SUCCESS for the recorded failed experiment. Three acceptance limits remain; the failed quality gate blocks production.

#### Review validation

Both reviewers inspected the specifications, scoped diffs, archived source, images, JSON evidence, and restoration record. They ran no builds, tests, formatters, lint, or device commands. The execution checks appear in the hardware result above.

**Review count:** Standards: 0 blocking findings. Spec: 3 acceptance limits. Pen latency and unsafe teardown remain the quality blockers.


### Hardware prototype result — 2026-11-01

**Result:** The pen-quality gate failed. The owner reported that pen latency is not usable. Production work remains blocked. The ticket stays claimed and is not complete.

The native pen path returned real annotated PNGs to this Pi/OMP conversation. The owner reported no palm problems. The owner also confirmed alignment with the client Scale and Rotate controls. System orientation lock remained unchanged.

| Check | Observation |
| --- | --- |
| First native round trip | 800 × 1000 PNG; 209 pen samples; 1,904 changed pixels. |
| Second native round trip | 800 × 1000 PNG; 583 pen samples; 2,857 changed pixels. Export view: 70% scale and 90° rotation. |
| Pixel correspondence | Every saved pen sample has matching ink nearby. Source pixels remain unchanged outside the red ink. |
| Pen latency | The owner reported that latency is not usable. No calibrated millisecond measurement was made. |
| Palm handling | The owner reported no unwanted strokes or drawing interruption. |
| Existing browser regression suite | 7 tests passed; 0 failed; 39 assertions across 2 files. |

#### Tested versions

Only Paper Pro firmware `3.28.0.172` was exercised. The Qt runtime is `6.10.3`. AppLoad declares `0.5.1` in its installed ELF metadata. The XOVI file hash matches the published `v0.3.3` aarch64 release asset. No firmware range passed the full quality gate.

The desktop used Go `1.25.0`, Bun `1.4.3`, and Qt resource compiler `6.11.2` with resource format 1. The tablet used curl `8.11.0`. The evidence records exact extension hashes and pen axis ranges.

#### Findings

- **Native input:** The QML-only pointer path did not capture usable pen movement. A native AppLoad backend read `Elan marker input` without taking exclusive control of the device. Touch input did not enter that stroke stream.
- **PNG export:** Qt `6.10.3` resolved the resource-based Canvas save path to an empty local filename. The probe serialized the actual canvas PNG and used a tested ARM64 writer instead.
- **Latency limit:** The QML Canvas and per-event AppLoad message path did not pass the owner's pen-quality check. The timing bottleneck was not profiled. Do not claim that a different renderer will solve it without another hardware check.
- **Startup failures:** The first isolated runtime omitted the required hashtab file and crashed. A later launch also crashed. The final probe used a separate temporary UI service with automatic restoration of the original service.
- **Teardown failure:** Controlled shutdown produced `11/SEGV` while AppLoad unloaded the client and backend. The exact cause remains unknown. The stop action restored the original Xochitl service successfully.

#### Evidence and primary source

- **First round trip:** [Source, result, strokes, and acceptance summary](../../workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/pen-round-trip-001/).
- **Second round trip:** [Transformed result, strokes, versions, and restoration](../../workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/pen-round-trip-002/).
- **Prototype source:** Local branch `prototype/pi-ink-bridge-01-pen-prototype`, commit `d17c0898f2219b3097f6a4e37bafd430f4c53b89`. The source is under `mise/conf.d/devtools-omp/extensions/image-annotator/pi-ink-bridge-pen-prototype` in that snapshot. The branch has not been pushed.
- **Verification:** Desktop and ARM64 builds passed. Go vet passed for the server, native backend, and PNG writer. A throwaway check compared returned pixels with the real pen coordinates. No permanent geometry test suite was added.

#### Restoration and decision required

The original Xochitl service is active without XOVI or AppLoad loaded. The temporary tablet app, runtime directory, and UI unit are removed. No prototype backend remains. The original extension hashes are unchanged. The desktop HTTPS service is stopped. Temporary source is removed from the current branch and preserved in the prototype snapshot.

Keep dependent production tickets blocked. Obtain a specification decision before production starts. The next decision must address a lower-latency drawing path and safe AppLoad teardown. Do not treat this failed prototype as a supported firmware contract or a completed production implementation.


The user approved changing only the ticket type from prototype to task so the workflow inspector can execute it. The prototype scope and acceptance criteria are unchanged. This session claims the previously unclaimed ticket. Inspection found no prior implementation receipts or source workspace for this ticket. The related commit contains only the original tracker records. The other active repository session is working on pi-shared-context-ux-08-prototypes, not this ticket.

The user approved this ticket and its direct blockers during initiative decomposition.
