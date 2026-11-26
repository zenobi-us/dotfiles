# Web-design metadata review

## Verdict

FAILURE. This completed review is valid only for the frozen source below. Both independent axes identify a blocking pre-parse UTF-8 rejection defect. No source acceptance or integration occurred.

## Scope

Ticket: `tracker/tickets/skill-contract-manifests-16-web-design-metadata.md`. Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.

Source branch: `feature/skill-contract-manifests-16-web-design-metadata`. Base branch: `master`.

Reviewed commit: `9689169146996ad84d19430cd19aa2a386c733b2`. Reviewed tree: `67e2145f36f92662554a7bc7c9d2a0032c5a3bb7`.

Review base commit: `24aca20f74cfec089b69d6e0db8dbca68e1971d6`. Timestamp: `2026-11-26T09:15:13.030641+00:00`. Attempt 2; parent `review-start-0007`.

The nonempty committed three-dot diff contains exactly these 11 files. Base-only workflow metadata is not a source deletion.

- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/SKILL.md`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/assets/sources.json`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/contracts.json`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/style-selection.md`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata-upgrade.md`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/scripts/source-metadata.ts`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/scripts/sources.ts`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/.claude-plugin/plugin.json`.

## Affected contracts

- **Contract:** `design-source-metadata/v1`.
- **Contract:** `design-source-metadata/v2`.
- **Contract:** `skill-contract-manifest/v1`.
- **Contract:** `UpgradeOwner/safeUpgrade/bulkUpgrade`.
- **Contract:** `bundled asset SHA-256 and style/provenance associations`.
- **Contract:** `readCatalog/selectSource`.
- **Contract:** `worktree-receipt/v3`.
- **Contract:** `Creator plugin/marketplace version synchronization`.

## Standards

FAILURE: one hard violation. Reviewed all 11 files in 24aca20f74cfec089b69d6e0db8dbca68e1971d6...9689169146996ad84d19430cd19aa2a386c733b2, the canonical ticket and full initiative through MQ/OKF, repository standards, approval68, and retained native evidence. The catalog reader silently replaces invalid UTF-8 before parsing. This conflicts with checkpoint-0068.yaml approval.scope. The required native malformed-byte regression is also absent. The retained probe establishes rejection failure; I did not replay it. No additional documented-standard violations or actionable smell findings were identified. The only indexed ADR concerns Pi Ink and does not apply. This read-only review ran no builds, lint, tests, formatters, repairs, or tracker mutations. It did not access serverfiles or change repository-relocation.ts. Base-only metadata was not treated as source deletion.

### standards-001 — high

NO ADR: no indexed ADR applies. The governing requirement is approval68, `workflows/goal-skill-contract-manifests/events/checkpoint-0068.yaml`, `approval.scope`.

`mise/conf.d/devtools-agent/bundles/creator/skills/web-design/scripts/source-metadata.ts:27`: Hard violation of checkpoint-0068.yaml approval.scope: Reject invalid UTF-8 before parsing; add native regression. readCatalog uses readFile(path, "utf8"), which replaces invalid byte sequences before validateCatalog receives the text. The retained native-probes.json records expected exit 1 but observed exit 0 for the invalid UTF-8 catalog at the frozen commit. The native smoke suite creates string fixtures only and has no malformed-byte regression.

Required change: Read catalog bytes and reject invalid UTF-8 before JSON parsing. Preserve valid inputs and original bytes. Add a native malformed-byte regression that asserts command rejection and byte preservation, alongside valid current and historical input coverage.

Validation command: `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts`.

## Spec

FAILURE: one blocking specification finding. Reviewed all 11 changed files for commit 9689169146996ad84d19430cd19aa2a386c733b2 against base 24aca20f74cfec089b69d6e0db8dbca68e1971d6. Read the full canonical ticket and initiative through MQ with okf in the publication checkout. Checked approval68 and the recorded native failure against the reader and native regression cases. The implementation does not meet the explicit pre-parse UTF-8 rejection and native regression requirement. No additional specification finding identified. The established failure was not replayed. No source edits, builds, lint, tests, formatters, tracker writes, commits, integration, relocation repair, or serverfiles access occurred. The review is complete; domain acceptance fails.

