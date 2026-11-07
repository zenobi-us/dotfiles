# Current implementation reconciliation — 0052/0053

Exact source: `8cc3cb89c7aa50ea0862a83763edc0a339d69eb9`, tree `25872168b7dff239a95e876827916b77c3b41001`. [Implementation result](../events/implementation-0052.yaml) and [parent reconciliation](../events/start-complete-0053.yaml) supersede the historical current-state claims below. No earlier receipts or failed experiments were rewritten.

- [Current source/deployment provenance](../artifacts/evidence/ticket-01-closeout-0115/source-reconciliation.json).
- [Fresh tested build record](../artifacts/evidence/ticket-01-closeout-0115/build-version-reconciliation.json): client0.3.1; XOVI/AppLoad fingerprints match retained tested builds after tripletap installation.
- [Actual native result](../artifacts/evidence/tablet-activation-0054/native-send-0101-outcome.json): source-sized marked PNG reached the real originating tool; B stayed pending.
- [Native cancellation](../artifacts/evidence/tablet-activation-0054/native-terminal-cancellation-0112.json): real cancelled tool, Send disabled after reopen, editable work retained.
- [Owner-authorized retention](../artifacts/evidence/ticket-01-closeout-0115/ticket-amendment-result.json) and [future owned maintenance/removal](../artifacts/evidence/ticket-01-closeout-0115/retained-maintenance-removal-plan.json). No restoration or device cleanup claimed.
- [Acceptance matrix](../artifacts/evidence/ticket-01-closeout-0115/acceptance-matrix.json). Formal independent review and merge/publication remain pending. Production belongs to tickets02–10.

## Historical projection retained verbatim

# Offline cleanup reader — implementation-0029

Prepare a bounded identity reader for later owner-approved cleanup evidence.
Date: 2026-11-04. Reader: parent integrator and device owner.

## Overview

Approved offline slice completed. Full ticket and production remain **BLOCKED**; canonical work_status remains claimed. No device command, staging, config retrieval, permission repair, restart, cleanup deletion, source edit or commit occurred. This is not a formal SUCCESS review.

[Canonical ticket](../../../tracker/tickets/pi-ink-bridge-01-pen-prototype.md) defines the full product scope. This result covers only the offline reader. [Frozen future device transaction](../artifacts/evidence/offline-reader-0029/device-proposal.json) is a proposal, not authority.

## Reader and verification

The production executable accepts no arguments or runtime path/ownership/digest overrides. Both fixed markers must match before either config opens. All components use no-follow descriptor opens; reads are nonblocking, regular-file-only and capped. Final descriptor/path/metadata checks gate both config result rows. Config bytes are hashed in process, never parsed, printed or copied to evidence. Reads may update atime.

- **Source:** [Fixed production entry](../artifacts/evidence/offline-reader-0029/main_linux.go), [Bounded reader engine](../artifacts/evidence/offline-reader-0029/reader_linux.go).
- **Host-only support:** [Refusal and boundary tests](../artifacts/evidence/offline-reader-0029/main_linux_test.go), [Separate synthetic smoke executable](../artifacts/evidence/offline-reader-0029/host_fixture_linux.go). Never deploy the host harness.
- **Build evidence:** [Reproducible offline validation driver](../artifacts/evidence/offline-reader-0029/verify.py), [Observed test/build/smoke output](../artifacts/evidence/offline-reader-0029/validation.json), [Frozen file digest index](../artifacts/evidence/offline-reader-0029/sha256-index.json).
- **Validation command:** python3 verify.py from the resolved offline-reader-0029 directory. One final format/test/build/smoke pass returned OFFLINE_TEST_BUILD_SMOKE_PASS_NO_DEVICE_EXECUTION.
- **Observed results:** Host tests passed. Static Linux amd64 and ARM64 builds passed. Separate synthetic host executable returned both expected digests without fixture bytes. Production rejected --fixture=/unapproved with exit1 and fixed REFUSAL ARGUMENTS. ELF inspection confirmed static AArch64 and no interpreter segment.
- **Covered boundaries:** Every variable ancestor/target root and all four leaves reject symlinks. Tests cover wrong UID/GID policy, directory/file mode, missing/oversized leaves, FIFO/directory/socket leaves, both marker mismatches before configs, exact caps and observed identity/metadata changes. Host ownership tests use real fstat against mismatched policy, not privileged chown.

ARM64 binary: reader-linux-arm64, 2489186 bytes, SHA256 03016b9c35aeecd82362fe34e4187037a7ee5ebf76014fd7df2f6264aca228d6. This is not device compatibility evidence.

## Device and ticket gates

The new reserved helper directory is /home/root/pi-ink-offline-reader-0029. Its vacancy is required but unobserved. Exclusive descriptor-safe staging must refuse any existing object. Helper staging, one guarded invocation and helper-only removal need NEW exact owner approval. A proven safe staging/removal executor and identity-preserving execution handoff remain missing prerequisites. The frozen transport/argv contract is not permission to run a naked pathname command.

Both actual device config hashes remain absent. No irreversible final cleanup program was built. Preserve opaque state, interrupted state temporaries, ownership markers, unknown files, source, documents and all earlier evidence. Partial implementation0026 remains open and is not finalized. No restart, fallback, retry, general inventory or private config value retrieval is permitted.

## Receipt and review history

[Parent start-0028](../events/start-0028.yaml) reserves this child result. [Blocked phase-result implementation-0029](../events/implementation-0029.yaml) records slice_status completed and device_execution false. Parent independently verifies, owns integration/commits and reserved start-complete-0030; the child does not write that completion.

Source remains branch prototype/pi-ink-bridge-01-pen-prototype, commit bb5df500f4a06c61ebde6073470ef5ed51f4b006, tree 9a9acbfbc65d17f87eb44f2e0a7898000b1d735b. Only BASE workflow artifacts/views changed. No formal review verdict exists; no findings were declared resolved by a reviewer; merge/push/ticket completion were not performed.

- **Retained receipt:** [start-0001](../events/start-0001.yaml)
- **Retained receipt:** [start-complete-0003](../events/start-complete-0003.yaml)
- **Retained receipt:** [start-0004](../events/start-0004.yaml)
- **Retained receipt:** [implementation-0005](../events/implementation-0005.yaml)
- **Retained receipt:** [start-complete-0006](../events/start-complete-0006.yaml)
- **Retained receipt:** [start-0007](../events/start-0007.yaml)
- **Retained receipt:** [implementation-0008](../events/implementation-0008.yaml)
- **Retained receipt:** [start-complete-0009](../events/start-complete-0009.yaml)
- **Retained receipt:** [start-0010](../events/start-0010.yaml)
- **Retained receipt:** [implementation-0011](../events/implementation-0011.yaml)
- **Retained receipt:** [start-complete-0012](../events/start-complete-0012.yaml)
- **Retained receipt:** [start-0013](../events/start-0013.yaml)
- **Retained receipt:** [implementation-0014](../events/implementation-0014.yaml)
- **Retained receipt:** [start-complete-0015](../events/start-complete-0015.yaml)
- **Retained receipt:** [start-0016](../events/start-0016.yaml)
- **Retained receipt:** [implementation-0017](../events/implementation-0017.yaml)
- **Retained receipt:** [start-complete-0018](../events/start-complete-0018.yaml)
- **Retained receipt:** [start-0019](../events/start-0019.yaml)
- **Retained receipt:** [start-complete-0021](../events/start-complete-0021.yaml)
- **Retained receipt:** [start-0022](../events/start-0022.yaml)
- **Retained receipt:** [implementation-0023](../events/implementation-0023.yaml)
- **Retained receipt:** [start-complete-0024](../events/start-complete-0024.yaml)
- **Retained receipt:** [start-0025](../events/start-0025.yaml)
- **Retained receipt:** [start-0028](../events/start-0028.yaml)

[Exact session, store, scope and limit observations](../artifacts/evidence/offline-reader-0029/scope-observations.json) records the new child session identity. Earlier product implementation0023 was already reconciled by0024 and was not repeated.

## Historical implementation log retained verbatim

Earlier entries remain historical, not newly verified device facts.

# Implementation history

