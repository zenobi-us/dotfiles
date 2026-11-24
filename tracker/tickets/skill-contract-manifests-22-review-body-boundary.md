---
blocked_by: []
id: skill-contract-manifests-22-review-body-boundary
parent: skill-contract-manifests
schemaVersion: tracker-ticket/v2
sequence: 22
title: Declare code-review storage boundaries
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Resolve code-review body classification with the existing worktree storage owner. Do not reopen completed receipt adoption or create a competing receipt family.

Implement this owner-specific slice under the existing initiative. Preserve its scope limits and contract ownership.

## Acceptance criteria

- [ ] Trace actual aggregation and persisted-review consumers. Distinguish ordinary review prose from program-consumed fields and receipt envelopes.
- [ ] Record the classification and authoritative owner. Reference existing worktree and result-delivery contracts wherever they already own the structure.
- [ ] Add or complete the code-review manifest for actual produced and accepted formats. Define a new body contract only when a real consumer requires it.
- [ ] Exercise review aggregation and persistence with current and supported historical examples. Preserve prior review artifacts, receipt chains, and prose bytes.
- [ ] Declare actual produced and accepted contracts independently. Resolve every declaration through the public manifest validator. Do not invent a competing shared or external definition.
- [ ] Update the owning guidance and examples with the delivered behaviour. Keep ordinary prose and opaque assets exempt unless actual consumers rely on their structure.

## Existing ownership

[Completed worktree adoption](skill-contract-manifests-08-worktree.md) owns receipt and storage contracts. Reuse that delivered boundary; this ticket covers only the remaining code-review classification and declarations.

## Scope boundaries

Keep this slice within the named owner. Establish actual consumer requirements before adding identifiers. Historical acceptance does not imply an upgrade path. Use only declared lossless upgrades before an otherwise authorised mutation. Preserve immutable records and external formats.

## Verification

Use actual owning commands, not helper tests alone. Exercise current records, each explicitly supported historical input, authorised mutation where applicable, and rejected unsupported or unsafe operations. Check persisted content and byte preservation. Use isolated fixtures; do not mutate personal data, production services, or historical evidence for validation.

## Evidence

Derived from approved group `owner-request-5` in the [recovery owner assessment](../../workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/owner-requests.json). This assessment is bound to source commit `32f03b1de98d9a5de018ab21106e22fbc6395c65`. Verify the cited producer and consumer evidence before implementation.

Keep Cyberpunk/Cyberwise requests retired. Do not recreate their deleted skills.

## Comments