### spec-001 — high

NO ADR: no indexed ADR applies. The governing requirement is approval68, `workflows/goal-skill-contract-manifests/events/checkpoint-0068.yaml`, `approval.scope`.

`mise/conf.d/devtools-agent/bundles/creator/skills/web-design/scripts/source-metadata.ts:27`: Approval68 requires: "Reject invalid UTF-8 before parsing; add native regression." readCatalog decodes with readFile(path, "utf8"), which replaces invalid bytes before validateCatalog parses the text. The pinned native-probes.json records expected exit 1 but observed exit 0 for an invalid UTF-8 historical catalog. The native smoke suite has no invalid-byte fixture, so its existing passing run does not satisfy this boundary.

Required change: Read catalog bytes and reject invalid UTF-8 before JSON parsing. Preserve valid inputs and input bytes. Add a native malformed-byte regression through the owning validate and select commands, with byte-level preservation assertions and valid historical/current controls. Keep persistence in the shared upgrade operations.

Validation command: `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts`.

## Validation

The primary ran the frozen executable from unrelated cwd `/tmp`:

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata/mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts
```

Exit 0; 52 native command outcomes matched expectations; stderr was empty. Complete stdout, stderr, argv, cwd, status, count, SHA and tree are retained in `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/review-0008/native-smoke.json`. This is a fresh committed-source run, unlike the implementation's pre-commit run. It covers public declarations and resolution, both catalog formats, all five selections, explicit shared upgrades, byte-preserving refusals, partial bulk conversion and isolated checksum rejection.

The known malformed-UTF-8 outcome remains failing: expected exit 1, observed 0; input bytes stayed unchanged. Evidence: `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/parent-verification-0001/native-probes.json`; binary fixture: `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/parent-verification-0001/invalid-utf8-catalog.bin`. The reader's `readFile(path, "utf8")` replaces invalid bytes before parsing. The established failure was consumed, not replayed. The existing runner does not cover this case; its passing result does not satisfy approval68.

A separate byte comparison confirmed that every non-identity catalog byte matches the immutable numeric-1 baseline. All five bundled asset hashes match. Capture time remains `2026-10-22T10:12:43.516Z`. Evidence: `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/review-0008/preservation.json`.

## Coordination and limits

Consumed the fresh all-three-scope parent coordination completed in 117.38 seconds. No hard blockers or record diagnostics were recorded. Reservation69 was reconciled to completion6. The sole parent owner is `herdr-app:t2dv`; this review is its authorized child. Linked inventory omissions remain unknown. Generated-file overlaps with other streams remain recorded in `scope.json`; this read-only review makes no generator edits or integration. Reassess before mutation.

The inspector found valid history and the exact clean frozen source. Its interrupted-review recovery reflects the in-progress primary, not a usable prior verdict. Approval78 authorizes this retry; approval68 authorizes findings-driven fix/review. Implementation2 and completion3 establish run completion only: parent validation failed and implementation acceptance remains false. Prior review5 was blocked without verdict.

Both fresh leaves ran concurrently at depth2 under primary depth1, using native Bash launch context and non-focusing tabs. Each delivered one validated and acknowledged `review-axis/v1` result. Their JSON evidence is retained separately. Normal `hc kill`/`hc rm` closed only owned leaves. Both process registries report shutdown confirmed; desktop leaf terminals are absent. The primary and its source space remain for parent closure. No services were started.

No browser checks apply because no UI changed. No source, tracker, projection, dependency, lock, global setting, relocation implementation or serverfiles changes occurred. Resource observations emitted an existing mise undefined-variable warning; no configuration repair was attempted.

## Integration plan

Planned candidate-cwd check only; NOT executed:

```sh
mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts
```

## Axis totals and next action

Standards: 1 high finding; worst issue is invalid UTF-8 acceptance before parsing. Spec: 1 high finding; worst issue is the unmet approval68 rejection/regression requirement. The reports remain separate, without merged or reranked findings.

Parent must validate this result and close the primary normally. Use the approved findings-driven fix, add the native malformed-byte regression, and obtain a fresh review of the changed source. Do not integrate this frozen source.
