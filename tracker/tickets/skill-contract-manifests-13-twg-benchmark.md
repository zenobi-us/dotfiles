---
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-13-twg-benchmark
parent: skill-contract-manifests
schema: tracker-ticket/v1
sequence: 13
title: Adopt contracts in TWG benchmark runs
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Use record-family contract identifiers for benchmark configuration and independently consumed persisted run artifacts.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Declare benchmark-owned configuration, run, manifest, judgement, and result contracts where independently consumed. Keep schema identity separate from benchmark contractVersion and runtime versions.
- [ ] Replace numeric schema identifiers through explicit known historical readers and declared upgrades. Update both supported runtime implementations and their producers and consumers together.
- [ ] Exercise the owning benchmark operations in both supported runtimes, including configuration validation, artifact generation, and artifact reading.
- [ ] Preserve prompts, paired-arm identity, integrity checks, findings, measurements, safety boundaries, and benchmark meaning. Do not substitute a new task for a stored run.
- [ ] Read-only access and rejected conversions preserve artifacts. Keep any immutable run evidence unchanged and report unsupported historical formats explicitly.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments

