---
title: Evidence compiled metadata fix
type: Concept
---

# Evidence compiled metadata fix

## Ticket summary

[skill-contract-manifests-09-evidence](../../../../tracker/tickets/skill-contract-manifests-09-evidence.md) adopts explicit evidence contracts and preserves historical evidence. This fix addresses only EVIDENCE09-SPEC-001.

## Problem statement

Current compiled metadata accepted an additional schema field. Both public run modes could accept mixed contract identities.

## Implementation summary

Reject the presence of schema in current compiled.json metadata. Preserve the schemaVersion, kind and planHash checks. Add a permanent public-command regression for dry-run and actual run rejection, input byte preservation, destination preservation, empty staging and no driver startup. Keep valid compilation and dry-run acceptance. Add owning contract guidance.

Source branch: feature/skill-contract-manifests-09-evidence. Base: master.
Source commit: 62f26327084f0dca065ee8ec065c0437cdc54c7d. Source tree: d802a953960f01c104a02959652453b55cc37201.
Source commits: 905748b5 (fix), 62f26327 (restore automatically generated version metadata). The version hook added two out-of-scope version changes. A separate corrective commit restored their original bytes with HK_SKIP_STEPS=bundle-versions. No existing source history was amended.

## Changed files

- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/evidence-schema.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts

## Validation results

The consumer regression failed before the fix because dry-run returned 0 instead of 2. The final focused regression passed: 1 test, 13 assertions. The integration suite passed: 112 pass, 33 skip, 0 fail across 11 files. The suite ran once. Skipped host-dependent cases were not claimed as exercised.

The separate public smoke used an external temporary Git repository and workspace. Init, compile and valid dry-run returned 0. With schema: unsupported/v999 added to compiled.json, dry-run and actual run returned 2. A PATH-resolved surf trap did not start. No staging entry or destination run was written. Inputs and stored historical evidence retained identical hashes. No capture, installation, external publication or credential operation occurred. Temporary smoke files were removed.

Exact command results and preservation checks:

