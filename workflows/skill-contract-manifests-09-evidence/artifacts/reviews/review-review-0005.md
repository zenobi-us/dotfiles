# Evidence contract review

Verdict: **FAILURE**. One blocking Spec finding: EVIDENCE09-SPEC-001 (P2). Standards: no findings.

## Frozen review identity

| Field | Value |
|---|---|
| Ticket | tracker/tickets/skill-contract-manifests-09-evidence.md |
| Parent initiative | tracker/initiatives/skill-contract-manifests/index.md |
| Source branch | feature/skill-contract-manifests-09-evidence |
| Base branch | master |
| Source commit | dc75b3b33ab1f81c3c312cc38510dc3254ac2c5a |
| Source tree | 4e9cb559406b7b44edff21343b39f715e90194d0 |
| review_base_commit | a377108e5df4f6eef8c3d259812c2cdab71dd4de |
| Timestamp | 2026-11-22T04:06:54.311Z |
| Review session | 07cbccfe-ee16-453b-b582-30d0ce879d03 |
| Review terminal | t1xj |

The source stayed frozen. The review used the authorized three-dot diff and inspected exact base-to-source differences for compatibility. Independent base-only metadata and other ticket changes are not source defects. No evidence-contract ADR applies.

Read inputs: canonical ticket, parent initiative, implementation-0002, start-complete-0003, review-start-0004, and pr-draft-implementation-0002. Context routing resolved the designated repository checkout. No source, tracker, projection, configuration or generated file was changed.

## changed_scope

```json
[
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/SKILL.md",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/contracts.json",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/howto.md",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/drivers/playwright-cli.md",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/drivers/surf-cli.md",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/evidence-schema.md",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/evidence-v1.md",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/gui.md",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/manual-web-example.md",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/tui.md",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/web.md",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/gui-driver.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/surf-driver.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/tui-driver.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/load-plan.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/plan.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/fixture.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/gui-workflow.test.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/SKILL.md",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/contracts.json",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/howto.md",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/cli.md",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/feedback-v1.md",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/request.md",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/system.md",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/annotations.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/commands.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/records.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/request.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/server.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/history-workflow.test.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/request-workflow.test.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/video-workflow.test.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/drafts.tsx",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/main.tsx",
  "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/types.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/report-cli.ts",
  "mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/test/report-cli.test.ts"
]
```

## affected_contracts

```json
[
  "skill-contract-manifest/v1",
  "collect-evidence/v1",
  "collect-evidence/v2",
  "collect-feedback/v1",
  "collect-feedback/v2",
  "writing-reports evidence consumer",
  "feedback viewer API and draft recovery",
  "immutable sealed media hashes"
]
```

## integration_checks

```json
[
  {
    "argv": [
      "mise",
      "exec",
      "--",
      "env",
      "PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome",
      "bun",
      "test",
      "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test",
      "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test",
      "mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/test/report-cli.test.ts"
    ]
  },
  {
    "argv": [
      "mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts",
      "validate",
      "--skill",
      "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence"
    ]
  },
  {
    "argv": [
      "mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts",
      "validate",
      "--skill",
      "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback"
    ]
  }
]
```

## Reviewed requirements

| Requirement | Review result |
|---|---|
| Declare owned plans, run metadata, acceptance and results | The v2 discriminated family covers these independently consumed records. Both manifests validate. |
| Separate output and accepted input contracts | Current output uses v2. Historical v1 acceptance is explicit. No upgrade is declared. |
| Coordinate producers, validators, consumers, examples and guidance | Scoped producers and consumers use schemaVersion. One compilation identity check remains incomplete; see Spec. |
| Exercise actual planning, production and acceptance reads | Public init, render, compile and run captured a real local page. validate and verdicts read the sealed result. |
| Support historical records without relabelling | A sealed temporary copy of the retained v1 fixture validated. Feedback import preserved nested v1 evidence headers while producing a new v2 session. |
| Preserve hashes, native assets and historical records | Read-only reports kept byte-and-mode digests unchanged. Source media stayed immutable. No original fixture was resealed or rewritten. |
| Reject unknown or mixed identities without writes | Sealed-run validation rejected both examples with exit 2 and unchanged digests. Compilation consumption did not reject mixed identities. |
| Keep report ownership and workflow completion separate | writing-reports consumed both versions through the collector. No evidence run was treated as a workflow receipt or implementation-completion proof. |
| Keep unsafe conversions read-only | No conversion path is declared. Historical mutation guards were reviewed. This review did not perform any in-place historical conversion. |

## Standards

No actionable documented-standard breaches or baseline code smells found in the changed hunks at dc75b3b33ab1f81c3c312cc38510dc3254ac2c5a. Reviewed contract declarations, current and historical record readers, mutation guards, CLI envelopes, viewer schema changes, report integration and affected guidance against the supplied AGENTS rules, skill-contracts boundaries, code-comments guidance and TypeScript/React guidance. Historical readers retain original headers; current producers use the new identifiers. The repeated header checks belong to separate contract owners and do not justify a shared abstraction for this change. Base-only metadata is not treated as a source defect. This is a static standards review, not a runtime acceptance verdict. No repository writes, builds, lint, tests, formatters or child agents were used.

Independent child: b645654f-4df4-43e9-b73b-e79193b4c304. Its verified review-axis/v1 handoff has SHA-256 6ae3d324bd06cd457e8f8e9b84847f78ea7a48e9b91fbbdde56892fc940f26c4. It ran no build, lint, tests or formatters.

## Spec