- [implementation-0005](../events/implementation-0005.yaml) — phase-result, blocked, source `564c037546911f6e26936383b63eab9129819b97`.
- [implementation-0008](../events/implementation-0008.yaml) — phase-result, blocked, source `564c037546911f6e26936383b63eab9129819b97`.
- [implementation-0011](../events/implementation-0011.yaml) — phase-result, failed, source `564c037546911f6e26936383b63eab9129819b97`.
- [implementation-0014](../events/implementation-0014.yaml) — phase-result, blocked, source `564c037546911f6e26936383b63eab9129819b97`.
- [implementation-0017](../events/implementation-0017.yaml) — phase-result, blocked, source `ff9ec2a2f5aedbf804ad8cce7c8843ec95f25456`.
- [implementation-0023](../events/implementation-0023.yaml) — phase-result, completed, source `bb5df500f4a06c61ebde6073470ef5ed51f4b006`.
- [start-0001](../events/start-0001.yaml) — phase-start, started, source `d17c0898f2219b3097f6a4e37bafd430f4c53b89`.
- [start-0004](../events/start-0004.yaml) — phase-start, started, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-0007](../events/start-0007.yaml) — phase-start, started, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-0010](../events/start-0010.yaml) — phase-start, started, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-0013](../events/start-0013.yaml) — phase-start, started, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-0016](../events/start-0016.yaml) — phase-start, started, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-0019](../events/start-0019.yaml) — phase-start, started, source `ff9ec2a2f5aedbf804ad8cce7c8843ec95f25456`.
- [start-0022](../events/start-0022.yaml) — phase-start, started, source `4614293693e7973722a6a470a761e563221a7c28`.
- [start-complete-0003](../events/start-complete-0003.yaml) — phase-complete, blocked, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-complete-0006](../events/start-complete-0006.yaml) — phase-complete, blocked, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-complete-0009](../events/start-complete-0009.yaml) — phase-complete, blocked, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-complete-0012](../events/start-complete-0012.yaml) — phase-complete, failed, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-complete-0015](../events/start-complete-0015.yaml) — phase-complete, blocked, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-complete-0018](../events/start-complete-0018.yaml) — phase-complete, blocked, source `ff9ec2a2f5aedbf804ad8cce7c8843ec95f25456`.
- [start-complete-0021](../events/start-complete-0021.yaml) — phase-complete, blocked, source `4614293693e7973722a6a470a761e563221a7c28`.

## Phase details

### implementation-0005

```json
{
  "implementation_summary": "No supported end-to-end stock document interface was established in the inspected resources. No speculative adapter, alternate drawing app, or excluded device probe was added. This is a blocked implementation result, not proof that every integration is impossible.",
  "changed_files": [
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/stock-editor-attempt-002/findings.json",
    "workflows/pi-ink-bridge-01-pen-prototype/events/implementation-0005.yaml",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/snapshots/pr-draft-implementation-0005.md",
    "workflows/pi-ink-bridge-01-pen-prototype/manifest.yaml",
    "workflows/pi-ink-bridge-01-pen-prototype/projections/pr-draft.md",
    "workflows/pi-ink-bridge-01-pen-prototype/projections/implementation-log.md",
    "workflows/pi-ink-bridge-01-pen-prototype/projections/latest-status.yaml"
  ],
  "validation": [
    {
      "command": "mise exec -- bun install --no-save && mise exec -- bun run build",
      "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype/mise/conf.d/devtools-omp/extensions/image-annotator",
      "exit_code": 0,
      "result": "449 installs checked; no dependency changes. Vite 7.3.6 built 2371 modules. Upstream use-client and chunk-size warnings remain."
    },
    {
      "command": "mise exec -- bun test mise/conf.d/devtools-omp/extensions/image-annotator/test",
      "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype",
      "exit_code": 0,
      "result": "7 pass; 0 fail; 39 assertions across 2 files."
    },
    {
      "command": "mise exec -- bun -e (inline createAnnotationServer smoke with two real HTTP servers and preserved synthetic PNG fixtures)",
      "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype",
      "exit_code": 0,
      "result": {
        "page": 200,
        "unauthorized": 404,
        "cross_request_token": 404,
        "source_matches": true,
        "deliveries_before_send": [
          0,
          0
        ],
        "send": 200,
        "deliveries_after_send": [
          1,
          0
        ],
        "returned_bytes_match": true,
        "request_name": "request-0.png"
      },
      "scope": "Existing loopback HTTP backend only. Replayed preserved stock-editor-round-trip-001 source.png/result.png. No new tablet, LAN HTTPS/WebSocket, pairing, drawing, or export proof."
    },
    {
      "command": "records.ts check --repository /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles --ticket pi-ink-bridge-01-pen-prototype",
      "exit_code": 0,
      "result": "tracker-ticket/v1 valid; claimed; no direct blockers; downstream production tickets remain waiting."
    },
    {
      "command": "inspect.ts tracker/tickets/pi-ink-bridge-01-pen-prototype.md --json (from base, before result)",
      "exit_code": 0,
      "result": "historyValid=true; unique clean source matches parent commit/tree. The active child uses start-0004 approval; no duplicate implementer launched."
    }
  ],
  "open_questions": [
    {
      "id": "stock-library-access",
      "description": "The inspected interfaces do not establish safe registration of a received image/PDF and a server folder in the normal stock library. A filesystem folder or image sticker is not that registration.",
      "required_evidence": "A safe stock operation on the tested firmware that accepts the received synthetic source and yields a stable document/folder identity visible through normal tablet operations."
    },
    {
      "id": "current-document-output",
      "description": "The community QMD has hashed current-document navigation and toolbar insertion. It does not establish authoritative document identity through switches or a full annotated export with source geometry.",
      "required_evidence": "A firmware-specific editor interface that binds Send to the current document, saves visible marks, and returns the full annotated document without private live notebook access, USB-web prerequisites, runtime SSH, or cloud transport."
    },
    {
      "id": "owner-hardware-gate",
      "description": "No revised toolbar/client is installed. This session has no owner-operated device observations or verdict.",
      "required_evidence": "After the integration prerequisites are established, the owner must perform the acceptance sequence in the immutable draft. Builds, HTTP replay, and protocol peers cannot supply this verdict."
    }
  ]
}
```

### implementation-0008

```json
{
  "implementation_summary": "Read-only installed firmware inspection recovered native importFromUrls and createCollection signatures, stock current-document binding and integration-target export callsites. No safe local annotated-export initiation contract or runtime accessibility proof established. No source implementation, device mutation or acceptance pass claimed.",
  "changed_files": [
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0008/native-interfaces.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0008/findings.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/snapshots/pr-draft-implementation-0008.md",
    "workflows/pi-ink-bridge-01-pen-prototype/events/implementation-0008.yaml",
    "workflows/pi-ink-bridge-01-pen-prototype/manifest.yaml",
    "workflows/pi-ink-bridge-01-pen-prototype/projections/pr-draft.md",
    "workflows/pi-ink-bridge-01-pen-prototype/projections/implementation-log.md",
    "workflows/pi-ink-bridge-01-pen-prototype/projections/latest-status.yaml"
  ],
  "validation": [
    {
      "command": "inspect.ts tracker/tickets/pi-ink-bridge-01-pen-prototype.md --json",
      "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles",
      "exit_code": 0,
      "result": "historyValid=true; unique clean source at 564c0375 / 57df0dbb; current start-0007 dispatch uses recorded scoped approval."
    },
    {
      "command": "timeout 15 ssh -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=yes root@10.11.99.1 'printf \"READ_ONLY_FIRMWARE\\n\"; cat /etc/os-release; command -v xochitl'",
      "exit_code": 0,
      "output": "Codex Linux 5.8.203 (scarthgap); IMG_VERSION=\"3.28.0.172\"; /usr/bin/xochitl"
    },
    {
      "command": "timeout 25 ssh ... root@10.11.99.1 'sha256sum /usr/bin/xochitl; stat -c \"%s %n\" /usr/bin/xochitl; find /usr/share/remarkable /usr/lib /opt /home/root/xovi -maxdepth 3 -type f (resource filters)'",
      "exit_code": 1,
      "output": "xochitl sha256 b1816408cf90b19e448c70082625c4d6a36060368706eb7a9b35425428a9a021; size 24705704; XOVI hashtab and bluetooth.rcc found. Missing search roots produced exit 1; SSH and binary reads succeeded.",
      "note": "Ellipsis and resource filters summarize the command; transcript retains the exact invocation."
    },
    {
      "command": "timeout 40 scp -O -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=yes root@10.11.99.1:/usr/bin/xochitl /tmp/pi-ink-0008-xochitl && timeout 20 scp -O -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=yes root@10.11.99.1:/home/root/xovi/exthome/qt-resource-rebuilder/hashtab /tmp/pi-ink-0008-hashtab && file /tmp/pi-ink-0008-xochitl /tmp/pi-ink-0008-hashtab",
      "exit_code": 0,
      "output": "ELF 64-bit ARM aarch64, stripped, BuildID aae326b4f843a6672b1aee940bfb2736dacdbb2a; hashtab data."
    },
    {
      "command": "readelf -SW /tmp/pi-ink-0008-xochitl",
      "exit_code": 0,
      "output": ".rodata offset 0xca4700 size 0x85dfb8; .data.rel.ro offset 0x175d530; .data offset 0x1766260; 31 section headers."
    },
    {
      "command": "Offline Python eval: decode hashtab >QI length records; decode Qt revision-13 metadata and zstd QML with ctypes libzstd",
      "exit_code": 0,
      "output": "20299 hash records; 867 zstd magic occurrences; 624 QML payload candidates including plain payloads; native-interfaces.json retains only needed method tables and QML excerpts."
    },
    {
      "command": "timeout 20 ssh ... root@10.11.99.1 'find /home/root/xovi ... -printf ...; find /opt ... -printf ...; sha256sum ...'",
      "exit_code": 0,
      "output": "BusyBox find rejects -printf. Final sha256sum succeeded. Corrected read-only -print command follows.",
      "note": "Shell aggregate status 0 does not mean both find calls succeeded."
    },
    {
      "command": "timeout 20 ssh -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=yes root@10.11.99.1 'find /home/root/xovi -maxdepth 2 -type f ! -name \"*.log\" ! -name \"hashtab\" -print; find /opt -maxdepth 3 -type f -name \"*appload*\" -print'",
      "exit_code": 1,
      "output": "XOVI xovi.so, start/stock, extensions.d/appload.so, qt-resource-rebuilder.so, qt-command-executor.so, xovi-message-broker.so, literm.so and fix-ebook-links.so present; /opt absent."
    },
    {
      "command": "timeout 15 ssh -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=yes root@10.11.99.1 'cat /home/root/xovi/start /home/root/xovi/stock; sha256sum /home/root/xovi/xovi.so /home/root/xovi/extensions.d/qt-resource-rebuilder.so /home/root/xovi/extensions.d/appload.so'",
      "exit_code": 0,
      "output": "Read scripts only; start adds LD_PRELOAD service overrides and restarts configured services; stock removes overrides and restarts. Neither executed. XOVI sha256 d4df820c25c634c511de11067279d8310fa4f656dc52bd4540db6beac4ffd446; rebuilder 6726f561557406f36347e43fc2b44a88deef4fb273d2ece88f48f427dad8800f; AppLoad 5b2dd6c066da6932d88a1d62be1068ca5ba751f481636dd51f727221db62e3ad."
    },
    {
      "command": "herdr agent get w6E:p3",
      "exit_code": 0,
      "result": "Fresh omp session 01a19bf2-0098-73c8-a1de-9b39f904a27e in source worktree; no descendants launched."
    }
  ],
  "open_questions": [
    {
      "id": "stock-library-access",
      "description": "Native importFromUrls and createCollection signatures found in installed firmware. Runtime access, returned identities, successful synthetic receipt and normal library visibility remain unproven."
    },
    {
      "id": "current-document-output",
      "description": "Stock root.document binding and current-document export callsite recovered. Safe local export initiation, annotation flush ordering, dimensions, live ownership and cancellation remain unproven."
    },
    {
      "id": "owner-hardware-gate",
      "description": "No revised client or toolbar installed. All owner-operated LAN, pen, palm, geometry, isolation, save/Send and editable-work gates remain unpassed."
    }
  ]
}
```

### implementation-0011

```json
{
  "implementation_summary": "ARM64 build and named extension install/hash check succeeded. Device lacks timeout. The first load-restart wrapper failed before systemctl ran. Trap removed probe but its restart wrapper also failed. A host-bounded recovery command then restarted only xochitl once and verified full restoration. No probe execution or runtime accessibility proof.",
  "changed_files": [
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0011/build.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0011/execution.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0011/restoration.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0011/findings.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0011/cleanup.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0011/validation.json",
    "workflows/pi-ink-bridge-01-pen-prototype/events/implementation-0011.yaml",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/snapshots/pr-draft-implementation-0011.md",
    "workflows/pi-ink-bridge-01-pen-prototype/manifest.yaml",
    "workflows/pi-ink-bridge-01-pen-prototype/projections/pr-draft.md",
    "workflows/pi-ink-bridge-01-pen-prototype/projections/implementation-log.md",
    "workflows/pi-ink-bridge-01-pen-prototype/projections/latest-status.yaml"
  ],
  "validation": [
    {
      "command": "BASE shared-context resolve workflow/evidence/ticket and inspect canonical ticket --json",
      "result": "Passed. Independently resolved repository stores; historyValid=true; clean unique frozen source. Parent dispatch owns orchestration."
    },
    {
      "command": "podman run --rm --network none -v /tmp/pi-ink-0011:/build:Z -w /build docker.io/eeems/remarkable-toolchain:latest-rmpp bash -c 'source /opt/codex/*/*/environment-setup-* && qmake probe.pro && make -j2'",
      "exit_code": 0,
      "result": "ELF 64-bit LSB shared object, ARM aarch64, dynamically linked; BuildID 759ffbdead1bc33d717f76db275bb27b05bc2e97"
    },
    {
      "command": "file, readelf -d and --dyn-syms, sha256sum temporary probe; installed Qt library-name inspection",
      "exit_code": 0,
      "result": "ARM64, XOVI exports, Qt_6.10; installed Qt 6.10.3. Source reviewed locally; no native operations/document values in probe."
    },
    {
      "command": "python /tmp/pi-ink-0011/run-probe.py (SSH deployment script retained in execution.json)",
      "exit_code": 91,
      "result": "Installed only named probe; verified its hash. Missing target timeout blocked both restart wrappers. Trap removed probe. No runtime metadata collected."
    },
    {
      "command": "Host timeout 45 SSH: confirm probe absent; systemctl restart xochitl; sleep 8; is-active and allowlisted baseline hash/listing checks",
      "exit_code": 0,
      "result": "Mandatory restoration completed: active; probe absent; stock/extensions/config hashes unchanged."
    },
    {
      "command": "Read-only final cable SSH metadata snapshot, compared byte-for-byte with pre-install snapshot",
      "exit_code": 0,
      "result": "Equal. See restoration.json exact final command/output."
    },
    {
      "command": "rm -rf /tmp/pi-ink-0011 && podman rmi docker.io/eeems/remarkable-toolchain:latest-rmpp",
      "exit_code": 0,
      "result": "Disposable host source, binaries, build payloads and newly pulled toolchain image removed."
    }
  ],
  "open_questions": [
    {
      "id": "probe-runtime-access",
      "description": "Renewed scoped approval and saved/closed-document confirmation are needed for another install/load-restart/remove/rollback-restart cycle. Use host-side command deadlines; do not assume target timeout exists."
    },
    {
      "id": "current-document-output",
      "description": "unknown; prior static signatures require registered navigation destinations, not local output paths. No import/export invocation authorized or performed."
    },
    {
      "id": "owner-hardware-gate",
      "description": "No pairing, authenticated LAN transfer, stock library receipt, marked PNG, dimensions, editable-work preservation, save/Send, cancellation, request isolation, pen quality, palm, edge or orientation acceptance passed."
    }
  ]
}
```

### implementation-0014

