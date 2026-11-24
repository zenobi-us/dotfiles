---
title: Home Assistant contract review review-0005
type: Review
---

# Independent review

## Verdict

FAILURE. One blocking Spec finding remains. Standards has one nonblocking judgement-call smell.

## Frozen scope

Ticket: tracker/tickets/skill-contract-manifests-14-homeassistant.md.
Source branch: feature/skill-contract-manifests-14-homeassistant. Base branch: master.
Source commit: a67bb9fe906d6a9214b1f718961e7c81e5076924.
Source tree: e2c1d6da0ce27dcd3b47ea56572c9144a8651258.
review_base_commit: c79571241489b63536505d9ca892ccb8144f0967.
Timestamp: 2026-11-24T21:50:00.562Z.
Changed scope: mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops.

Compared the exact base and source objects, not moving branches. Reviewed the CLI integration diff, schemas, record validator, tests and changed guidance.

## Standards

Reviewed c79571241489b63536505d9ca892ccb8144f0967 → a67bb9fe906d6a9214b1f718961e7c81e5076924, scoped to homeassistant-ops. No hard documented-standard violations found.

P3 — Possible Duplicated Code (judgement call): scripts/records.ts:68–74 adds recursive key sorting for writeRecord, while scripts/ha_ops.ts:114–125 retains the same recursive sorting and JSON serialization responsibility in stableStringify. The changed snapshot and reference-report writers now use one implementation, while registry ordering still uses the other. Future serialization fixes therefore require two edits. Extract one shared stable serializer and use it from both modules. Preserve the new exclusive-create write behavior.

Check suggestion: compare both serializers on nested objects and arrays with reordered keys, then verify snapshot/report output stays deterministic after consolidation. This is a maintainability finding, not a demonstrated output failure.

Validation: inspected the exact diff, relevant source ranges, source context through mq, and the required standards. No source edits, builds, tests, formatters, or Home Assistant operations were run, as requested.

## Spec

P2 — Missing contract for the owned cleanup plan. contracts.json:3–13 declares only snapshots, reference reports and rename maps. scripts/ha_ops.ts:600–624 still produces an unversioned JSON operation record containing dry_run, steps, entity identities, requested old/new names, group changes and warnings. This is owned structured output, not an external Home Assistant payload or a prose log. The ticket requires: "Declare snapshot and independently consumed operation-record contracts and accepted historical formats." The initiative also requires: "Require authors to identify independently consumed structured inputs and outputs, their owners, validators, compatibility rules, and upgrade policies." The adoption therefore leaves a machine-readable operation boundary outside manifest discovery and owner validation. Declare the cleanup-plan contract, validate its producer, and retain an explicit reader for historical unversioned plans where supported. Reproducer suggestion: use an isolated REST/WebSocket fixture, capture cleanup --json output, then pass the captured JSON to validate-record. It has no schemaVersion and matches none of the declared historical formats. Check preservation of requested changes, group membership, warnings and dry-run semantics.

Review scope: exact c79571241489b63536505d9ca892ccb8144f0967 → a67bb9fe906d6a9214b1f718961e7c81e5076924 diff under homeassistant-ops, plus actual producer/reader paths and both complete specifications. Existing rollback approval and dry-run checks remain unchanged. Snapshot/map/report rejection paths do not rewrite their inputs. No live Home Assistant access, builds, tests or formatters ran. Reproducer is suggested, not executed. Verdict: FAILURE; one specification finding.

## Blocking findings

### SPEC-001 — P2 — NO ADR

File: mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/contracts.json:3. Producer: mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/scripts/ha_ops.ts:600-624.

The manifest omits the independently consumed cleanup --json operation plan. Its producer at scripts/ha_ops.ts:600-624 still emits an unversioned owned JSON envelope. Actual capture succeeds but validate-record rejects it with zero historical matches. This leaves the declared operation-record adoption incomplete.

Required change: Declare the cleanup plan contract and its supported historical format. Update the JSON producer, owner validator, relevant consumers, examples and guidance together. Preserve dry-run, requested changes, warnings and remote approval boundaries.

Validation command:

