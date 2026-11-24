---
blocked_by: []
id: skill-contract-manifests-34-pr-results
parent: skill-contract-manifests
schemaVersion: tracker-ticket/v2
sequence: 34
title: Adopt contracts in derived PR results
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

pr owns its script-derived metadata and review-thread result records, not native GitHub API formats.

Implement this owner-specific slice under the existing initiative. Preserve its scope limits and contract ownership.

## Acceptance criteria

- [ ] Inventory actual metadata, thread, and other script-derived result families, their consumers, validators, and authoritative owners.
- [ ] Distinguish native GitHub responses from owned derived records. Preserve external response structure and reference its authority.
- [ ] Update actual result producers and readers together, declare production and acceptance independently, and retain explicit historical readers where supported.
- [ ] Exercise real metadata/thread operations using an isolated fixture or safe read-only repository. Reject unsupported owned inputs without mutating PR or review state.
- [ ] Declare actual produced and accepted contracts independently. Resolve every declaration through the public manifest validator. Do not invent a competing shared or external definition.
- [ ] Update the owning guidance and examples with the delivered behaviour. Keep ordinary prose and opaque assets exempt unless actual consumers rely on their structure.

## Scope boundaries

Keep this slice within the named owner. Establish actual consumer requirements before adding identifiers. Historical acceptance does not imply an upgrade path. Use only declared lossless upgrades before an otherwise authorised mutation. Preserve immutable records and external formats.

## Verification

Use actual owning commands, not helper tests alone. Exercise current records, each explicitly supported historical input, authorised mutation where applicable, and rejected unsupported or unsafe operations. Check persisted content and byte preservation. Use isolated fixtures; do not mutate personal data, production services, or historical evidence for validation.

## Evidence

Derived from approved group `owner-request-17` in the [recovery owner assessment](../../workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/owner-requests.json). This assessment is bound to source commit `32f03b1de98d9a5de018ab21106e22fbc6395c65`. Verify the cited producer and consumer evidence before implementation.

Keep Cyberpunk/Cyberwise requests retired. Do not recreate their deleted skills.

## Comments

