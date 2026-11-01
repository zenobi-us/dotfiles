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

Prove one source-image-to-pen-to-PNG workflow on a real Paper Pro before production implementation. Use temporary code to answer the pen-quality and firmware-compatibility questions. This ticket records a decision, not a production client.

Follow the parent initiative specification. Keep its scope limits and approved integration seam. Hardware checks require a real Paper Pro and its owner for device-only actions.

## Acceptance criteria

1. Open the temporary client through the proposed sidebar integration on a real Paper Pro. Record the device model, firmware, AppLoad version, XOVI version, and desktop dependencies.
2. Transfer a known source image to the device, draw with the real pen, and return a flattened PNG to the originating Pi/OMP request. Compare marked pixels and source dimensions to detect alignment errors.
3. Observe pen latency and palm handling during drawing. Record whether they are usable, the observed limits, and the evidence that supports the decision. AppLoad launch alone does not pass this gate.
4. Check source-image coordinates through display scaling and orientation changes. Keep source pixels separate from editable strokes.
5. Record a tested firmware range. Do not claim support for an untested firmware version.
6. Keep the findings and required decisions. Remove temporary code. If the approach fails, record the blocker and obtain a specification decision before production implementation starts.

## Comments

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