```json
[
  {
    "argv": [
      "mise",
      "exec",
      "--",
      "bun",
      "test",
      "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts",
      "--test-name-pattern",
      "run rejects mixed compiled identity"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence",
    "exit_code": 1,
    "status": "expected-failure-before-fix",
    "summary": "Required consumer regression failed at exit-code assertion: expected 2, received 0."
  },
  {
    "argv": [
      "mise",
      "exec",
      "--",
      "bun",
      "test",
      "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts",
      "--test-name-pattern",
      "run rejects mixed compiled identity"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence",
    "exit_code": 0,
    "status": "passed",
    "summary": "1 pass, 96 filtered out, 13 assertions; final regression checks both public run modes."
  },
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
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence",
    "exit_code": 0,
    "status": "passed",
    "summary": "112 pass, 33 skip, 0 fail; 145 tests across 11 files, 1252 assertions."
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts",
      "init",
      "/tmp/evidence09-fix-a72p6M/workspace",
      "--repository",
      "/tmp/evidence09-fix-a72p6M/repository",
      "--workflow",
      "compiled-identity",
      "--run",
      "reject-mixed",
      "--driver",
      "surf",
      "--json"
    ],
    "cwd": "/tmp/evidence09-fix-a72p6M",
    "exit_code": 0,
    "stdout": "{\"schemaVersion\":\"collect-evidence/v2\",\"kind\":\"event\",\"command\":\"init\",\"success\":true,\"directory\":\"/tmp/evidence09-fix-a72p6M/workspace\",\"destination\":{\"kind\":\"evidence\",\"adapter\":\"files\",\"store\":\"repository\",\"root\":\"/tmp/evidence09-fix-a72p6M/repository\",\"path\":\"/tmp/evidence09-fix-a72p6M/repository/workflows/compiled-identity/artifacts/evidence/reject-mixed\",\"ref\":\"workflows/compiled-identity/artifacts/evidence/reject-mixed\",\"publication\":\"repository\"},\"next\":\"Author cases in plan.ts, then render and compile. Confirm the plan before run.\"}\n",
    "stderr": "",
    "status": "passed",
    "expected_exit_code": 0
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts",
      "compile",
      "/tmp/evidence09-fix-a72p6M/workspace",
      "--json"
    ],
    "cwd": "/tmp/evidence09-fix-a72p6M",
    "exit_code": 0,
    "stdout": "{\"schemaVersion\":\"collect-evidence/v2\",\"kind\":\"event\",\"command\":\"compile\",\"success\":true,\"directory\":\"/tmp/evidence09-fix-a72p6M/workspace\",\"driver\":\"surf\",\"tests\":1}\n",
    "stderr": "",
    "status": "passed",
    "expected_exit_code": 0
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts",
      "run",
      "/tmp/evidence09-fix-a72p6M/workspace",
      "--dry-run",
      "--json"
    ],
    "cwd": "/tmp/evidence09-fix-a72p6M",
    "exit_code": 0,
    "stdout": "{\"schemaVersion\":\"collect-evidence/v2\",\"kind\":\"event\",\"command\":\"run\",\"success\":true,\"dryRun\":true,\"destination\":{\"kind\":\"evidence\",\"adapter\":\"files\",\"store\":\"repository\",\"root\":\"/tmp/evidence09-fix-a72p6M/repository\",\"path\":\"/tmp/evidence09-fix-a72p6M/repository/workflows/compiled-identity/artifacts/evidence/reject-mixed\",\"ref\":\"workflows/compiled-identity/artifacts/evidence/reject-mixed\",\"publication\":\"repository\"},\"driver\":\"surf\",\"tests\":[\"case\"]}\n",
    "stderr": "",
    "status": "passed",
    "expected_exit_code": 0
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts",
      "run",
      "/tmp/evidence09-fix-a72p6M/workspace",
      "--dry-run",
      "--json"
    ],
    "cwd": "/tmp/evidence09-fix-a72p6M",
    "exit_code": 2,
    "stdout": "{\"schemaVersion\":\"collect-evidence/v2\",\"kind\":\"error\",\"command\":\"run\",\"success\":false,\"code\":2,\"message\":\"Plan changed or compilation is invalid; run compile --force\"}\n",
    "stderr": "Plan changed or compilation is invalid; run compile --force\n",
    "status": "passed",
    "expected_exit_code": 2
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts",
      "run",
      "/tmp/evidence09-fix-a72p6M/workspace",
      "--json"
    ],
    "cwd": "/tmp/evidence09-fix-a72p6M",
    "exit_code": 2,
    "stdout": "{\"schemaVersion\":\"collect-evidence/v2\",\"kind\":\"error\",\"command\":\"run\",\"success\":false,\"code\":2,\"message\":\"Plan changed or compilation is invalid; run compile --force\"}\n",
    "stderr": "Plan changed or compilation is invalid; run compile --force\n",
    "status": "passed",
    "expected_exit_code": 2
  },
  {
    "command": "Hash and directory comparison across both rejected public commands",
    "cwd": "/tmp/evidence09-fix-a72p6M",
    "status": "passed",
    "inputs_and_destination_unchanged": true,
    "history_unchanged": true,
    "compiled_sha256": "9a88cdb47b45ac53a863a9bfb9f51130631dca6aa54549814ebeef105096daf0",
    "driver_started": false,
    "staging_entries": [],
    "repository_entries": [
      ".context-routes.toml",
      ".git"
    ]
  },
  {
    "command": "Verify mise resolves isolated surf command trap",
    "cwd": "/tmp/evidence09-fix-a72p6M",
    "status": "passed",
    "argv": [
      "mise",
      "exec",
      "--",
      "which",
      "surf"
    ],
    "exit_code": 0,
    "resolved_path": "/tmp/evidence09-fix-a72p6M/bin/surf"
  }
]
```

## Review history

- [Initial implementation receipt](../../events/implementation-0002.yaml) and [snapshot](pr-draft-implementation-0002.md).
- [Review review-0005](../../events/review-0005.yaml): FAILURE for dc75b3b33ab1f81c3c312cc38510dc3254ac2c5a. [Immutable review artifact](../reviews/review-review-0005.md).
- [Parent review completion](../../events/review-complete-0006.yaml) preserves that failure.
- [Fix authorization](../../events/fix-start-0007.yaml) and [fix result](../../events/fix-0008.yaml).

## Resolved findings

EVIDENCE09-SPEC-001: resolved by this fix, pending fresh independent review. ADR: NO ADR.

## Remaining findings

No unresolved assigned findings. Fresh review of the new source is required.

## Latest reviewer verdict

No review covers the new source. Prior FAILURE is retained for its original source only.

## Merge status

Not merged. Ticket remains claimed. Parent owns the next independent review and phase completion.

## Open questions

None.

