---
schemaVersion: tracker-ticket/v2
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-13-twg-benchmark
parent: skill-contract-manifests
sequence: 13
title: Adopt contracts in TWG benchmark runs
triage: ready-for-agent
type: enhancement
work_status: "completed"
---

## What to build

Use record-family contract identifiers for benchmark configuration and independently consumed persisted run artifacts.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [x] Declare benchmark-owned configuration, run, manifest, judgement, and result contracts where independently consumed. Keep schema identity separate from benchmark contractVersion and runtime versions.
- [x] Replace numeric schema identifiers through explicit known historical readers and declared upgrades. Update both supported runtime implementations and their producers and consumers together.
- [x] Exercise the owning benchmark operations in both supported runtimes, including configuration validation, artifact generation, and artifact reading.
- [x] Preserve prompts, paired-arm identity, integrity checks, findings, measurements, safety boundaries, and benchmark meaning. Do not substitute a new task for a stored run.
- [x] Read-only access and rejected conversions preserve artifacts. Keep any immutable run evidence unchanged and report unsupported historical formats explicitly.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments


- **Review:** SUCCESS; commit `33b388888ecb2dbbe46cde0d76f604946c925734`; tree `6bf7cadb7209cb53e0a85d62d7107ae201c38c2f`; 2026-11-22T08:15:46.981Z; [review artifact](../../workflows/skill-contract-manifests-13-twg-benchmark/artifacts/reviews/review-review-0005.md).

- **Completion:** reviewed source `33b388888ecb2dbbe46cde0d76f604946c925734` integrated by squash as `21e3f6c74e2461fdc2850f063656ff07f3872c93` and published to `origin/master`. Candidate-bound Bun/Node checks and owning run/render smoke passed. [Publication checkpoint](../../workflows/skill-contract-manifests-13-twg-benchmark/events/finish-pushed-0010.yaml).