```json
{
  "implementation_summary": "Bounded real Paper Pro experiment proved private loopback stock service plus authenticated cable-free annotated PDF export and one synthetic import. Owner reports normal-library visibility/open and preserved editable marks. Expanded actual PDF geometry fails source-dimension PNG acceptance; no pairing/folder/current-document toolbar or originating Pi/OMP integration implemented. Temporary code removed; original pre-existing proxy restored exactly by explicit owner choice; complete baseline verified. Full ticket remains claimed and production blocked.",
  "changed_files": [
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/activation.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/adapter-build.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/adapter-hashes.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/approval.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/baseline-fingerprints.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/baseline.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/cable-free-outcome.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/cable-reseat.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/cleanup-cable-blocker.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/cleanup.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/client-ready.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/client-start.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/device-cleanup-after-reseat.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/device-cleanup.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/endpoint-verification-corrected.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/endpoint-verification.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/explicit-send.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/findings.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/geometry-limit.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/listener-attribution.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/native-page.png",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/native-render.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/owner-observations.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/payload-hashes.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/pdf-render.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/preflight-gates.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/preinstall-baseline.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/quarantine.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/receiver-smoke.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/restoration-baseline.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/restoration-comparison.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/restoration-final.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/result.pdf",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/result.png",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/revised-approval-proposal.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/revised-approval.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/revised-precheck.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/staging.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/tablet-reports.jsonl",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/temporary-source-audit.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/tls-boundary-smoke.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/transport-build.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/upstream-assessment.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/validation.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/visible-marks.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/snapshots/pr-draft-implementation-0014.md",
    "workflows/pi-ink-bridge-01-pen-prototype/events/implementation-0014.yaml",
    "workflows/pi-ink-bridge-01-pen-prototype/manifest.yaml",
    "workflows/pi-ink-bridge-01-pen-prototype/projections/pr-draft.md",
    "workflows/pi-ink-bridge-01-pen-prototype/projections/implementation-log.md",
    "workflows/pi-ink-bridge-01-pen-prototype/projections/latest-status.yaml"
  ],
  "validation": [
    {
      "command": "Podman RMPP SDK make XOVI_REPO=/xovi -j2",
      "result": "passed",
      "evidence": "adapter-build.json"
    },
    {
      "command": "go build desktop; GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build tablet; go vet transport.go",
      "result": "passed",
      "evidence": "transport-build.json"
    },
    {
      "command": "Actual desktop LAN TLS source/control/result boundary probes",
      "result": "401 unauthenticated source/control; 200 pinned source; 409 wrong origin; untrusted cert rejected",
      "evidence": [
        "receiver-smoke.json",
        "tls-boundary-smoke.json"
      ]
    },
    {
      "command": "Approved cable setup load and loopback endpoint/listener checks",
      "result": "passed after unsupported journalctl --grep replaced with exact-marker output filter; one load restart",
      "evidence": [
        "activation.json",
        "endpoint-verification.json",
        "endpoint-verification-corrected.json"
      ]
    },
    {
      "command": "Owner explicit Send over WSS; actual local stock PDF export and authenticated HTTPS upload with USB disconnected",
      "result": "passed bounded export feasibility; actual annotated PDF 137198 bytes; no Pi/OMP tool completion",
      "evidence": [
        "explicit-send.json",
        "cable-free-outcome.json",
        "result.pdf",
        "native-page.png"
      ]
    },
    {
      "command": "pdfinfo -box actual export; native 72DPI render",
      "result": "geometry failed source-size gate: 960.076x1121.92 points; native PNG961x1122; forced800x1000 disqualified",
      "evidence": [
        "pdf-render.json",
        "geometry-limit.json",
        "native-render.json",
        "visible-marks.json"
      ]
    },
    {
      "command": "One authenticated synthetic transfer and tablet-local stock upload",
      "result": "HTTP201 with USB disconnected; owner reports library visible/opens and original annotations remain editable; UUID/folder/isolation not proved",
      "evidence": [
        "cable-free-outcome.json",
        "owner-observations.json"
      ]
    },
    {
      "command": "Exact branch A cleanup, final Xochitl restart and baseline comparison",
      "result": "passed after owner cable reseat; original proxy hash/metadata restored; stock/loader/extensions/config/listener set equal; temporary paths absent",
      "evidence": [
        "device-cleanup.json",
        "cleanup-cable-blocker.json",
        "cable-reseat.json",
        "device-cleanup-after-reseat.json",
        "restoration-baseline.json",
        "restoration-comparison.json",
        "restoration-final.json"
      ]
    },
    {
      "command": "Remove owned disposable source, runtime credentials, dependency clone, newly pulled toolchain image; stop receiver",
      "result": "passed",
      "evidence": "cleanup.json"
    },
    {
      "command": "git show -s --format='%H%n%T%n%D' HEAD && git status --porcelain && git ls-files -u",
      "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype",
      "result": "clean unchanged source; no unmerged paths; 564c037546911f6e26936383b63eab9129819b97 / 57df0dbb0fb91fa3da0716f1c3a62460906c96eb"
    }
  ],
  "open_questions": [
    {
      "id": "source-geometry",
      "description": "Annotated export expands MediaBox/CropBox to [-31.51,-121.92,928.57,1000]. Original source 800x1000. No accepted source-window mapping; forced scale is disqualified. Source-dimension aligned PNG gate remains blocked."
    },
    {
      "id": "document-folder-associations",
      "description": "Owner sees and opens synthetic import, but returned UUID/folder identity and upload destination isolation were not established. No server-associated stock folders or pairing UI implemented."
    },
    {
      "id": "current-document-toolbar",
      "description": "No editor toolbar or live current-document binding implemented. Fixed synthetic UUID in diagnostic config is not toolbar/current-document proof."
    },
    {
      "id": "origin-cancellation-delivery",
      "description": "Actual PDF accepted only for fixed diagnostic server/job; wrong-origin receiver request rejected. No originating Pi/OMP tool request integrated; production cancellation, document switching and wrong-server isolation untested."
    },
    {
      "id": "owner-quality-lifecycle",
      "description": "Owner confirms editable marks remain; no latency/palm/zoom/undo/erasing/orientation verdict with custom toolbar. Sleep, tablet reboot, firmware update and XOVI reactivation untested."
    }
  ]
}
```

### implementation-0017

```json
{
  "summary": "Implemented the real image_editor request-server/browser stock-PDF submission seam with source-bound visible out-of-bounds detection, per-export explicit clipping confirmation, exact source-sized delivery, durable full-PDF retention, stale/cancellation isolation, and preserved browser drawing state. Full tablet prototype acceptance remains blocked.",
  "changed_files": [
    "README.md",
    "bun.lock",
    "mise/conf.d/devtools-omp/extensions/image-annotator/index.ts",
    "mise/conf.d/devtools-omp/extensions/image-annotator/package.json",
    "mise/conf.d/devtools-omp/extensions/image-annotator/pdf-session.ts",
    "mise/conf.d/devtools-omp/extensions/image-annotator/pdf-worker.py",
    "mise/conf.d/devtools-omp/extensions/image-annotator/src/PdfImport.tsx",
    "mise/conf.d/devtools-omp/extensions/image-annotator/src/main.tsx",
    "mise/conf.d/devtools-omp/extensions/image-annotator/src/style.css",
    "mise/conf.d/devtools-omp/extensions/image-annotator/test/editing-session.test.ts",
    "mise/conf.d/devtools-omp/extensions/image-annotator/test/pdf-fixtures.py",
    "mise/conf.d/devtools-omp/extensions/image-annotator/test/pdf-samples.py",
    "mise/conf.d/devtools-omp/extensions/image-annotator/test/pdf-submission.test.ts",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/review-resolutions.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/isolated-final-tests.log",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/accepted-validation.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/accepted-tests.log",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/accepted-typecheck.log",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/accepted-build.log",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke-driver.ts",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/visibility-fixed-tests.log",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/review-fixed-validation.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/review-fixed-tests.log",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/review-fixed-typecheck.log",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/review-fixed-build.log",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/geometry-verification.log",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/spec-self-check.txt",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/standards-self-check.txt",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/session-identity.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/offline-dependency-result.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/offline-dependency-smoke.ts",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/output-verification.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/verify-output.py",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/validation-commands.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-tests.log",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-typecheck.log",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-build.log",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/browser-upload-errors.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/canonical-clipping-policy.mq-output.txt",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/smoke-process.log",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/initial-validation.log",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/png-delivered.webp",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/png-browser.webp",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/png-tool-result.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/png-delivered.png",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/retained-annotated.pdf",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/delivered.webp",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/png-url.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/pdf-tool-result.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/pdf-delivered.png",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/pdf-analysis.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/confirmation.webp",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/pdf-url.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/smoke-driver.ts",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/source.png",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/extract-source.py",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/source-identity.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/summary.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/owner-device-observation.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/source-commit.log",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/output-verification.log",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/output-verification.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/process.log",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/verify-output.py",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/retained-annotated.pdf",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/drawing-after.webp",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/drawing-before.webp",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/delivered.webp",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/png-tool-result.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/png-delivered.png",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/png-url.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/pdf-tool-result.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/pdf-delivered.png",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/pdf-analysis.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/confirmation.webp",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/pdf-url.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/source.png",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/link-validation.json",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/checksums.json",
    "workflows/pi-ink-bridge-01-pen-prototype/events/implementation-0017.yaml",
    "workflows/pi-ink-bridge-01-pen-prototype/artifacts/snapshots/pr-draft-implementation-0017.md",
    "workflows/pi-ink-bridge-01-pen-prototype/manifest.yaml",
    "workflows/pi-ink-bridge-01-pen-prototype/projections/pr-draft.md",
    "workflows/pi-ink-bridge-01-pen-prototype/projections/implementation-log.md",
    "workflows/pi-ink-bridge-01-pen-prototype/projections/latest-status.yaml"
  ],
  "validation": [
    {
      "command": "bun run build",
      "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype/mise/conf.d/devtools-omp/extensions/image-annotator",
      "result": "passed",
      "output": "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/accepted-build.log",
      "warnings": "Existing use-client directives and large chunks."
    },
    {
      "command": "bunx tsc --noEmit",
      "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype/mise/conf.d/devtools-omp/extensions/image-annotator",
      "result": "passed",
      "output": "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/accepted-typecheck.log"
    },
    {
      "command": "bun test test",
      "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype/mise/conf.d/devtools-omp/extensions/image-annotator",
      "result": "13 passed, 0 failed, 100 assertions",
      "output": "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/isolated-final-tests.log"
    },
    {
      "command": "bun final-smoke-driver.ts + managed Chromium UI interactions",
      "result": "Actual image_editor remained pending at clipping confirmation; explicit consent returned marked 800x1000 PNG. Ordinary marked PNG delivery and drawing preservation across PDF mode passed. Both tabs closed. Launcher only was intercepted; production request/PDF/consent/delivery code ran.",
      "output": "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/process.log"
    },
    {
      "command": "uv run --offline --script final-smoke/verify-output.py",
      "result": "800x1000; actual annotations differ from source; four 40x40 corners exact; full original retrieved after shutdown and matches SHA-256 fc49be15009fdf904eb4cd5edc82833b22cfeec40c656d90d5041a98a4ab42cf; ordinary PNG contains drawing after PDF-mode round trip.",
      "output": "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/final-smoke/output-verification.json"
    },
    {
      "command": "bun offline-dependency-smoke.ts with empty UV_CACHE_DIR",
      "result": "Explicit HTTP500 pinned-renderer dependency failure; no image delivered; uv network disabled.",
      "output": "workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0017/offline-dependency-result.json"
    }
  ],
  "open_questions": [
    "Real tablet pairing and authenticated LAN transport",
    "Stable stock-library folder/document/server/job association",
    "Live current-document resolution and editor toolbar Send",
    "Tablet wrong-document/wrong-server cancellation and isolation",
    "Owner pen/palm/zoom/undo/erasing/orientation verdict with toolbar and lifecycle tests",
    "Unsupported mappings are rejected rather than generalized; conservative uncertainty requires confirmation.",
    "Owner disabled auto-sleep after a sleep event. This is an unverified owner setting change, not lifecycle acceptance."
  ]
}
```