```sh
env -u HA_URL -u HA_TOKEN mise exec -- bun mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/scripts/ha_ops.ts validate-record /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-14-homeassistant/artifacts/evidence/review-0005/cleanup-plan.json
```

Observed exit 2: `Expected exactly one historical record format; found 0`. The captured producer output has dry_run, steps, renames, group_changes and warnings, but no contract identifier. The capture and rejection are retained in artifacts/evidence/review-0005/cli-smoke.json and cleanup-plan.json. This is a hard acceptance gap, not a stylistic preference.

## Validation

The reviewer ran the declared integration check once after both axis reports arrived:

```sh
env -u HA_URL -u HA_TOKEN mise exec -- bun test mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/tests/ha-ops.test.ts
```

Result: 2 pass, 0 fail, 11 assertions. Evidence: artifacts/evidence/review-0005/tests.json.

The installed skill-contracts router validated the reviewed owner from /tmp. All six definitions resolved. Evidence: artifacts/evidence/review-0005/manifest-validation.json. This proves declaration validity, not complete operation coverage.

Eleven newly executed owning CLI invocations used an in-process Bun REST/WebSocket fixture bound only to 127.0.0.1. Snapshot creation retained exact entity identity and unknown registry fields. Offline validation accepted current and historical snapshots. Dry-run and declined approval produced zero mutations. Approved fixture rollback restored the exact entity and registry fields. Snapshot bytes stayed unchanged. Historical rollback reading succeeded. Offline reference-report production and validation succeeded. Cleanup JSON capture succeeded; its owner validation failed as recorded above.

Fixture requests, mutations, command outputs and saved records are retained under artifacts/evidence/review-0005/. The fixture service stopped in a finally block. Temporary prose logs were removed. No live Home Assistant installation was contacted.

The implementation's earlier 26-command harness is retained evidence only; it was not rerun. Its saved snapshot includes a fixture fallback response for a dashboard route, so that response is not proof of a real dashboard payload. No TypeScript diagnostics or typecheck are claimed.

## Contracts and safety

Affected contracts: homeassistant-snapshot/v1 and /v2; homeassistant-reference-report/v1 and /v2; homeassistant-rename-map/v1 and /v2; skill-contract-manifest/v1; external Home Assistant REST/WebSocket payloads; rollback approval and dry-run boundary. The uncovered cleanup JSON operation-plan boundary also needs adoption.

The changed snapshot and report producers agree with their v2 validators. Historical readers do not rewrite evidence. Unknown and mixed identities reject through the exercised scoped tests. External payloads remain unstamped. No saved-record mutation command exists, so an empty upgrades collection does not itself establish a defect. No relevant ADR applies; the only indexed ADR concerns Pi Ink cleanup.

## Coordination and integration

The canonical inspector found valid history and the exact clean frozen source. review-start-0004 records the active parent owner, explicit review request and completed implementation shutdown. This session is that dispatched fresh reviewer, not a retry or ownership takeover.

The parent coordination inventory is incomplete because unrelated historical goals and linked checkouts are malformed or unavailable. No observed stream overlaps homeassistant-ops. Manifest coverage touches homeassistant-router/contracts.json only. Shared runtime and global bundle versions were not changed. Preserve those uncertainties; do not treat absent inventory as compatibility proof.

Both independent axis sessions completed. Their delivered review-axis/v1 results were verified and acknowledged. Owned terminals were removed; process shutdown was confirmed. The desktop retained the parent review tab and unrelated spaces.

Integration must rerun the recorded scoped check against the combined candidate and assess any base-side contract changes. This FAILURE does not authorize integration. No source fixes, merges, tracker comments or projections were made by this reviewer.

## Canonical inputs

Consumed the ticket and parent initiative, CONTEXT-MAP.md, CONTEXT.md, docs/adr/index.md, implementation-0002.yaml, start-complete-0003.yaml, review-start-0004.yaml, artifacts/snapshots/pr-draft-implementation-0002.md, and implementation evidence cli-smoke.json, validation.json and implementation-context.json. All workflow references are relative to workflows/skill-contract-manifests-14-homeassistant.

## Axis counts

Standards: 0 hard findings, 1 P3 judgement-call smell. Spec: 1 P2 blocking finding.