Reviewed frozen commit dc75b3b33ab1f81c3c312cc38510dc3254ac2c5a against the supplied three-dot base. One partial requirement: compiled metadata accepts mixed identity fields. Historical evidence and feedback readers retain stored identities, validate source hashes, and reject historical in-place annotation changes. No additional evidence-backed findings for native asset preservation, independently consumed case/results declarations, or separate report ownership. Validation: read-only source and diff inspection only. No builds, tests, formatters, child agents, or repository writes, as required.

Independent child: 2dc20cf9-65f8-475a-a66f-ccb5e3d24225. Its verified review-axis/v1 handoff has SHA-256 f1a74fcd95b4c7f67db873f04bad232429963b56ccec53dd6cc16983e1434d50. It ran no build, lint, tests or formatters.

### EVIDENCE09-SPEC-001 — Reject mixed compilation identities

| Field | Value |
|---|---|
| Severity | P2, blocking |
| ADR | NO ADR |
| File | mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts |
| Line | 201 |

The compilation consumer accepts mixed explicit contract identities. compiled.json with schemaVersion collect-evidence/v2 and schema unsupported/v999 passes when kind and planHash match. Both public dry-run and real collection returned success; real collection sealed a PASS run.

The contract says: “Explicit unknown identifiers, mixed identity fields and unversioned sealed record envelopes fail.” The initiative also requires artifact validation against its declared source contract.

**required_change:** Reject schema whenever consuming current compiled metadata. Keep the valid current kind and planHash checks. Add a consumer-visible regression that rejects mixed identity metadata before starting a driver or writing a run.

**validation_command:** `collect-evidence.ts run <compiled-current-workspace-with-added-schema-unsupported/v999> --dry-run --json; expect exit 2 and no destination writes. Repeat without --dry-run and verify the driver does not start.`

**Why this blocks:** The initiative requires artifact validation against its declared contract and rejection of unknown explicit identifiers. The evidence definition explicitly rejects mixed identity fields. This public operation currently executes an ambiguous artifact instead.

Reproduction used a new external workspace and a temporary repository. After successful init and compile, the review added only `schema: "unsupported/v999"` to current `compiled.json`. The existing kind and planHash stayed unchanged. The review then ran:

```sh
"$SOURCE/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts" run "$WORKSPACE" --dry-run --json
"$SOURCE/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts" run "$WORKSPACE" --json
```

Both returned exit 0 and success true. The second command captured the owned loopback page and sealed a run with a PASS verdict. The ambiguous compilation bytes remained unchanged. Expected: exit 2 before driver execution or destination creation.

## Validation

| Check | Observed result |
|---|---|
| Declared Bun suite, run once | 111 pass, 33 skip, 0 fail; 1237 assertions across 11 files |
| Evidence manifest validation | Exit 0; current and historical definitions resolve |
| Feedback manifest validation | Exit 0; collector contracts resolve through the owner |
| Public Playwright doctor | Exit 0; installed browser and actual recording probe available |
| Actual local planning and capture | init, render, compile and run exit 0; real 1280 × 720 PNGs and executed heading assertion; PASS |
| Current sealed capture consumers | validate, verdicts and report exit 0 for contracts-current-0003; PASS |
| Retained v1 evidence | validate and verdicts exit 0 on a correctly sealed temporary copy; original fixture unchanged |
| Feedback import, validate and export | All exit 0 for current and historical sources; source identities remain v2 and v1 respectively |
| writing-reports evidence | Current and historical inputs exit 0; historical report retains historical true |
| Unknown/mixed sealed-run headers | Both exit 2; stored bytes and modes unchanged |
| Mixed compilation header | Dry-run and actual run exit 0; defect reproduced |

The review opened the actual captured PNG. It shows “Evidence contract smoke” and the local-page text. This proves the small capture path, not complete viewer UX or native TUI/GUI behaviour. Browser, TUI and GUI opt-in suites account for the 33 skipped cases. No tools were installed during capture. No external publication, credentials or borrowed-session closure occurred.

Read-only digest checks include relative paths, SHA-256 file hashes and permission modes:

```json
[
  {
    "path": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-09-evidence/artifacts/evidence/contracts-current-0003",
    "before": "1f5a0a7cf03128441d53782a2414227f2a2d276346ab60137ef60d761c07569d",
    "after": "1f5a0a7cf03128441d53782a2414227f2a2d276346ab60137ef60d761c07569d",
    "unchanged": true
  },
  {
    "path": "/tmp/evidence09-review-veIm5f/historical",
    "before": "605f7457427f56b03320247e6a5d1f612c4b0e4ac445fcde1ef0c36479b66aff",
    "after": "605f7457427f56b03320247e6a5d1f612c4b0e4ac445fcde1ef0c36479b66aff",
    "unchanged": true
  },
  {
    "path": "/tmp/evidence09-review-veIm5f/unknown",
    "before": "122653dce424c50d13730c9315cf40a8734f3940686ec5ac54e8d824e587f98b",
    "after": "122653dce424c50d13730c9315cf40a8734f3940686ec5ac54e8d824e587f98b",
    "unchanged": true
  },
  {
    "path": "/tmp/evidence09-review-veIm5f/mixed",
    "before": "18fffc238043fd38864401450dc46a6f5f1195eee648686537e160732a4a49d0",
    "after": "18fffc238043fd38864401450dc46a6f5f1195eee648686537e160732a4a49d0",
    "unchanged": true
  }
]
```

Temporary smoke workspaces and captured copies were removed after evidence collection. The two owned axis panes were closed. Both resource observers report shutdown confirmed. The owned loopback smoke servers stopped. The parent owns the review pane, tracker comment, projections, completion and commits.

## Verdict

FAILURE. Standards: 0 findings. Spec: 1 blocking P2 finding. The successful integration checks do not cover the missing mixed-identity compilation rejection.