### implementation-0023

```json
{
  "implementation_summary": "Source-only latest native UI revision completed; hardware acceptance and restoration remain blocked. Global last-top-section/idempotent dynamic-width manager; document immediately above TOC with native compact foldout.",
  "changed_files": [
    "mise/conf.d/devtools-omp/extensions/image-annotator/tablet-qml/PiInkToolbar.qml",
    "mise/conf.d/devtools-omp/extensions/image-annotator/tablet-qml/pi-ink-bridge.qmd",
    "mise/conf.d/devtools-omp/extensions/image-annotator/tablet-qml/activation-proposal.json"
  ],
  "validation": [
    {
      "name": "build",
      "command": [
        "bun",
        "run",
        "build"
      ],
      "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype/mise/conf.d/devtools-omp/extensions/image-annotator",
      "exit_code": 0,
      "log": "build.log"
    },
    {
      "name": "typecheck",
      "command": [
        "bunx",
        "tsc",
        "--noEmit"
      ],
      "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype/mise/conf.d/devtools-omp/extensions/image-annotator",
      "exit_code": 0,
      "log": "typecheck.log"
    },
    {
      "name": "tests",
      "command": [
        "bun",
        "test",
        "test"
      ],
      "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype/mise/conf.d/devtools-omp/extensions/image-annotator",
      "exit_code": 0,
      "log": "tests.log"
    },
    {
      "name": "go-race",
      "command": [
        "go",
        "test",
        "-race",
        "./..."
      ],
      "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype/mise/conf.d/devtools-omp/extensions/image-annotator/tablet",
      "exit_code": 0,
      "log": "go-race.log"
    },
    {
      "name": "native-context QMLDiff",
      "result": "13 QMDs, all five native contexts passed; original12 hashes verified"
    },
    {
      "name": "Qt AST",
      "result": "component and five generated contexts passed"
    },
    {
      "name": "actual UI handler JavaScript",
      "result": "passed; offline only"
    }
  ],
  "open_questions": [
    "Private stock QML types cannot be instantiated with available SDK. Owner must verify native geometry, warning text, input, close and orientations under fresh exact device approval.",
    "Hardware association/Send acceptance remains blocked.",
    "Original proxy remains quarantined at last observation; original restoration#4 needs renewed saved/closed and USB confirmation. Credentials/experiment cleanup not complete."
  ]
}
```

### start-0001

```json
{
  "validation": [
    {
      "command": "records.ts check --repository /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles --ticket pi-ink-bridge-01-pen-prototype",
      "result": "passed; tracker-ticket/v1; no direct blockers"
    },
    {
      "command": "git status --short",
      "result": "clean before worktree creation"
    },
    {
      "command": "herdr worktree list --cwd /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles --json",
      "result": "only master checkout before recovery"
    },
    {
      "command": "wt switch prototype/pi-ink-bridge-01-pen-prototype --no-cd --format json",
      "result": "created existing-branch checkout without creating or resetting branch"
    }
  ]
}
```

### start-0004

```json
{
  "validation": [
    {
      "command": "records.ts check --repository /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles --ticket pi-ink-bridge-01-pen-prototype",
      "result": "passed; tracker-ticket/v1; no direct blockers"
    },
    {
      "command": "inspect.ts tracker/tickets/pi-ink-bridge-01-pen-prototype.md --json",
      "result": "historyValid=true; clean unique source; start takeover; requiredApproval=true"
    }
  ]
}
```

### start-0007

```json
{
  "validation": [
    {
      "command": "records.ts check --repository /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles --ticket pi-ink-bridge-01-pen-prototype",
      "result": "passed; tracker-ticket/v1; no direct blockers"
    },
    {
      "command": "inspect.ts tracker/tickets/pi-ink-bridge-01-pen-prototype.md --json",
      "result": "historyValid=true; clean unique source; start takeover; requiredApproval=true"
    }
  ]
}
```

### start-0010

```json
{
  "validation": [
    {
      "command": "records.ts check --repository /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles --ticket pi-ink-bridge-01-pen-prototype",
      "result": "passed; tracker-ticket/v1; no direct blockers"
    },
    {
      "command": "inspect.ts tracker/tickets/pi-ink-bridge-01-pen-prototype.md --json",
      "result": "historyValid=true; clean unique source; start takeover; requiredApproval=true"
    }
  ]
}
```

### start-0013

```json
{
  "validation": [
    {
      "command": "records.ts check --repository BASE --ticket pi-ink-bridge-01-pen-prototype",
      "result": "passed; tracker-ticket/v1; claimed; no direct blockers"
    },
    {
      "command": "inspect.ts canonical-ticket --json",
      "result": "start/takeover; requiredApproval=true; historyValid=true; unique clean source"
    }
  ]
}
```

### start-0016

```json
{
  "validation": [
    {
      "command": "inspect.ts canonical ticket --json",
      "result": "start/takeover; historyValid=true; clean unique unchanged source; parent start-complete-0015"
    },
    {
      "command": "records.ts check --ticket pi-ink-bridge-01-pen-prototype",
      "result": "passed; claimed; no direct blockers"
    }
  ]
}
```

### start-0019

```json
{
  "validation": [
    {
      "command": "inspect.ts canonical ticket --json",
      "result": "historyValid=true; start/takeover; clean unique source ff9ec2a2/tree93faf247; parent start-complete-0018"
    },
    {
      "command": "records.ts check --ticket pi-ink-bridge-01-pen-prototype",
      "result": "passed; claimed; no direct blockers"
    },
    {
      "command": "herdr agent list; coordinator reservation search",
      "result": "current parent retains ownership; no source implementer or matching goal reservations"
    }
  ]
}
```

### start-0022

```json
{
  "validation": [
    {
      "command": "inspect.ts canonical ticket --json after completion0021",
      "result": "historyValid=true; start/takeover; parent start-complete-0021; clean46142936/tree514e1d89"
    },
    {
      "command": "records.ts check --ticket pi-ink-bridge-01-pen-prototype",
      "result": "passed; claimed; no direct blockers"
    },
    {
      "command": "herdr agent list and previous session ending; coordinator reservation search",
      "result": "no source agent; old session normal exit; no matching goal reservations"
    }
  ]
}
```

### start-complete-0003

```json
{
  "validation": [
    {
      "command": "herdr agent wait w80:p1 --until done --until blocked; herdr agent get w80:p1",
      "result": "done; completion_seq 1567; fresh session 01a199e2-33c1-70d3-a2bc-b342f4e500ee"
    },
    {
      "command": "git show -s --format=%H,%T,%P cd02b747 564c0375",
      "result": "recorded source/tree and merge parents match; archived d17c0898 remains first parent of reconciliation merge"
    },
    {
      "command": "parent read implementation-0002, findings, snapshot and projections",
      "result": "blocked result and explicit acceptance gaps; no integration source added; immutable result retained in child checkout"
    },
    {
      "command": "child validation recorded in implementation-0002",
      "result": "7 tests pass with 39 assertions after asset build; real browser HTTP smoke returns matching PNG only after explicit Done; read-only installation preflight observes firmware 3.28.0.172. These do not prove tablet acceptance."
    },
    {
      "command": "base worktree inspect.ts before parent completion",
      "result": "historyValid true for base start receipt; source available/clean at 564c0375; child result absent from base workflow store. No duplicate launched."
    }
  ],
  "failure_reason": "Revised stock-library/current-document/annotated-output integration is unverified; hardware gate unexecuted. Child result exists in retained source checkout, but cross-worktree receipt validation rejects its repository and parent workflow.root. No successful implementation or review is asserted.",
  "result_missing": false
}
```

