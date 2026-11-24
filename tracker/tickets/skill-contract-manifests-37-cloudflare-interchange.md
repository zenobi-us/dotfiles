---
blocked_by: []
id: skill-contract-manifests-37-cloudflare-interchange
parent: skill-contract-manifests
schemaVersion: tracker-ticket/v2
sequence: 37
title: Adopt contracts in Cloudflare interchange records
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

cloudflare-api owns its DNS/redirect CSV interchange and export boundaries where their structure is locally defined.

Implement this owner-specific slice under the existing initiative. Preserve its scope limits and contract ownership.

## Acceptance criteria

- [ ] Identify actual DNS/redirect CSV columns, interpretation, export semantics, and consuming operations. Distinguish locally owned interchange from Cloudflare-native API formats.
- [ ] Define applicable authoritative contracts, validators, compatibility, and separate production/acceptance declarations. Preserve external syntax; do not inject internal identifier columns.
- [ ] Update CSV generation, parsing, and authorised mutation preflight together. Preserve DNS values, redirect ordering, unknown data, and credential boundaries.
- [ ] Exercise actual export/import preflight and rejected malformed or unsupported fixture inputs. No production DNS or redirect mutation is required for contract verification.
- [ ] Declare actual produced and accepted contracts independently. Resolve every declaration through the public manifest validator. Do not invent a competing shared or external definition.
- [ ] Update the owning guidance and examples with the delivered behaviour. Keep ordinary prose and opaque assets exempt unless actual consumers rely on their structure.

## Scope boundaries

Keep this slice within the named owner. Establish actual consumer requirements before adding identifiers. Historical acceptance does not imply an upgrade path. Use only declared lossless upgrades before an otherwise authorised mutation. Preserve immutable records and external formats.

## Verification

Use actual owning commands, not helper tests alone. Exercise current records, each explicitly supported historical input, authorised mutation where applicable, and rejected unsupported or unsafe operations. Check persisted content and byte preservation. Use isolated fixtures; do not mutate personal data, production services, or historical evidence for validation.

## Evidence

Derived from approved group `owner-request-21` in the [recovery owner assessment](../../workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/owner-requests.json). This assessment is bound to source commit `32f03b1de98d9a5de018ab21106e22fbc6395c65`. Verify the cited producer and consumer evidence before implementation.

Keep Cyberpunk/Cyberwise requests retired. Do not recreate their deleted skills.

## Comments

