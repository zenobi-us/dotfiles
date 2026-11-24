---
schemaVersion: worktree-pr-draft/v1
workflow_id: skill-contract-manifests-18-manifest-coverage
receipt_id: implementation-0006
source_commit: 32f03b1de98d9a5de018ab21106e22fbc6395c65
source_tree: e1819e996b9bcd6a00e8c4441cf0e158e6b428b1
---
# Manifest coverage recovery

## Ticket and problem

Ticket: tracker/tickets/skill-contract-manifests-18-manifest-coverage.md.
Retired source directories and branch-only manifest additions could resurrect removed skills. Remaining contract gaps prevent full coverage.

## Implementation

Reconciled all 17 retired Cyberpunk/Cyberwise source directories and eight branch-only manifests in one scoped removal commit. Preserved every retained source file and all historical evidence. Rediscovered 244 maintained skills through installed entry points and validated all 244 installed plus all 244 source directories. Source has 201 valid manifests, 43 missing, zero invalid present; 124 retained semantic boundaries remain partial. Full coverage is false. No owner migration, installation, updater change, ticket mutation, review, merge or push.

## Changed files

294 deleted files, exclusively under the 17 authorised directories. Exact paths and retained-byte hashes: [workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/source-binding.json](workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/source-binding.json).
Removal authority: a675b089877ae74a6d77e2b5f5e0c91fa81e7505 and [workflows/skill-contract-manifests-18-manifest-coverage/events/takeover-approval-0004.yaml](workflows/skill-contract-manifests-18-manifest-coverage/events/takeover-approval-0004.yaml).
No retained source, manifest, definition or version metadata changed.

## Validation

| Surface | Skills | Valid manifests | Missing manifests | Invalid present |
|---|---:|---:|---:|---:|
| Installed master | 244 | 12 | 232 | 0 |
| Proposed source | 244 | 201 | 43 | 0 |

Public skill-contracts validate ran once per surface/directory from /tmp, with bounded concurrency. Each operation retains argv, cwd, exit, stdout, stderr, skill and manifest hashes.
Installed and source discovery sets match. No newly added retained skill appeared since the previous inventory. Sixteen missing/stale declared roots remain diagnostics, including the empty researcher bundle; they are not silently omitted.
All 17 directories are absent from source and installed lookup. No orphan removal-scope manifests remain. Retained Markdown and executable references contain no removed-skill references. Historical bytes and all 2216 retained source files match pre-removal hashes.
Structural/reference resolution does not prove semantic support. Carry forward 124 partial boundaries with explicit prior-audit provenance.

## Remaining findings and questions

43 missing manifests and 124 partial skills remain blocked. Keep all existing owner assignments. Current requests: 22; retired requests: 14 with removal provenance. Proposed groups: 21, not published tickets.
Godot has one shared preference-contract proposal owned by godot-mentor. A separate integration question asks whether SessionStart should restore preferences or its prose should change. The current hook does not read preference state. No restoration was implemented.
Other requests stay separate without proven common-format evidence. External definition gaps remain separate from new local-owner proposals. See [workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/owner-requests.json](workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/owner-requests.json) and [workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/unresolved-external-definitions.json](workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/unresolved-external-definitions.json).

## Review and merge status

No formal review has run. Latest reviewer verdict: none. Resolved formal review findings: none. Merge and push: not authorised. Ticket remains claimed; full_coverage is false.

## Receipt history and evidence

Consumed [workflows/skill-contract-manifests-18-manifest-coverage/events/implementation-0002.yaml](workflows/skill-contract-manifests-18-manifest-coverage/events/implementation-0002.yaml), [workflows/skill-contract-manifests-18-manifest-coverage/events/start-complete-0003.yaml](workflows/skill-contract-manifests-18-manifest-coverage/events/start-complete-0003.yaml), [workflows/skill-contract-manifests-18-manifest-coverage/events/takeover-approval-0004.yaml](workflows/skill-contract-manifests-18-manifest-coverage/events/takeover-approval-0004.yaml), and [workflows/skill-contract-manifests-18-manifest-coverage/events/start-0005.yaml](workflows/skill-contract-manifests-18-manifest-coverage/events/start-0005.yaml).
Historical snapshot remains [workflows/skill-contract-manifests-18-manifest-coverage/artifacts/snapshots/pr-draft-implementation-0002.md](workflows/skill-contract-manifests-18-manifest-coverage/artifacts/snapshots/pr-draft-implementation-0002.md).
New child result: [workflows/skill-contract-manifests-18-manifest-coverage/events/implementation-0006.yaml](workflows/skill-contract-manifests-18-manifest-coverage/events/implementation-0006.yaml).
Fresh evidence: [workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/discovery.json](workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/discovery.json), [workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/installed-validation.json](workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/installed-validation.json), [workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/source-validation.json](workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/source-validation.json), [workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/coverage-inventory.json](workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/coverage-inventory.json), [workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/smoke.json](workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/smoke.json), and [workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/removed-skill-lookup.json](workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/removed-skill-lookup.json).