### start-complete-0006

```json
{
  "validation": [
    {
      "command": "herdr agent wait w6E:p2 --until done --until blocked --timeout 3600000",
      "result": "done; completion_seq 68; fresh child session 01a19b12-31f7-719e-aa62-e10958cfc418"
    },
    {
      "command": "Parent reads implementation-0005, findings.json, immutable draft and implementation log",
      "result": "Valid blocked result; matching source identity and bounded validation; no new tablet or firmware acceptance claimed."
    },
    {
      "command": "inspect.ts tracker/tickets/pi-ink-bridge-01-pen-prototype.md --json from canonical base",
      "result": "historyValid=true; unique clean source matches exact frozen commit/tree; start/reconcile selects parent completion."
    },
    {
      "command": "Child build, existing suite and real two-server HTTP smoke (recorded in implementation-0005)",
      "result": "Build passed; 7 tests passed with 39 assertions; loopback HTTP confirms token isolation and exact PNG delivery only after explicit submission. Not tablet acceptance."
    },
    {
      "command": "herdr pane close w6E:p2",
      "result": "ok; child pane closed; worktree/workspace preserved"
    }
  ],
  "failure_reason": "Inspected resources do not establish safe stock-library registration, authoritative current-document identity and full annotated export. No revised client/toolbar or owner-operated hardware acceptance. Implementation is not complete.",
  "result_missing": false
}
```

### start-complete-0009

```json
{
  "validation": [
    {
      "command": "Read implementation-0008, findings.json, native-interfaces.json and immutable draft",
      "result": "Matching exact unchanged source; native importFromUrls/createCollection metadata and stock DocumentView binding recovered from firmware 3.28.0.172; safe local export initiation remains unresolved. No source/device mutation or acceptance asserted."
    },
    {
      "command": "inspect.ts canonical ticket --json from base",
      "result": "historyValid=true; unique clean frozen source; start/reconcile selects parent completion."
    },
    {
      "command": "herdr agent wait/get and pane list",
      "result": "Wait returned agent_not_running; get agent_not_found; pane list retained stale idle agent identity. Reported inconsistency. No duplicate launched."
    },
    {
      "command": "Read final child session JSONL entries 202-204",
      "result": "Final blocked response and normal session_exit reason=dispose recorded at 2026-11-02T11:28:21.282Z; child commit tool output records 7c55e7c9."
    },
    {
      "command": "herdr pane close w6E:p3",
      "result": "ok; child pane closed; worktree/workspace preserved."
    },
    {
      "command": "mq okf_extract_links corrected snapshot",
      "result": "12 links; all relative targets exist. Appended corrected snapshot rather than changing immutable original with incorrect ../ links."
    },
    {
      "command": "Host-only temporary firmware-copy cleanup",
      "result": "/tmp/pi-ink-0008-xochitl and /tmp/pi-ink-0008-hashtab already absent. No device cleanup needed: no mutation performed."
    }
  ],
  "failure_reason": "Native signatures/context recovered statically; runtime accessibility and safe local annotated-export start contract remain unproved. Device metadata probe requires separate installation/restart approval.",
  "result_missing": false
}
```

### start-complete-0012

```json
{
  "validation": [
    {
      "command": "herdr agent wait w6G:p2 --until done --until blocked --timeout 3600000",
      "result": "done; completion_seq 95; child session 01a19c0f-dc6c-7633-a19b-b9544b2519fe"
    },
    {
      "command": "Read implementation-0011, execution.json, restoration.json and child output",
      "result": "Failed pre-load wrapper; no runtime probe. Build/install succeeded. Child workflow commit 050387d3; temporary build/source/image removed. Device restoration recorded."
    },
    {
      "command": "Compare restoration verification stdout FINAL_SNAPSHOT with recorded preinstall baseline",
      "result": "Exact byte equality; verification exit 0; xochitl active and probe absent; pre-existing extension/stock/config hashes/listing match; no cleanup remains."
    },
    {
      "command": "mq okf_extract_links immutable implementation-0011 snapshot",
      "result": "18 links; all relative targets exist."
    },
    {
      "command": "inspect.ts canonical ticket --json from base before completion",
      "result": "historyValid=true; unique unchanged clean source; start/reconcile selected."
    },
    {
      "command": "herdr pane close w6G:p2",
      "result": "ok; child pane closed; source worktree preserved."
    }
  ],
  "failure_reason": "Deployment script incorrectly assumed target timeout executable. Probe installed but load restart did not execute. Mandatory host-bounded recovery removed probe and restarted only xochitl once; full baseline restored. No runtime metadata collected.",
  "result_missing": false
}
```

### start-complete-0015

```json
{
  "validation": [
    {
      "command": "herdr agent wait w6H:p1 --until done --until blocked --timeout 3600000",
      "result": "done; completion_seq146; fresh session01a19ddf-460c-766e-aa9f-bf07b55eb945"
    },
    {
      "command": "Read child phase-result, immutable snapshot, cable-free outcome and restoration records",
      "result": "Valid blocked result; real disconnected export/import; all restoration comparisons true; final device command exit0, RESTORATION_COMPLETE; no cleanup remains"
    },
    {
      "command": "Visual inspection native-page.png",
      "result": "Red strokes on synthetic grid and beyond source boundary. Native961x1122; forced800x1000 diagnostic not accepted."
    },
    {
      "command": "mq okf_extract_links for immutable snapshot and generated Markdown projections; resolve from each actual parent directory",
      "result": [
        {
          "path": "workflows/pi-ink-bridge-01-pen-prototype/artifacts/snapshots/pr-draft-implementation-0014.md",
          "links": 64,
          "missing": []
        },
        {
          "path": "workflows/pi-ink-bridge-01-pen-prototype/projections/pr-draft.md",
          "links": 94,
          "missing": []
        },
        {
          "path": "workflows/pi-ink-bridge-01-pen-prototype/projections/implementation-log.md",
          "links": 37,
          "missing": []
        }
      ]
    },
    {
      "command": "inspect.ts canonical ticket --json before reconciliation",
      "result": "historyValid=true; start/reconcile; clean unchanged unique source commit564c0375/tree57df0dbb"
    },
    {
      "command": "herdr pane close w6H:p1",
      "result": "ok; source worktree and workspace preserved"
    }
  ],
  "failure_reason": "Full acceptance blocked: expanded exported page geometry; no accepted source-dimension PNG mapping, stable imported UUID/folder/destination isolation, pairing UI, current-document toolbar, originating Pi/OMP delivery or production cancellation proof; toolbar quality and lifecycle checks untested.",
  "result_missing": false
}
```

### start-complete-0018

```json
{
  "implementation_summary": "Actual image_editor request/browser stock-PDF import now detects all-color visible out-of-source paint, rejects unsupported source mapping, binds one-use clipping consent to request/source/export, preserves source-sized geometry/full PDF and cancellation/stale isolation. Manual browser import is not tablet toolbar integration.",
  "validation": [
    {
      "command": "herdr agent wait w6J:p2 --until done --until blocked --timeout3600000",
      "result": "done; completion_seq167; fresh session01a19e11-a946-724a-9610-96571998a017"
    },
    {
      "command": "Read immutable child result, snapshot, raw final tests, review resolutions and live output verification",
      "result": "Clipping slice complete. Build/typecheck passed;13 tests/100 assertions pass. Actual registered tool/browser workflow remained pending until consent, delivered800x1000 PNG, preserved exact corner regions and durable full PDF. Ordinary PNG/drawing-state preservation exercised."
    },
    {
      "command": "Verify all checksums.json entries against retained bytes",
      "result": {
        "files": 65,
        "mismatches": []
      }
    },
    {
      "command": "mq native Markdown link selectors with okf module; resolve from each artifact directory",
      "result": [
        {
          "ref": "workflows/pi-ink-bridge-01-pen-prototype/artifacts/snapshots/pr-draft-implementation-0017.md",
          "local_links": 37,
          "missing": []
        },
        {
          "ref": "workflows/pi-ink-bridge-01-pen-prototype/projections/pr-draft.md",
          "local_links": 133,
          "missing": []
        },
        {
          "ref": "workflows/pi-ink-bridge-01-pen-prototype/projections/implementation-log.md",
          "local_links": 61,
          "missing": []
        }
      ]
    },
    {
      "command": "Compare final-smoke retained PDF to device export implementation-0014/result.pdf",
      "result": "byte-identical SHA256fc49be15009fdf904eb4cd5edc82833b22cfeec40c656d90d5041a98a4ab42cf"
    },
    {
      "command": "inspect.ts canonical ticket --json before reconciliation",
      "result": "historyValid=true; start/reconcile; unique clean source ff9ec2a2/tree93faf247"
    },
    {
      "command": "herdr pane close w6J:p2",
      "result": "ok; existing source worktree retained"
    }
  ],
  "failure_reason": "Full ticket remains blocked on real tablet pairing/authenticated transport, stable stock-library folder/document/server/job association, current-document toolbar integration, tablet isolation and owner hardware/lifecycle acceptance.",
  "result_missing": false
}
```

