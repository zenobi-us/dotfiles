# Offline cleanup reader — implementation-0029

Prepare a bounded identity reader for later owner-approved cleanup evidence.
Date: 2026-11-04. Reader: parent integrator and device owner.

## Overview

Approved offline slice completed. Full ticket and production remain **BLOCKED**; canonical work_status remains claimed. No device command, staging, config retrieval, permission repair, restart, cleanup deletion, source edit or commit occurred. This is not a formal SUCCESS review.

[Canonical ticket](../../../../tracker/tickets/pi-ink-bridge-01-pen-prototype.md) defines the full product scope. This result covers only the offline reader. [Frozen future device transaction](../evidence/offline-reader-0029/device-proposal.json) is a proposal, not authority.

## Reader and verification

The production executable accepts no arguments or runtime path/ownership/digest overrides. Both fixed markers must match before either config opens. All components use no-follow descriptor opens; reads are nonblocking, regular-file-only and capped. Final descriptor/path/metadata checks gate both config result rows. Config bytes are hashed in process, never parsed, printed or copied to evidence. Reads may update atime.

- **Source:** [Fixed production entry](../evidence/offline-reader-0029/main_linux.go), [Bounded reader engine](../evidence/offline-reader-0029/reader_linux.go).
- **Host-only support:** [Refusal and boundary tests](../evidence/offline-reader-0029/main_linux_test.go), [Separate synthetic smoke executable](../evidence/offline-reader-0029/host_fixture_linux.go). Never deploy the host harness.
- **Build evidence:** [Reproducible offline validation driver](../evidence/offline-reader-0029/verify.py), [Observed test/build/smoke output](../evidence/offline-reader-0029/validation.json), [Frozen file digest index](../evidence/offline-reader-0029/sha256-index.json).
- **Validation command:** python3 verify.py from the resolved offline-reader-0029 directory. One final format/test/build/smoke pass returned OFFLINE_TEST_BUILD_SMOKE_PASS_NO_DEVICE_EXECUTION.
- **Observed results:** Host tests passed. Static Linux amd64 and ARM64 builds passed. Separate synthetic host executable returned both expected digests without fixture bytes. Production rejected --fixture=/unapproved with exit1 and fixed REFUSAL ARGUMENTS. ELF inspection confirmed static AArch64 and no interpreter segment.
- **Covered boundaries:** Every variable ancestor/target root and all four leaves reject symlinks. Tests cover wrong UID/GID policy, directory/file mode, missing/oversized leaves, FIFO/directory/socket leaves, both marker mismatches before configs, exact caps and observed identity/metadata changes. Host ownership tests use real fstat against mismatched policy, not privileged chown.

ARM64 binary: reader-linux-arm64, 2489186 bytes, SHA256 03016b9c35aeecd82362fe34e4187037a7ee5ebf76014fd7df2f6264aca228d6. This is not device compatibility evidence.

## Device and ticket gates

The new reserved helper directory is /home/root/pi-ink-offline-reader-0029. Its vacancy is required but unobserved. Exclusive descriptor-safe staging must refuse any existing object. Helper staging, one guarded invocation and helper-only removal need NEW exact owner approval. A proven safe staging/removal executor and identity-preserving execution handoff remain missing prerequisites. The frozen transport/argv contract is not permission to run a naked pathname command.

Both actual device config hashes remain absent. No irreversible final cleanup program was built. Preserve opaque state, interrupted state temporaries, ownership markers, unknown files, source, documents and all earlier evidence. Partial implementation0026 remains open and is not finalized. No restart, fallback, retry, general inventory or private config value retrieval is permitted.

## Receipt and review history

[Parent start-0028](../../events/start-0028.yaml) reserves this child result. [Blocked phase-result implementation-0029](../../events/implementation-0029.yaml) records slice_status completed and device_execution false. Parent independently verifies, owns integration/commits and reserved start-complete-0030; the child does not write that completion.

Source remains branch prototype/pi-ink-bridge-01-pen-prototype, commit bb5df500f4a06c61ebde6073470ef5ed51f4b006, tree 9a9acbfbc65d17f87eb44f2e0a7898000b1d735b. Only BASE workflow artifacts/views changed. No formal review verdict exists; no findings were declared resolved by a reviewer; merge/push/ticket completion were not performed.

- **Retained receipt:** [start-0001](../../events/start-0001.yaml)
- **Retained receipt:** [start-complete-0003](../../events/start-complete-0003.yaml)
- **Retained receipt:** [start-0004](../../events/start-0004.yaml)
- **Retained receipt:** [implementation-0005](../../events/implementation-0005.yaml)
- **Retained receipt:** [start-complete-0006](../../events/start-complete-0006.yaml)
- **Retained receipt:** [start-0007](../../events/start-0007.yaml)
- **Retained receipt:** [implementation-0008](../../events/implementation-0008.yaml)
- **Retained receipt:** [start-complete-0009](../../events/start-complete-0009.yaml)
- **Retained receipt:** [start-0010](../../events/start-0010.yaml)
- **Retained receipt:** [implementation-0011](../../events/implementation-0011.yaml)
- **Retained receipt:** [start-complete-0012](../../events/start-complete-0012.yaml)
- **Retained receipt:** [start-0013](../../events/start-0013.yaml)
- **Retained receipt:** [implementation-0014](../../events/implementation-0014.yaml)
- **Retained receipt:** [start-complete-0015](../../events/start-complete-0015.yaml)
- **Retained receipt:** [start-0016](../../events/start-0016.yaml)
- **Retained receipt:** [implementation-0017](../../events/implementation-0017.yaml)
- **Retained receipt:** [start-complete-0018](../../events/start-complete-0018.yaml)
- **Retained receipt:** [start-0019](../../events/start-0019.yaml)
- **Retained receipt:** [start-complete-0021](../../events/start-complete-0021.yaml)
- **Retained receipt:** [start-0022](../../events/start-0022.yaml)
- **Retained receipt:** [implementation-0023](../../events/implementation-0023.yaml)
- **Retained receipt:** [start-complete-0024](../../events/start-complete-0024.yaml)
- **Retained receipt:** [start-0025](../../events/start-0025.yaml)
- **Retained receipt:** [start-0028](../../events/start-0028.yaml)

[Exact session, store, scope and limit observations](../evidence/offline-reader-0029/scope-observations.json) records the new child session identity. Earlier product implementation0023 was already reconciled by0024 and was not repeated.
