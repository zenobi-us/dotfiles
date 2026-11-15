---
source_commit: 8ff5def35291d6271aa1ac3768386dff48dad26c
source_tree: a1e58164be06dd02fb6ef73fb8d131db4498fe1e
ticket_ref: tracker/tickets/herdr-query-cache-01-selective-refresh.md
title: Selective refresh native verification
type: Concept
---

# Native verification evidence

## Provenance

Original screenshots came from the isolated native Herdr app through `herdr-app shot`. Transport traces contain real generated-helper requests, envelopes, byte counts and timestamps. The wrapper delayed delivery without changing results. These are raw native captures and logs, not a sealed `collect-evidence/v1` run. No screenshot was reconstructed. Asset hashes are in [native-assets.json](files/native-assets.json); unknown capture times remain unknown.

The app used a private HOME, app home, Core session, cache and scratch Git repository under `/tmp/herdr-query-cache-bKzX6y`. The user's live app, Core and unrelated prototype were not changed. Own-window maximize forced a fresh compositor frame before final captures. Final source: `8ff5def35291d6271aa1ac3768386dff48dad26c`, tree `a1e58164be06dd02fb6ef73fb8d131db4498fe1e`.

## Measured transfers

Body bytes are UTF-8 JSON bytes of result values, excluding cache tokens, envelopes and worker status. Helper calls include real job creation, worker execution, status polling and removal. Automatic refresh can cause additional batches while a scenario tag remains active. Durations in the JSON are observation windows, not latency benchmarks.

| Observation | Helper calls | Validation batches | Result bodies | Body bytes |
| --- | ---: | ---: | ---: | ---: |
| Initial two-record cold load | 8 | 0 | 4 | 7713 |
| Unchanged app restart with 65-second worker delay | 123 | 1 | 0 | 0 |
| First 200-record sweep, with existing small-cache entries | 209 | 1 | 200 | 483864 |
| Unchanged 200-record warm sweep | 82 | 1 | 74 | 152358 |
| Final generated-helper validation of retained entries | 1 | 1 | 0 | 0 |

The large warm sweep validated 128 cells, including 126 detail bodies. All 74 body reads were eviction misses; no retained validated detail was retransferred. Context and tree stayed cached. The long restart used 120 status polls; its completed status envelope was 478 bytes. The final helper smoke classified all 128 entries unchanged. [Full measurements](files/measurements.json) retain every scenario, including development failures and extra automatic refreshes. [Raw transport](files/transport.jsonl) and [request starts](files/starts.jsonl) preserve the evidence.

## Observed scenarios

- **Tree before details:** [native frame](shots/tree-ready-before-details-final.png) showed the current tree with 1/2 details applied while the real detail response was delayed ten seconds. The later large sweeps reached [200/200 cold](shots/large-cold-200-details-applied.png) and [200/200 warm](shots/large-warm-200-details-applied.png).
- **File edit and stale display:** [current preview](shots/files-current-preview.png), then [stale during replacement](shots/files-stale-during-body-read.png). One-record edit validation classified tree and A changed while context and unrelated B stayed unchanged. Selected A was read more than once during generation/view transitions; unchanged B was not retransferred.
- **Deletion race:** a real successful file response arrived after deletion. [Before late delivery](shots/files-deleted-before-late-response.png) and [after late delivery](shots/files-deleted-after-late-response.png) show that the removed preview stayed absent. Unit regressions also reject obsolete record and validation generations.
- **Shared dependency:** editing B refreshed both B and dependent A, plus the tree; context stayed cached. [Current native frame](shots/shared-dependency-current.png).
- **Membership:** C addition, move to nested/C.md, and deletion changed tree membership and affected details. [Final native frame](shots/membership-add-rename-delete-final.png). Existing unrelated details remained current.
- **Git-only change:** source commit changed from 8027fc89bb953471e3d1716d15a7f5bb298d00a3 to 6582f9ad3fdaaeda48451990d5d5a875d470ab76 while tree 19e3af863338121baeb3734ec248fc8eb6764d03 stayed identical. Only workflow-derived A refreshed. [Native frame](shots/git-only-current.png).
- **Route isolation:** route change classified all four old entries unknown and produced distinct identities. [Native frame](shots/route-change-current.png). Permanent helper regressions cover same-origin repositories, arguments and route changes.
- **Corrupt/missing entries:** each case classified only the damaged or missing detail unknown; the other three entries stayed unchanged. Exactly one body was fetched per case. [Recovery frame](shots/cache-recovery-current.png).
- **Restart over 60 seconds:** [stale cached tree](shots/warm-cache-stale-before-65s-validation.png) remained visible through a 65-second validation worker; [current result](shots/warm-cache-current-after-65s-validation.png) required no body reads. Each helper invocation is a fresh process; observations survived restart on disk.
- **Fresh actions:** preparation for deleted C failed through the canonical path with QUERY_FAILED: The selected record no longer exists. No agent launched. Mutation and preparation bypass regressions passed.
- **Cancellation:** native close initially removed the worker but leaked its job directory. [Failing-before regression output](files/cancellation-before-fix.log) records the defect. After the fix, native close removed worker t6k and job 2a6b22a6-9bb3-464b-a221-947692a7604b before the delayed status settled; only the owned initial shell remained. Two real-Core regressions passed, including cancellation precedence over JOB_NOT_FOUND.
- **Resource limits:** permanent helper tests exercised 513 entries plus a 33 MiB file and verified pruning to at most 512 entries and 32 MiB, with no published pending writes. Panel sweeps exercised 200 records against 128 cells. Validation staging has the same 32 MiB serialized budget and does not rewrite unchanged bodies.

## Final comparison and checks

[Canonical comparisons](files/canonical-comparisons.json) contain equal normalized SHA-256 hashes for all 128 retained values: context, tree and 126 details. Object keys were sorted; array order was preserved. Comparisons used the app's exact target environment. An initial comparison with the parent's broader PATH was rejected because it exposed a worktree tool absent from the isolated target. The correctly scoped comparison had zero mismatches.

[Checks](files/checks.json): build, 47 Node panel/Core tests, 17 Bun helper/backend tests, TypeScript with isolated real peer declarations, and native mod check passed. [Full output](files/full-suite.log). [Final bundle smoke](files/final-helper-validation.json) ran after the final bounded-staging change. Native captures preceded that helper-only optimization; panel code was unchanged afterward.

## Review and cleanup

Read-only [standards](files/standards-review.json) and [specification](files/spec-review.json) self-reviews identified large-sweep eviction churn, short/serial validation, Files freshness/deletion, and persistent cross-client overwrites. All were fixed and exercised. They are not a formal worktree review verdict. Parent review remains pending.

The owned native apps and isolated Core were stopped. [Resource observation](files/service-shutdown.json) shows their stopped process identities. Remaining live processes belong to this agent's harness-managed eval/LSP lifecycle; parent owns child-pane closure. Temporary scratch tools and fixtures were removed after preserving evidence. Source worktree remains clean and available. No merge, push, ticket completion or user-state cleanup occurred.

## Not covered

No second physical host or additional OS account was provisioned. Named-Core execution used real separate Core/home/state environments on this host. Machine and user isolation use target /etc/machine-id, username and UID; schema/loader isolation uses the versioned identity contract. The headless sandbox build lacked a system prerequisite, so native QA used the installed app in an isolated environment instead. No live-user mod installation or remote publication was attempted.