### start-complete-0021

```json
{
  "validation": [
    {
      "command": "inspect.ts canonical ticket --json",
      "result": "historyValid=true; start/takeover from start-0019; unique clean source46142936/tree514e1d89"
    },
    {
      "command": "herdr agent list and child session ending",
      "result": "No source agent/workspace; normal dispose session_exit. No duplicate launched."
    },
    {
      "command": "Read preserved device and owner feedback records",
      "result": "3 restarts recorded; final repaired entry/Back pass, layout fail. Native screenshot script requested SIGUSR2 earlier, no capture file confirmed; helper work unapproved and now withdrawn."
    },
    {
      "command": "Preserve interrupted evidence with per-file SHA256",
      "result": {
        "files": 118,
        "sensitive_field_findings": []
      }
    }
  ],
  "failure_reason": "Child session ended before writing phase-result. User changed UI requirements and withdrew screenshots. Device last observed with experiment active; original proxy restoration and final cleanup remain pending. New source-only recovery needed before further exact hardware approval.",
  "result_missing": true,
  "device_state": {
    "last_observed": "Experiment component/adapter/client installed; original webserver-remote.so quarantined",
    "restart_commands_last_recorded": 3,
    "remaining_previously_approved": "Original-proxy restoration#4 only after renewed saved/closed confirmation",
    "restored": false,
    "cleanup_complete": false,
    "new_device_operations_authorized": false
  }
}
```

## Current unresolved questions

- Private stock QML types cannot be instantiated with available SDK. Owner must verify native geometry, warning text, input, close and orientations under fresh exact device approval.
- Hardware association/Send acceptance remains blocked.
- Original proxy remains quarantined at last observation; original restoration#4 needs renewed saved/closed and USB confirmation. Credentials/experiment cleanup not complete.


# Approved device transaction — implementation-0033

## Ticket and outcome
[Prove Paper Pro pen input](../../../tracker/tickets/pi-ink-bridge-01-pen-prototype.md) remains **BLOCKED**, with work_status claimed. The approved one-run device slice completed. No source changes, tests, rebuilds, restart, older cleanup, commit or integration occurred. Partial0026 remains open.

## Implementation and validation
The frozen launcher ran exactly once from BASE with a 120-second host tool timeout. It returned exit0 and DEPLOYMENT_COMPLETE. Its local result records both fixed config hash roles, transaction exit0, READER_EXIT_ZERO and HELPER_REMOVED_AND_DIRECTORY_EMPTY_REMOVED. Reader termination and removal of only the new helper and empty directory are proven by this transaction. No private config values were returned. No further device command ran.

## Changed artifacts and supporting evidence
- [Owner approval](../artifacts/evidence/device-digests-0033/approval.json)
- [Frozen plan](../artifacts/evidence/offline-deployment-0031/plan.json)
- [Actual outcome and exact command](../artifacts/evidence/device-digests-0033/execution-outcome.json)
- [Raw launcher stdout](../artifacts/evidence/device-digests-0033/launcher-stdout.txt) and [stderr](../artifacts/evidence/device-digests-0033/launcher-stderr.txt)
- [Raw transaction stdout](../artifacts/evidence/device-digests-0033/transaction-stdout.txt) and [stderr](../artifacts/evidence/device-digests-0033/transaction-stderr.txt)
- [Consumed attempt](../artifacts/evidence/offline-deployment-0031/execution-0031/attempt.json) and [actual result](../artifacts/evidence/offline-deployment-0031/execution-0031/result.json)
- [Parent start-0032](../events/start-0032.yaml) and [child result implementation-0033](../events/implementation-0033.yaml)
- [Confirmed trust boundary ADR0001](../../../docs/adr/0001-pi-ink-cleanup-trust-boundary.md)

## Review, findings and remaining boundary
Latest formal reviewer verdict: none. No review findings resolved by this device slice. ADR0001 supersedes the historical separate descriptor-safe deployment executor prerequisite, not the reader safeguards. Both actual hashes are now available; earlier text asserting absence is historical. Full native UI, associations, Send and cable-free quality-gate acceptance remain unproved. Older experiment cleanup is neither performed nor approved by this run. No retry or extra SSH is authorized. Parent owns result reconciliation and integration; no full-ticket completion or merge is claimed.

Source remains prototype/pi-ink-bridge-01-pen-prototype at bb5df500f4a06c61ebde6073470ef5ed51f4b006, tree 9a9acbfbc65d17f87eb44f2e0a7898000b1d735b. Fresh child session 01a1a634-48a1-7750-a713-cbe6fdf4b659, pane w6S:p2.




## Frozen cleanup attempt implementation-0038

Full ticket and production remain BLOCKED; work_status remains claimed. Cleanup slice failed.

The exact approved launcher ran once from BASE and exited 1. Its only recorded phase was host-check, exit 1, with `CLEANUP_REFUSAL OWNED_PROCESS_VISIBILITY`. Launcher stdout was `STOPPED_POSSIBLE_PARTIAL_REMOVAL_PRESERVE_NO_RETRY`; stderr was empty.

No removed or retained path rows were reported. No device transaction, helper staging/removal, or host apply phase was recorded. No deletion is recorded in this attempt. Existing process/helper and target state remain unobserved beyond this refusal. All manifest-scope removal remains unproven. No retry, repair, probe, process action, or source change followed. Partial0026 and all earlier history remain preserved.

Native pairing, folder associations, and explicit Send acceptance remain outside cleanup scope. No full cleanup or universal credential-erasure claim is made. Parent reconciliation and commits remain pending. Latest reviewer verdict remains unchanged (none); no review or merge occurred.

Evidence and receipts:

- [Parent start](../events/start-0037.yaml)
- [Phase result](../events/implementation-0038.yaml)
- [Owner approval](../artifacts/evidence/cleanup-run-0038/approval.json)
- [Actual outcome](../artifacts/evidence/cleanup-run-0038/execution-outcome.json)
- [Raw stdout](../artifacts/evidence/cleanup-run-0038/launcher-stdout.txt)
- [Raw stderr](../artifacts/evidence/cleanup-run-0038/launcher-stderr.txt)
- [Exact command and exit](../artifacts/evidence/cleanup-run-0038/launcher-exit.json)
- [Executor attempt](../artifacts/evidence/cleanup-executor-0036/execution-0036/attempt.json)
- [Executor result](../artifacts/evidence/cleanup-executor-0036/execution-0036/result.json)

Changed files: only the new execution/evidence records, implementation-0038 receipt, versioned draft snapshot, and generated manifest/projections. Source branch remains prototype/pi-ink-bridge-01-pen-prototype at bb5df500f4a06c61ebde6073470ef5ed51f4b006/tree9a9acbfbc65d17f87eb44f2e0a7898000b1d735b, as established by pre-execution inspection. No source mutation command ran.



# Integrated host recovery — implementation-0049

## Status and ticket

Host implementation and validation passed. The full ticket remains incomplete, with `work_status: claimed`. Hardware acceptance and production remain blocked. No device connection or operation ran.

[Canonical ticket](../../../tracker/tickets/pi-ink-bridge-01-pen-prototype.md) · [Parent start-0048](../events/start-0048.yaml) · [Implementation result](../events/implementation-0049.yaml).

## Problem and implementation

The retained stock-editor runtime and the later bootstrap client had separate entry points. Setup preconfigured credentials instead of providing app pairing. Observed import parents also appeared as folder ownership.

The existing discovery, coordinator and updater now share one `pi-ink-client` with explicit `serve`. New app pairing uses a setup-provisioned HTTPS identity and local desktop approval. Explicit native folder associations remain separate from document-parent provenance. Current-document UUID, request binding, Send, clipping consent, full PDF retention and cancellation reuse the retained implementation. The native manager and document foldout layout fixes remain intact. HTTP bootstrap exposes no authenticated job API.

Source commit: `ff7cb07414b2c907a1aeec24c1f14888cf1a959a`. Tree: `d0c1e3fddeef5295a869b9acd64601de78a470d6`. Branch: `prototype/pi-ink-bridge-01-pen-prototype`.

## Changed files

