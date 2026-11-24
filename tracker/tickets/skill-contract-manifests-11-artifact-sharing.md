---
schemaVersion: tracker-ticket/v2
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-11-artifact-sharing
parent: skill-contract-manifests
sequence: 11
title: Adopt contracts in artifact sharing
triage: ready-for-agent
type: enhancement
work_status: "claimed"
---

## What to build

Define and use contracts for artifact-share configuration and owned publication metadata.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Declare configuration and independently consumed share metadata contracts, accepted historical formats, and supported upgrades. Keep external package and hosting formats unchanged.
- [ ] Update configuration readers and writers and owned publication metadata producers and consumers together. Introduce a new affected contract version when the wire format changes.
- [ ] Exercise actual configuration reading, authorised configuration changes, and share metadata generation or retrieval through the owning commands.
- [ ] Preserve share names, references, repository settings, authored metadata, and source bytes. Read-only access and rejected conversion leave inputs unchanged.
- [ ] Keep the share access boundary and existing publication requirements intact. Do not use contract validity as publication approval or success.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments



### Review 2026-11-22T08:25:01.795Z

Verdict: FAILURE. Reviewed commit: 8d83701befd83473f2a3fb38162cbef0c5082e38. Reviewed tree: 6da0a4fe4f9809120bab3bc7c11cddd78e87ac22. [Review artifact](../../workflows/skill-contract-manifests-11-artifact-sharing/artifacts/reviews/review-review-result-0006.md).


### Review 2026-11-22T10:08:15.918Z

Verdict: FAILURE. Reviewed commit: 2b9160cdac8a7c413944876c87292d0d023eeaf1. Reviewed tree: fb5625ebed3cdf92b322286d5c50aee485b887a1. [Review artifact](../../workflows/skill-contract-manifests-11-artifact-sharing/artifacts/reviews/review-review-result-0014.md).

### Review 2026-11-23T04:24:11.122Z

Verdict: FAILURE. Reviewed commit: 3378f0d89811c8ce67feadcc0326f8c86764a0ae. Reviewed tree: 6138a98322ac55a4bb0cc4b5a0a10c2f3578c27b. [Review artifact](../../workflows/skill-contract-manifests-11-artifact-sharing/artifacts/reviews/review-review-result-0022.md).

### Review 2026-11-23T08:21:42.107Z

Verdict: FAILURE. Reviewed commit: 8b616592357dd7c5c7472b54d3e946029bd2d2a9. Reviewed tree: d3d9d6e312b93131799b44b1d11b49d07bd1ebb8. [Review artifact](../../workflows/skill-contract-manifests-11-artifact-sharing/artifacts/reviews/review-review-result-0032.md).



### Review 2026-11-23T11:21:28.460Z

Verdict: FAILURE. Reviewed commit: 7eeefdfed44d18bc6bea9c482b438bf4e43f6ef8. Reviewed tree: b70d4a21bb53f54c5c41a47e036842d192add4ca. [Review artifact](../../workflows/skill-contract-manifests-11-artifact-sharing/artifacts/reviews/review-review-result-0044.md).


### Review 2026-11-24T02:50:04.141Z

Verdict: SUCCESS. Reviewed commit: e01e451f90a426b9cf24e8432035e2ba775a04e4. Reviewed tree: 909dd320a0fab5690f7b334d317bcdab254e9c3a. [Review artifact](../../workflows/skill-contract-manifests-11-artifact-sharing/artifacts/reviews/review-review-result-0052.md).



### Review 2026-11-24T05:40:08.646Z

Verdict: FAILURE. Reviewed commit: 6b0b445fa85328c90de214e257e23451a7e9aa6a. Reviewed tree: cd8e06c0e0f6ce08aeb7cdc5c224bdbb0718889c. [Review artifact](../../workflows/skill-contract-manifests-11-artifact-sharing/artifacts/reviews/review-review-result-0058.md).



### Review 2026-11-24T06:02:48.232Z

Verdict: SUCCESS. Reviewed commit: 6b0b445fa85328c90de214e257e23451a7e9aa6a. Reviewed tree: cd8e06c0e0f6ce08aeb7cdc5c224bdbb0718889c. [Review artifact](../../workflows/skill-contract-manifests-11-artifact-sharing/artifacts/reviews/review-review-result-0066.md).

