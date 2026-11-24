---
blocked_by: []
id: skill-contract-manifests-30-narrative-workspace
parent: skill-contract-manifests
schemaVersion: tracker-ticket/v2
sequence: 30
title: Adopt contracts in narrative workspace metadata
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

narrative-repo-setup owns consumed facet, domain-document, and workflow-document boundaries used in narrative workspaces.

Implement this owner-specific slice under the existing initiative. Preserve its scope limits and contract ownership.

## Acceptance criteria

- [ ] Identify the structural workspace and facet metadata that actual consumers depend on. Distinguish those fields from authored domain and workflow prose.
- [ ] Define applicable owner contracts and validators. Reference specialist narrative contracts rather than assigning their ownership to workspace setup.
- [ ] Update actual setup and reopen operations without overwriting hand-written domain/workflow documents, changing unrelated content, or silently migrating an existing workspace.
- [ ] Exercise new and supported existing fixture workspaces. Confirm unknown versions and unsafe conversions leave the workspace unchanged.
- [ ] Declare actual produced and accepted contracts independently. Resolve every declaration through the public manifest validator. Do not invent a competing shared or external definition.
- [ ] Update the owning guidance and examples with the delivered behaviour. Keep ordinary prose and opaque assets exempt unless actual consumers rely on their structure.

## Scope boundaries

Keep this slice within the named owner. Establish actual consumer requirements before adding identifiers. Historical acceptance does not imply an upgrade path. Use only declared lossless upgrades before an otherwise authorised mutation. Preserve immutable records and external formats.

## Verification

Use actual owning commands, not helper tests alone. Exercise current records, each explicitly supported historical input, authorised mutation where applicable, and rejected unsupported or unsafe operations. Check persisted content and byte preservation. Use isolated fixtures; do not mutate personal data, production services, or historical evidence for validation.

## Evidence

Derived from approved group `owner-request-13` in the [recovery owner assessment](../../workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/owner-requests.json). This assessment is bound to source commit `32f03b1de98d9a5de018ab21106e22fbc6395c65`. Verify the cited producer and consumer evidence before implementation.

Keep Cyberpunk/Cyberwise requests retired. Do not recreate their deleted skills.

## Comments