- **Source file:** `README.md`.
- **Source file:** `bun.lock`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/.gitignore`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/coordinator-discovery.ts`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/coordinator.ts`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/index.ts`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/package.json`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/scripts/provision-tablet.sh`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/build.sh`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/client_test.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/discovery.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/discovery_test.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/folders_test.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/go.mod`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/go.sum`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/install.sh`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/main.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/mdns.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/mdns_records.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/mdns_records_test.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/operations.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/pairing.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/runtime.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/state.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/stock.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/switch_test.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/transport.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/update.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/update_test.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-gateway.ts`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-qml/PiInkToolbar.qml`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-qml/activation-proposal.json`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-qml/pi-ink-bridge.qmd`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet/go.mod`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet/go.sum`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/test/coordinator-identity.test.ts`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/test/tablet-install.test.ts`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/test/tablet-pairing.test.ts`.

Renames and exact source identities appear in [source identity](../artifacts/evidence/integrated-host-recovery-0046/source-identity-0049.json). No unrelated file was staged. The user's base-worktree `mise.toml` was not touched.

## Validation

- **Final checks:** Build, typecheck, 19 Bun tests with 142 assertions, Go race tests and Go vet passed. [Commands and logs](../artifacts/evidence/integrated-host-recovery-0046/checks-0049-r2.json). Build retains dependency-directive and large-chunk warnings.
- **Real data path:** The registered `image_editor`, compiled Go client, certificate-verified HTTPS/WSS and real PDF worker completed one source-sized marked PNG. Actual QML action JavaScript ran against simulated native Library events. [Runtime proof](../artifacts/evidence/integrated-host-recovery-0046/host-smoke-0049-r3.json).
- **Isolation checks:** Save/Close did not complete the request. Unassociated/closed documents, alternate server/request selection, switched confirmation and cancelled requests were refused. Clipping required explicit result-specific consent; the full PDF remained available.
- **Pixel checks:** The PNG is 800 × 1000. It has 35,923 changed pixels and 28,240 changed red-dominant pixels. All four retained 40 × 40 corner-marker regions match exactly. [Pixel result](../artifacts/evidence/integrated-host-recovery-0046/pixel-verification-0049-r3.json).
- **Native syntax:** The final component passes Qt AST parsing. Private native types, physical geometry and input were not instantiated. [Parser result](../artifacts/evidence/integrated-host-recovery-0046/qml-parse-0049-r3.json).
- **Simulation limits:** Stock HTTP, native Library events, browser launching and test-process exit were controlled host boundaries. The retained marked PDF was replayed. No new tablet drawing or cable-free integrated Send is proved.

The first pixel checker used outer page corners instead of the retained marker regions. A later smoke driver invoked Import before the preceding QML folder callback released `actionBusy`. Those failures and corrected checks remain recorded; see [dispositions](../artifacts/evidence/integrated-host-recovery-0046/review-dispositions-0049.json).

## Review history and findings

Two fresh read-only review sessions inspected the WIP source. Both panes closed after completion. These internal reviews are not a formal workflow SUCCESS verdict.

- **Standards axis:** [One finding](../artifacts/evidence/integrated-host-recovery-0046/standards-review-0049.json) identifies unauthenticated HTTP self-update. The requested development updater contract is retained. The runtime warning and documentation explicitly reject publisher-trust claims from discovery or adjacent checksums. This production security risk is not fixed or concealed.
- **Spec axis:** [One finding](../artifacts/evidence/integrated-host-recovery-0046/spec-review-0049.json) identified inferred folder ownership. It is corrected. `folders_test.go` fails against the preserved pre-fix source and passes in the final Go race suite.
- **Formal review:** None for this commit. Parent must arrange fresh review before integration. No merge, rebase, push or ticket completion occurred.

## Candidate and next approval boundary

[Activation proposal](../artifacts/evidence/integrated-host-recovery-0046/candidate-activation-0049-r3.json) · [Frozen payload](../artifacts/evidence/integrated-host-recovery-0046/candidate-payload-0049-r3.tar.gz).

Payload SHA256: `f3a7d6f0c54aa9f27fe46817d482d195e060d6e0c07cb15bf3c8eda0d66c760e`.

Installed ARM64 client SHA256: `713ea330666e51fd09c4bb30010277646932c1552cdb42ce63c143dac5292087`. Version `0.3.0`; one installed executable at `/home/root/pi-ink-client/pi-ink-client`. The production candidate contains no simulated boundary file or credentials.

Separate owner approval must cover the exact payload, trusted setup identity, cable installation/repair, synthetic document operations, saved/closed restart, loopback activation checks and explicit rollback. It must account for unknown existing device state and path collisions. Do not execute the proposal without that approval.

## Remaining acceptance and history

Real app pairing, native root-folder creation/visibility, import destination semantics, current-document/foldout behavior, integrated USB-disconnected Send and owner pen/palm/erase/undo/zoom/orientation/lifecycle verdict remain pending on firmware `3.28.0.172` only. Creating an associated folder does not automatically relocate an import. The parent UUID is labelled as observed at import, not as a live parent.

Cleanup0038 remains `STOPPED_POSSIBLE_PARTIAL_REMOVAL_PRESERVE_NO_RETRY`. Unknown device state, partial0026, all earlier receipts, source and evidence remain preserved. No old helper, process scan, process kill or cleanup retry ran.

Earlier source evidence remains authoritative within its original limits: [implementation-0023](../events/implementation-0023.yaml) and [implementation-0017](../events/implementation-0017.yaml). The failed launch before start-0048 is not implementation success.


### Host follow-up and remaining hardware gate — 2026-11-05

Parent reconciliation: [start-complete-0050](../events/start-complete-0050.yaml). Original integrated host source: `ff7cb07414b2c907a1aeec24c1f14888cf1a959a`. Current source: `19730eb0700cf48ea8f54e5d4b0e189d3c8349db`, tree `a5ce7c9bb7a7367dccfd0cf30a37013db73f5d07`.

- **Pairing recovery:** [Real HTTPS proof](../artifacts/evidence/integrated-host-recovery-0046/pairing-recovery-0052.json). Desktop rejection clears an unwanted pending request without ending the annotation. Regression failed before the fix; typecheck, 19 tests/151 assertions and the standalone HTTPS smoke passed afterward.
- **Current source audit:** [Independent Standards and Spec results](../artifacts/evidence/integrated-host-recovery-0046/pre-deployment-audit-0052.json). No new source blocker identified. The inherited unsigned HTTP updater remains a disclosed development limit. These are advisory results, not a formal workflow review verdict.
- **Device gate:** [Read-only preflight proposal](../artifacts/evidence/integrated-host-recovery-0046/device-preflight-0052.json) is not authorized or executed. Actual tablet pairing, native folder/current-document behavior, cable-free integrated Send, owner pen/geometry/lifecycle acceptance and final approved restoration/cleanup remain open.

The tablet payload remains unchanged at SHA-256 `f3a7d6f0c54aa9f27fe46817d482d195e060d6e0c07cb15bf3c8eda0d66c760e`. Source remains in the retained worktree, not merged or pushed. Ticket claimed; production blocked. No tablet access, screenshots, process scanner, old-session reuse or cleanup0038 retry.


### Read-only preflight stopped — no hardware gate passed

The owner approved one read-only preflight0052. It read OS VERSION_ID=5.8.203 and stopped before every hash/path check. The guard was incorrect: retained baseline metadata records OS VERSION_ID=5.8.203 and product IMG_VERSION=3.28.0.172. This is not evidence of a firmware upgrade. Current product firmware and path occupancy remain unverified.

[Original outcome](../artifacts/evidence/integrated-host-recovery-0046/device-preflight-0052-outcome.json) and [diagnosis](../artifacts/evidence/integrated-host-recovery-0046/device-preflight-0052-diagnosis.json) remain immutable. The corrected IMG_VERSION guard passes supported, unsupported and missing-field cases [offline](../artifacts/evidence/integrated-host-recovery-0046/device-preflight-0053-offline-verification.json). Its [new exact-script proposal](../artifacts/evidence/integrated-host-recovery-0046/device-preflight-0053.json) requires separate one-shot approval.

No device writes, uploads, document operations, restarts, screenshots, process scans or cleanup ran. The previous approval is consumed; no reconnect or automatic retry is authorized. Ticket claimed; hardware acceptance and production remain blocked.


### Corrected read-only preflight0053 passed

The separately approved one-shot preflight completed with exit0. Product IMG_VERSION is 3.28.0.172. The stock binary and hashtab hashes match the retained baseline. The existing client is a root-owned regular0700 file; its hash is recorded. All proposed new experiment/QMD/loopback paths are absent. The existing original webserver-remote.so file matches its retained hash; loaded state and listener bindings were not inspected.

[Observed outcome](../artifacts/evidence/integrated-host-recovery-0046/device-preflight-0053-outcome.json) and [bounded interpretation](../artifacts/evidence/integrated-host-recovery-0046/device-preflight-0053-interpretation.json) preserve the exact scope. No files were uploaded or changed, no document operation or restart ran, and cleanup0038 was not retried. This approval is consumed.

The next work is HOST-ONLY preparation of a hash-pinned staging/activation/restoration procedure and an actual originating OMP request with private setup trust. Device installation, saved/closed restarts, synthetic document operations and restoration still need separate exact approval. Native acceptance and production remain blocked.
