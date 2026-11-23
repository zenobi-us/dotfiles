---
description: Independent exact-source Standards and Spec review with actual integration evidence
title: Artifact-sharing review 0044
type: Concept
---

# Review result 0044

## Verdict

FAILURE. Independent static axes: Standards 0 findings; Spec 0 findings. Required integration validation: 1 blocking finding. No applicable ADR; the sole indexed ADR concerns Pi Ink cleanup.

## Exact source

Ticket: `tracker/tickets/skill-contract-manifests-11-artifact-sharing.md`. Parent specification: `tracker/initiatives/skill-contract-manifests/index.md`.

Timestamp: `2026-11-23T11:20:53.203Z`. Source branch: `feature/skill-contract-manifests-11-artifact-sharing`. Base branch: `master`.

Reviewed commit: `7eeefdfed44d18bc6bea9c482b438bf4e43f6ef8`. Reviewed tree: `b70d4a21bb53f54c5c41a47e036842d192add4ca`. Review base: `ea330e4818c97d11a57db1a28b385b7ab7907f95`.

Source checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing`. Publication checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`.

Reviewed the complete 28-file diff, not only the last fix:

`git diff ea330e4818c97d11a57db1a28b385b7ab7907f95...7eeefdfed44d18bc6bea9c482b438bf4e43f6ef8`

## Scope and contracts

```json
{
  "changed_scope": [
    "mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares",
    "mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json",
    "mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json"
  ],
  "affected_contracts": [
    "artifact-share configuration v1/v2",
    "artifact-share metadata v1/v2",
    "share index",
    "artifact-share-consumer-history/v1",
    "existing repository consumer upgrades",
    "MDX ingestion"
  ],
  "integration_checks": [
    {
      "argv": [
        "mise",
        "exec",
        "--",
        "bun",
        "test",
        "mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test"
      ]
    }
  ]
}
```

## Standards

No documented-standard breaches or actionable heuristic smells found in the entire 28-file pinned diff. No applicable ADR; the listed Pi Ink ADR does not cover this change.

STANDARDS-003 is addressed in source: assets/repo-template/press.config.tsx:31–33 routes share pages through interpretShareMetadata and retains pageSchema for ordinary pages. assets/repo-template/src/share-metadata.ts:14–30 rejects unknown identities, missing required fields, malformed hashes and wrong owned wire types after lossless historical hash interpretation.

SPEC-005 is addressed in source: contracts.json:3–11 declares the consumer-history family and definition. scripts/artifact-shares/consumers.ts:20–28 validates identity and complete structure, including supported unversioned input. Line 36 loads that validated history before replacement planning. The JSON schema rejects unknown fields and malformed snapshot maps.

Fresh verification was static inspection, including the new actual-builder rejection cases and isolated-installation upgrade cases. No tests, builds, lint, formatting or source mutations ran. Runtime validation remains with the parent. Proposed commands: mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/site.test.ts; mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/consumers.test.ts.

## Spec

PASS — no evidence-backed Spec findings in the complete 28-file exact diff. Reviewed configuration v1/v2, metadata v1/v2, share index, consumer-history/v1, historical consumer upgrades, MDX ingestion, guidance, and plugin versions against the ticket and parent initiative. No applicable ADR; the sole indexed ADR concerns Pi Ink cleanup.

Fresh static verification closes STANDARDS-003: assets/repo-template/press.config.tsx:31–33 now calls interpretShareMetadata for content/shares pages. assets/repo-template/src/share-metadata.ts:13–32 validates the explicit identity, required owned fields, hash grammar, date grammar, and description after lossless historical hash interpretation. Ordinary pages retain pageSchema.

Fresh static verification closes SPEC-005: contracts.json:3–11 declares consumer-history/v1. scripts/artifact-shares/consumers.ts:20–28 rejects unsupported explicit identities and validates the complete asset against the authoritative schema. Line 36 loads that validated history before replacement planning. Historical unversioned interpretation does not rewrite the asset.

The changed tests cover actual owning configuration commands, generation and retrieval, isolated installed history rejection, replacement rollback, and real MDX builds. Their results remain unverified here. Per the assigned read-only boundary, no tests, builds, lint, formatters, source edits, or workflow publication ran. Parent validation command: mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test.

## Integration finding

The reviewer observed this failure after both read-only axis sessions completed. It is separate from their static reports.

```json
{
  "id": "VALIDATION-001",
  "severity": "P2",
  "adr": "No applicable ADR",
  "file": "mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/contracts.test.ts",
  "line": 62,
  "description": "The required affected suite fails. The new historical retrieval regression times out at Bun's default 5000 ms after 5009.05 ms. Its async body then reads a fixture already removed by afterEach, producing an unhandled ENOENT at line 86. Observed result: 36 pass, 1 fail, 1 error. The separate owning-command scenario passed; no product defect is established by this timeout.",
  "required_change": "Make the historical retrieval regression complete reliably under its declared deadline. Use an explicit integration-test timeout consistent with nearby owning-command tests, and ensure fixture cleanup cannot race outstanding command work. Keep all historical identity and byte-preservation assertions. Run the required affected suite successfully before acceptance.",
  "validation_command": "mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test"
}
```

## Runtime verification

```json
[
  {
    "argv": [
      "mise",
      "exec",
      "--",
      "bun",
      "test",
      "mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "source_commit": "7eeefdfed44d18bc6bea9c482b438bf4e43f6ef8",
    "source_tree": "b70d4a21bb53f54c5c41a47e036842d192add4ca",
    "exit_code": 1,
    "result": "36 pass; 1 fail; 1 error; 794 expect() calls; 37 tests across 4 files; 172.04 s. contracts.test.ts:62 historical publication retrieval validates identity without rewriting authored pages or assets timed out at 5009.05 ms against the default 5000 ms deadline. Its asynchronous body then raised unhandled ENOENT at contracts.test.ts:86 while reading /tmp/artifact-contracts-upBydy/private/content/shares/42226e907802.mdx after fixture cleanup. Bun reported killing 1 dangling process. The required suite ran once; no rerun or timeout override was used."
  },
  {
    "argv": [
      "mise",
      "exec",
      "--",
      "bun",
      "/tmp/review-0044-smoke.ts"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "source_commit": "7eeefdfed44d18bc6bea9c482b438bf4e43f6ef8",
    "source_tree": "b70d4a21bb53f54c5c41a47e036842d192add4ca",
    "exit_code": 0,
    "result": "Throwaway scenario passed. Configuration read preserves bytes; authorized mutation upgrades losslessly. Unknown configuration rejected unchanged. Frozen consumer preview/apply/idempotence preserves authored settings, registries, assets and configuration. Unknown/malformed history rejects preview and apply unchanged. New v2 generation passes repository checks; historical retrieval retains page bytes. Actual Fumapress build accepts current and historical pages; malformed hash, missing source and unknown identity reject without rewriting. Fixtures and generated dry-run stage removed."
  }
]
```

STANDARDS-003: the actual MDX build now rejects malformed v2 hashes and missing required owned fields. Ordinary content pages remain supported by the affected suite. SPEC-005: actual isolated owning upgrade commands reject unknown identities and malformed history before mutation. Supported historical snapshots upgrade without rewriting stored publication history.

Earlier findings remain in immutable review history. This attempt does not repeat resolved findings or authorize publication. No source files or permanent tests changed. No external publication or authentication side effects occurred.

### Actual command evidence

The scenario used an isolated installed copy and a disposable Git repository. The full command results follow. Nonzero exits marked expected are successful rejection checks. All disposable fixtures and the generated dry-run stage were removed. The temporary smoke script is not a permanent test.

```json
[
  {
    "argv": [
      "git",
      "init",
      "-q",
      "/tmp/review-0044-scenario-LvrKrR/private"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR",
    "exit_code": 0,
    "expected": 0,
    "result": "\n"
  },
  {
    "argv": [
      "/tmp/review-0044-scenario-LvrKrR/runtime/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "list"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR",
    "exit_code": 0,
    "expected": 0,
    "result": "private  [0 shares]\n  repo:  private/example\n  pages: disabled\n  clone: /tmp/review-0044-scenario-LvrKrR/private\n\n"
  },
  {
    "argv": [
      "/tmp/review-0044-scenario-LvrKrR/runtime/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "upgrade",
      "private",
      "--dry-run"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR",
    "exit_code": 0,
    "expected": 0,
    "result": "{\n  \"dryRun\": true,\n  \"changedFiles\": [\n    \".mise/tasks/checks/types.ts\",\n    \"src/share-metadata.ts\",\n    \"press.config.tsx\"\n  ],\n  \"unchanged\": false,\n  \"remoteOperations\": false\n}\n\n"
  },
  {
    "argv": [
      "/tmp/review-0044-scenario-LvrKrR/runtime/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "upgrade",
      "private",
      "--dry-run"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR",
    "exit_code": 1,
    "expected": 1,
    "result": "\nError: Unsupported explicit consumer history contract.\n"
  },
  {
    "argv": [
      "/tmp/review-0044-scenario-LvrKrR/runtime/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "upgrade",
      "private",
      "--confirm",
      "private"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR",
    "exit_code": 1,
    "expected": 1,
    "result": "\nError: Unsupported explicit consumer history contract.\n"
  },
  {
    "argv": [
      "/tmp/review-0044-scenario-LvrKrR/runtime/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "upgrade",
      "private",
      "--dry-run"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR",
    "exit_code": 1,
    "expected": 1,
    "result": "\nError: Invalid consumer history: [{\"instancePath\":\"/latest/commit\",\"schemaPath\":\"#/definitions/commit/pattern\",\"keyword\":\"pattern\",\"params\":{\"pattern\":\"^(?:[a-f0-9]{40}|[a-f0-9]{64})$\"},\"message\":\"must match pattern \\\"^(?:[a-f0-9]{40}|[a-f0-9]{64})$\\\"\"}]\n"
  },
  {
    "argv": [
      "/tmp/review-0044-scenario-LvrKrR/runtime/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "upgrade",
      "private",
      "--confirm",
      "private"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR",
    "exit_code": 1,
    "expected": 1,
    "result": "\nError: Invalid consumer history: [{\"instancePath\":\"/latest/commit\",\"schemaPath\":\"#/definitions/commit/pattern\",\"keyword\":\"pattern\",\"params\":{\"pattern\":\"^(?:[a-f0-9]{40}|[a-f0-9]{64})$\"},\"message\":\"must match pattern \\\"^(?:[a-f0-9]{40}|[a-f0-9]{64})$\\\"\"}]\n"
  },
  {
    "argv": [
      "/tmp/review-0044-scenario-LvrKrR/runtime/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "upgrade",
      "private",
      "--confirm",
      "private"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR",
    "exit_code": 0,
    "expected": 0,
    "result": "types validation: ok (0 shares)\nsize check: ok (1 KiB published)\nmetadata check: ok (0 image(s))\nsecrets check: ok (offline scan of .)\n{\n  \"changedFiles\": [\n    \".mise/tasks/checks/types.ts\",\n    \"src/share-metadata.ts\",\n    \"press.config.tsx\"\n  ],\n  \"remoteOperations\": false,\n  \"next\": \"Review and commit these local consumer changes before publishing.\"\n}\n\n[checks:types] $ /tmp/review-0044-scenario-LvrKrR/private/.mise/tasks/checks/types.ts\n[checks:size] $ /tmp/review-0044-scenario-LvrKrR/private/.mise/tasks/checks/size.ts\n[checks:metadata] $ /tmp/review-0044-scenario-LvrKrR/private/.mise/tasks/checks/metadata.ts\n[checks:secrets] $ /tmp/review-0044-scenario-LvrKrR/private/.mise/tasks/checks/secrets.ts\n"
  },
  {
    "argv": [
      "/tmp/review-0044-scenario-LvrKrR/runtime/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "upgrade",
      "private",
      "--confirm",
      "private"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR",
    "exit_code": 0,
    "expected": 0,
    "result": "{\n  \"dryRun\": false,\n  \"changedFiles\": [],\n  \"unchanged\": true,\n  \"remoteOperations\": false\n}\n\n"
  },
  {
    "argv": [
      "/tmp/review-0044-scenario-LvrKrR/runtime/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "config",
      "clone-root",
      "/tmp/review-0044-scenario-LvrKrR"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR",
    "exit_code": 0,
    "expected": 0,
    "result": "{\n  \"artifact\": \"/tmp/review-0044-scenario-LvrKrR/config.json\",\n  \"changed\": true,\n  \"from\": \"artifact-share-config/v1\",\n  \"to\": \"artifact-share-config/v2\",\n  \"status\": \"completed\"\n}\n\n"
  },
  {
    "argv": [
      "/tmp/review-0044-scenario-LvrKrR/runtime/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "config",
      "clone-root",
      "/not-used"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR",
    "exit_code": 1,
    "expected": 1,
    "result": "\nError: Unsupported explicit contract identifier; legacy detection is forbidden.\n"
  },
  {
    "argv": [
      "/tmp/review-0044-scenario-LvrKrR/runtime/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "share",
      "doc",
      "/tmp/review-0044-scenario-LvrKrR/report.html",
      "--dry-run"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR",
    "exit_code": 0,
    "expected": 0,
    "result": "size check: ok (0 KiB published)\nmetadata check: ok (0 image(s))\nsecrets check: ok (offline scan of /tmp/artifact-share-860951705127-D1Zc8c)\n{\n  \"dryRun\": true,\n  \"name\": \"private\",\n  \"repo\": \"private/example\",\n  \"kind\": \"doc\",\n  \"hash\": \"860951705127\",\n  \"title\": \"Review 376\",\n  \"url\": null,\n  \"repositoryPath\": \"content/shares/860951705127.mdx\",\n  \"page\": \"/tmp/artifact-share-860951705127-D1Zc8c/content/shares/860951705127.mdx\",\n  \"stage\": \"/tmp/artifact-share-860951705127-D1Zc8c\",\n  \"files\": [\n    \"report.html\"\n  ]\n}\n\nNothing was written to the clone and nothing was pushed.\nRead the page before you publish it:\n  cat /tmp/artifact-share-860951705127-D1Zc8c/content/shares/860951705127.mdx\n\n[checks:size] $ /tmp/review-0044-scenario-LvrKrR/private/.mise/tasks/checks/size.ts --root /tmp/artifact-share-860951705127-D1Zc8c\n[checks:metadata] $ /tmp/review-0044-scenario-LvrKrR/private/.mise/tasks/checks/metadata.ts --root /tmp/artifact-share-860951705127-D1Zc8c\n[checks:secrets] $ /tmp/review-0044-scenario-LvrKrR/private/.mise/tasks/checks/secrets.ts --root /tmp/artifact-share-860951705127-D1Zc8c\n"
  },
  {
    "argv": [
      "/tmp/review-0044-scenario-LvrKrR/runtime/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "check",
      "--into",
      "private"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR",
    "exit_code": 0,
    "expected": 0,
    "result": "types validation: ok (1 shares)\nsize check: ok (1 KiB published)\nmetadata check: ok (0 image(s))\nsecrets check: ok (offline scan of .)\n\n[checks:types] $ /tmp/review-0044-scenario-LvrKrR/private/.mise/tasks/checks/types.ts\n[checks:size] $ /tmp/review-0044-scenario-LvrKrR/private/.mise/tasks/checks/size.ts\n[checks:metadata] $ /tmp/review-0044-scenario-LvrKrR/private/.mise/tasks/checks/metadata.ts\n[checks:secrets] $ /tmp/review-0044-scenario-LvrKrR/private/.mise/tasks/checks/secrets.ts\n"
  },
  {
    "argv": [
      "/tmp/review-0044-scenario-LvrKrR/runtime/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "share",
      "doc",
      "/tmp/review-0044-scenario-LvrKrR/report.html",
      "--dry-run"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR",
    "exit_code": 0,
    "expected": 0,
    "result": "{\n  \"hash\": \"860951705127\",\n  \"kind\": \"doc\",\n  \"url\": null,\n  \"repositoryPath\": \"content/shares/860951705127.mdx\",\n  \"unchanged\": true,\n  \"dryRun\": true\n}\n\n"
  },
  {
    "argv": [
      "mise",
      "exec",
      "--",
      "bun",
      "install",
      "--frozen-lockfile"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR/private",
    "exit_code": 0,
    "expected": 0,
    "result": "bun install v1.3.14 (0d9b296a)\n\n+ @tailwindcss/vite@4.3.3\n+ @types/bun@1.4.2\n+ @types/mdx@2.0.14\n+ @types/node@26.6.1\n+ @types/react@19.3.0\n+ @types/react-dom@19.3.0\n+ tailwindcss@4.3.3\n+ typescript@7.0.2\n+ vite@8.3.0\n+ @base-ui/react@1.8.0\n+ fumadocs-core@16.15.11\n+ fumadocs-mdx@15.4.1\n+ fumadocs-ui@16.15.11\n+ fumapress@1.3.1\n+ react@19.3.0\n+ react-dom@19.3.0\n+ zod@4.6.5\n\n335 packages installed [623.00ms]\n\n"
  },
  {
    "argv": [
      "mise",
      "exec",
      "--",
      "bunx",
      "--no-install",
      "fumapress",
      "build"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR/private",
    "exit_code": 0,
    "expected": 0,
    "result": "legacy-S00JNOtR.js           1.11 kB │ gzip:  0.58 kB\ndist/public/assets/orama-cloud-tws1J99R.js                  1.17 kB │ gzip:  0.60 kB\ndist/public/assets/not-found-DCNKO7tL.js                    1.20 kB │ gzip:  0.68 kB\ndist/public/assets/search-default-FVlIWvCy.js               1.70 kB │ gzip:  0.89 kB\ndist/public/assets/image-D8wtZcfN.js                        2.38 kB │ gzip:  1.22 kB\ndist/public/assets/root-A8cOnMsU.js                         2.71 kB │ gzip:  1.37 kB\ndist/public/assets/dist-CVekOVNe.js                         2.81 kB │ gzip:  1.17 kB\ndist/public/assets/use-copy-button-vMEKYO_R.js              3.17 kB │ gzip:  1.46 kB\ndist/public/assets/dist-cujoUq-n.js                         6.34 kB │ gzip:  2.65 kB\ndist/public/assets/useOpenChangeComplete-13t92YSt.js        6.69 kB │ gzip:  2.97 kB\ndist/public/assets/inertValue-BQzRvE82.js                   7.59 kB │ gzip:  3.00 kB\ndist/public/assets/mixedbread-DFXYoRbb.js                  11.96 kB │ gzip:  5.38 kB\ndist/public/assets/i18n-CDzM0APh.js                        16.88 kB │ gzip:  5.83 kB\ndist/public/assets/framework-9PU-PjSW.js                   29.07 kB │ gzip: 10.47 kB\ndist/public/assets/createLucideIcon-yPNOTvq1.js            29.96 kB │ gzip: 12.38 kB\ndist/public/assets/url-BVHvi3_K-DzV1GFxR.js                30.93 kB │ gzip: 11.34 kB\ndist/public/assets/flexsearch-static-CDqSGHu7.js           51.85 kB │ gzip: 17.79 kB\ndist/public/assets/orama-static-Cv5QauEZ.js                73.98 kB │ gzip: 25.72 kB\ndist/public/assets/docs-DInIFtRs.js                       128.55 kB │ gzip: 43.25 kB\ndist/public/assets/index-B3vjtRqF.js                      275.79 kB │ gzip: 87.64 kB\ndist/public/assets/client-DQhGoYGE.js                     318.87 kB │ gzip: 96.37 kB\n\n✓ built in 1.07s\n[5/5] build ssr environment...\nvite v8.3.0 building ssr environment for production...\ntransforming...\n✓ 2559 modules transformed.\nrendering chunks...\ncomputing gzip size...\ndist/server/ssr/assets/pathname-CYLPlOwU.js                     0.31 kB │ gzip:   0.22 kB\ndist/server/ssr/assets/DirectionContext-C5R0DL2v.js             0.46 kB │ gzip:   0.27 kB\ndist/server/ssr/assets/client-C6m6CoYZ.js                       0.46 kB │ gzip:   0.28 kB\ndist/server/ssr/assets/link-8oFvHVfP.js                         0.70 kB │ gzip:   0.40 kB\ndist/server/ssr/assets/remove-undefined-CzMSKybq-wawLFuP2.js    0.77 kB │ gzip:   0.37 kB\ndist/server/ssr/assets/fetch-BUj69WRq.js                        0.87 kB │ gzip:   0.50 kB\ndist/server/ssr/assets/algolia-hzcp-hsQ.js                      1.43 kB │ gzip:   0.69 kB\ndist/server/ssr/assets/self-hosted-C3dgBznY.js                  1.45 kB │ gzip:   0.71 kB\ndist/server/ssr/assets/search-BEP2P1yr.js                       2.07 kB │ gzip:   0.88 kB\ndist/server/ssr/assets/orama-cloud-legacy-B_xDcyWu.js           2.19 kB │ gzip:   0.85 kB\ndist/server/ssr/assets/orama-cloud-DttF9nfG.js                  2.24 kB │ gzip:   0.87 kB\ndist/server/ssr/assets/not-found-C87MGVdK.js                    2.41 kB │ gzip:   1.10 kB\ndist/server/ssr/assets/search-default-B8A3eazl.js               2.79 kB │ gzip:   1.04 kB\ndist/server/ssr/assets/image-CynYGsKy.js                        5.09 kB │ gzip:   1.88 kB\ndist/server/ssr/assets/root-DPL5OgPj.js                         5.88 kB │ gzip:   2.13 kB\ndist/server/ssr/assets/dist-CgCk13CT.js                         6.28 kB │ gzip:   1.80 kB\ndist/server/ssr/assets/use-copy-button-BPui7v7t.js              9.03 kB │ gzip:   2.72 kB\ndist/server/ssr/assets/dist-BFq0vv4f.js                        15.91 kB │ gzip:   5.30 kB\ndist/server/ssr/assets/mixedbread-WSXT_DPS.js                  15.96 kB │ gzip:   6.59 kB\ndist/server/ssr/assets/client-vLuqtVPq.js                      17.91 kB │ gzip:   5.52 kB\ndist/server/ssr/assets/react-DvKm3E9D.js                       19.33 kB │ gzip:   5.17 kB\ndist/server/ssr/assets/useOpenChangeComplete-BAFdKl1k.js       21.42 kB │ gzip:   6.78 kB\ndist/server/ssr/assets/inertValue-Dh6tvwoo.js                  22.85 kB │ gzip:   6.33 kB\ndist/server/ssr/assets/i18n-DJtUno1M.js                        55.82 kB │ gzip:  15.16 kB\ndist/server/ssr/assets/createLucideIcon-D3Ls_j7V.js            56.17 kB │ gzip:  16.86 kB\ndist/server/ssr/assets/framework-BzwNOiMM.js                   66.85 kB │ gzip:  16.63 kB\ndist/server/ssr/assets/flexsearch-static-DvNrh7YI.js           73.78 kB │ gzip:  21.55 kB\ndist/server/ssr/assets/url-BVHvi3_K-BG8Vd4qf.js                80.39 kB │ gzip:  19.23 kB\ndist/server/ssr/assets/orama-static-BYQIO_nV.js               149.97 kB │ gzip:  36.36 kB\ndist/server/ssr/assets/docs-SQCpTQVK.js                       298.77 kB │ gzip:  67.08 kB\ndist/server/ssr/index.js                                      546.99 kB │ gzip: 108.20 kB\ndist/server/ssr/assets/client-C3389TmW.js                     811.08 kB │ gzip: 184.15 kB\n\n✓ built in 1.22s\n[ssg] processing static generation...\n✓ 21 files generated in 231ms\n\n[Fumapress] \"site.baseUrl\" is not set; sitemap and RSS will fall back to relative URLs.\n"
  },
  {
    "argv": [
      "mise",
      "exec",
      "--",
      "bunx",
      "--no-install",
      "fumapress",
      "build"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR/private",
    "exit_code": 1,
    "expected": 1,
    "result": "[1/5] analyze client references...\nvite v8.3.0 building rsc environment for production...\ntransforming...\n✓ 2316 modules transformed.\n\n✗ Build failed in 1.61s\nBuild failed with 2 errors:\n\n[plugin fumadocs-mdx:mdx] /tmp/review-0044-scenario-LvrKrR/private/content/shares/boundary.mdx?macro_id=press.config.tsx%23docs&only=frontmatter\nError: Share metadata requires a kind, 12-character hash and YYYY-MM-DD date.\n    at interpretShareMetadata (/tmp/review-0044-scenario-LvrKrR/private/src/share-metadata.ts:43:9)\n    at Object.eval [as transform] (/tmp/review-0044-scenario-LvrKrR/private/press.config.tsx:32:170)\n    at inst._zod.parse (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/classic/schemas.js:1218:28)\n    at Internals.wrapped (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/memoizer.js:213:24)\n    at inst._zod.parse (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/schemas.js:2281:34)\n    at validateAsync (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/schemas.js:135:46)\n    at Object.validate (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/schemas.js:148:20)\n    at validate (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumadocs-mdx/dist/core-BHawVsTm.js:98:44)\n    at transformMetadata (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumadocs-mdx/dist/core-BHawVsTm.js:123:39)\n    at Object.transformFrontmatter (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumadocs-mdx/dist/core-BHawVsTm.js:263:17)\n[plugin fumadocs-mdx:mdx] /tmp/review-0044-scenario-LvrKrR/private/content/shares/boundary.mdx?macro_id=press.config.tsx%23docs\nError: Share metadata requires a kind, 12-character hash and YYYY-MM-DD date.\n    at interpretShareMetadata (/tmp/review-0044-scenario-LvrKrR/private/src/share-metadata.ts:43:9)\n    at Object.eval [as transform] (/tmp/review-0044-scenario-LvrKrR/private/press.config.tsx:32:170)\n    at inst._zod.parse (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/classic/schemas.js:1218:28)\n    at Internals.wrapped (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/memoizer.js:213:24)\n    at inst._zod.parse (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/schemas.js:2281:34)\n    at validateAsync (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/schemas.js:135:46)\n    at Object.validate (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/schemas.js:148:20)\n    at validate (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumadocs-mdx/dist/core-BHawVsTm.js:98:44)\n    at transformMetadata (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumadocs-mdx/dist/core-BHawVsTm.js:123:39)\n    at Object.transformFrontmatter (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumadocs-mdx/dist/core-BHawVsTm.js:263:17)\n    at aggregateBindingErrorsIntoJsError (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/rolldown/dist/shared/error-CGhV1ebk.mjs:48:18)\n    at unwrapBindingResult (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/rolldown/dist/shared/error-CGhV1ebk.mjs:18:128)\n    at #build (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/rolldown/dist/shared/rolldown-Ld3ZGGCt.mjs:133:34)\n    at async buildEnvironment (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/vite/dist/node/chunks/node.js:34082:66)\n    at async Object.build (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/vite/dist/node/chunks/node.js:34503:19)\n    at async buildApp (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/@vitejs/plugin-rsc/dist/plugin-CLvIS10V.js:727:3)\n    at async BasicMinimalPluginContext.handler (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/@vitejs/plugin-rsc/dist/plugin-CLvIS10V.js:856:43)\n    at async Object.buildApp (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/vite/dist/node/chunks/node.js:34497:5)\n    at async runBuild (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumapress/dist/cli.js:181:2)\n    at async run (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumapress/dist/cli.js:43:3) {\n  errors: [Getter/Setter]\n}\n"
  },
  {
    "argv": [
      "mise",
      "exec",
      "--",
      "bunx",
      "--no-install",
      "fumapress",
      "build"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR/private",
    "exit_code": 1,
    "expected": 1,
    "result": "[1/5] analyze client references...\nvite v8.3.0 building rsc environment for production...\ntransforming...\n✓ 2316 modules transformed.\n\n✗ Build failed in 1.58s\nBuild failed with 2 errors:\n\n[plugin fumadocs-mdx:mdx] /tmp/review-0044-scenario-LvrKrR/private/content/shares/boundary.mdx?macro_id=press.config.tsx%23docs\nError: Share metadata source must be a string.\n    at interpretShareMetadata (/tmp/review-0044-scenario-LvrKrR/private/src/share-metadata.ts:39:44)\n    at Object.eval [as transform] (/tmp/review-0044-scenario-LvrKrR/private/press.config.tsx:32:170)\n    at inst._zod.parse (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/classic/schemas.js:1218:28)\n    at Internals.wrapped (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/memoizer.js:213:24)\n    at inst._zod.parse (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/schemas.js:2281:34)\n    at validateAsync (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/schemas.js:135:46)\n    at Object.validate (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/schemas.js:148:20)\n    at validate (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumadocs-mdx/dist/core-BHawVsTm.js:98:44)\n    at transformMetadata (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumadocs-mdx/dist/core-BHawVsTm.js:123:39)\n    at Object.transformFrontmatter (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumadocs-mdx/dist/core-BHawVsTm.js:263:17)\n[plugin fumadocs-mdx:mdx] /tmp/review-0044-scenario-LvrKrR/private/content/shares/boundary.mdx?macro_id=press.config.tsx%23docs&only=frontmatter\nError: Share metadata source must be a string.\n    at interpretShareMetadata (/tmp/review-0044-scenario-LvrKrR/private/src/share-metadata.ts:39:44)\n    at Object.eval [as transform] (/tmp/review-0044-scenario-LvrKrR/private/press.config.tsx:32:170)\n    at inst._zod.parse (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/classic/schemas.js:1218:28)\n    at Internals.wrapped (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/memoizer.js:213:24)\n    at inst._zod.parse (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/schemas.js:2281:34)\n    at validateAsync (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/schemas.js:135:46)\n    at Object.validate (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/schemas.js:148:20)\n    at validate (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumadocs-mdx/dist/core-BHawVsTm.js:98:44)\n    at transformMetadata (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumadocs-mdx/dist/core-BHawVsTm.js:123:39)\n    at Object.transformFrontmatter (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumadocs-mdx/dist/core-BHawVsTm.js:263:17)\n    at aggregateBindingErrorsIntoJsError (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/rolldown/dist/shared/error-CGhV1ebk.mjs:48:18)\n    at unwrapBindingResult (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/rolldown/dist/shared/error-CGhV1ebk.mjs:18:128)\n    at #build (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/rolldown/dist/shared/rolldown-Ld3ZGGCt.mjs:133:34)\n    at async buildEnvironment (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/vite/dist/node/chunks/node.js:34082:66)\n    at async Object.build (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/vite/dist/node/chunks/node.js:34503:19)\n    at async buildApp (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/@vitejs/plugin-rsc/dist/plugin-CLvIS10V.js:727:3)\n    at async BasicMinimalPluginContext.handler (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/@vitejs/plugin-rsc/dist/plugin-CLvIS10V.js:856:43)\n    at async Object.buildApp (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/vite/dist/node/chunks/node.js:34497:5)\n    at async runBuild (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumapress/dist/cli.js:181:2)\n    at async run (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumapress/dist/cli.js:43:3) {\n  errors: [Getter/Setter]\n}\n"
  },
  {
    "argv": [
      "mise",
      "exec",
      "--",
      "bunx",
      "--no-install",
      "fumapress",
      "build"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR/private",
    "exit_code": 1,
    "expected": 1,
    "result": "[1/5] analyze client references...\nvite v8.3.0 building rsc environment for production...\ntransforming...\n✓ 2316 modules transformed.\n\n✗ Build failed in 1.59s\nBuild failed with 2 errors:\n\n[plugin fumadocs-mdx:mdx] /tmp/review-0044-scenario-LvrKrR/private/content/shares/boundary.mdx?macro_id=press.config.tsx%23docs&only=frontmatter\nError: Unsupported explicit share metadata contract.\n    at interpretShareMetadata (/tmp/review-0044-scenario-LvrKrR/private/src/share-metadata.ts:19:9)\n    at Object.eval [as transform] (/tmp/review-0044-scenario-LvrKrR/private/press.config.tsx:32:170)\n    at inst._zod.parse (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/classic/schemas.js:1218:28)\n    at Internals.wrapped (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/memoizer.js:213:24)\n    at inst._zod.parse (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/schemas.js:2281:34)\n    at validateAsync (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/schemas.js:135:46)\n    at Object.validate (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/schemas.js:148:20)\n    at validate (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumadocs-mdx/dist/core-BHawVsTm.js:98:44)\n    at transformMetadata (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumadocs-mdx/dist/core-BHawVsTm.js:123:39)\n    at Object.transformFrontmatter (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumadocs-mdx/dist/core-BHawVsTm.js:263:17)\n[plugin fumadocs-mdx:mdx] /tmp/review-0044-scenario-LvrKrR/private/content/shares/boundary.mdx?macro_id=press.config.tsx%23docs\nError: Unsupported explicit share metadata contract.\n    at interpretShareMetadata (/tmp/review-0044-scenario-LvrKrR/private/src/share-metadata.ts:19:9)\n    at Object.eval [as transform] (/tmp/review-0044-scenario-LvrKrR/private/press.config.tsx:32:170)\n    at inst._zod.parse (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/classic/schemas.js:1218:28)\n    at Internals.wrapped (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/memoizer.js:213:24)\n    at inst._zod.parse (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/schemas.js:2281:34)\n    at validateAsync (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/schemas.js:135:46)\n    at Object.validate (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/zod/v4/core/schemas.js:148:20)\n    at validate (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumadocs-mdx/dist/core-BHawVsTm.js:98:44)\n    at transformMetadata (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumadocs-mdx/dist/core-BHawVsTm.js:123:39)\n    at Object.transformFrontmatter (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumadocs-mdx/dist/core-BHawVsTm.js:263:17)\n    at aggregateBindingErrorsIntoJsError (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/rolldown/dist/shared/error-CGhV1ebk.mjs:48:18)\n    at unwrapBindingResult (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/rolldown/dist/shared/error-CGhV1ebk.mjs:18:128)\n    at #build (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/rolldown/dist/shared/rolldown-Ld3ZGGCt.mjs:133:34)\n    at async buildEnvironment (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/vite/dist/node/chunks/node.js:34082:66)\n    at async Object.build (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/vite/dist/node/chunks/node.js:34503:19)\n    at async buildApp (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/@vitejs/plugin-rsc/dist/plugin-CLvIS10V.js:727:3)\n    at async BasicMinimalPluginContext.handler (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/@vitejs/plugin-rsc/dist/plugin-CLvIS10V.js:856:43)\n    at async Object.buildApp (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/vite/dist/node/chunks/node.js:34497:5)\n    at async runBuild (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumapress/dist/cli.js:181:2)\n    at async run (file:///tmp/review-0044-scenario-LvrKrR/private/node_modules/fumapress/dist/cli.js:43:3) {\n  errors: [Getter/Setter]\n}\n"
  },
  {
    "argv": [
      "/tmp/review-0044-scenario-LvrKrR/runtime/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "share",
      "doc",
      "/tmp/review-0044-scenario-LvrKrR/report.html",
      "--dry-run"
    ],
    "cwd": "/tmp/review-0044-scenario-LvrKrR",
    "exit_code": 1,
    "expected": 1,
    "result": "\nError: Unsupported explicit share metadata contract.\n"
  }
]
```

## Coordination and shutdown

```json
{
  "coordination": {
    "inventoryComplete": false,
    "hardBlockers": [],
    "risks": [
      "Package/plugin version metadata overlaps retained streams; reconcile current base and affected contracts before integration.",
      "Retained missing unrelated temporary checkout and legacy goal diagnostics leave inventory incomplete. No concrete exact-source review blocker."
    ],
    "exclusive_resources": "No external hosting, authentication or publication operation acquired."
  },
  "shutdown": {
    "children": [
      {
        "run_id": "aa2c49a7-03d2-43fd-854a-3cff98b87483",
        "report": {
          "schemaVersion": "muxer-resource-report/v2",
          "manifest": {
            "schemaVersion": "muxer-run/v2",
            "runId": "aa2c49a7-03d2-43fd-854a-3cff98b87483",
            "muxer": "herdr-app",
            "agent": "omp",
            "target": "t254",
            "createdAt": "2026-11-23T11:14:35.633Z",
            "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
            "operationId": "aa2c49a7-03d2-43fd-854a-3cff98b87483",
            "parentRunId": "094b6415-2eba-41d0-b48a-e8bd909eab50"
          },
          "resources": {
            "schemaVersion": "muxer-resources/v2",
            "runId": "aa2c49a7-03d2-43fd-854a-3cff98b87483",
            "observedAt": "2026-11-23T11:18:04.826Z",
            "processes": [
              {
                "pid": 145222,
                "bootId": "1093b557-9bca-45b2-a143-4217cd820f51",
                "startTicks": "13777795",
                "command": "omp",
                "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
                "state": "running"
              },
              {
                "pid": 162287,
                "bootId": "1093b557-9bca-45b2-a143-4217cd820f51",
                "startTicks": "13785911",
                "command": "omp",
                "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
                "state": "running"
              }
            ],
            "shutdown": "pending"
          }
        },
        "pane_removed": true
      },
      {
        "run_id": "7a5b19a2-3197-4ae0-a718-be25710fc3f8",
        "report": {
          "schemaVersion": "muxer-resource-report/v2",
          "manifest": {
            "schemaVersion": "muxer-run/v2",
            "runId": "7a5b19a2-3197-4ae0-a718-be25710fc3f8",
            "muxer": "herdr-app",
            "agent": "omp",
            "target": "t255",
            "createdAt": "2026-11-23T11:14:35.624Z",
            "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
            "operationId": "7a5b19a2-3197-4ae0-a718-be25710fc3f8",
            "parentRunId": "094b6415-2eba-41d0-b48a-e8bd909eab50"
          },
          "resources": {
            "schemaVersion": "muxer-resources/v2",
            "runId": "7a5b19a2-3197-4ae0-a718-be25710fc3f8",
            "observedAt": "2026-11-23T11:18:05.451Z",
            "processes": [
              {
                "pid": 145264,
                "bootId": "1093b557-9bca-45b2-a143-4217cd820f51",
                "startTicks": "13777796",
                "command": "omp",
                "parentPid": 144613,
                "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
                "state": "stopped"
              }
            ],
            "shutdown": "confirmed"
          }
        },
        "pane_removed": true
      }
    ],
    "domain_services": [],
    "summary": "Both owned child tabs were closed and removed with hc kill/hc rm. herdr-app ls confirms their absence. Spec shutdown confirmed. Standards observer still reports two tagged omp processes running after pane removal; retain pending shutdown separately from the review verdict. No broad or extra process signals sent. Parent owns reviewer terminal cleanup."
  }
}
```

## Consumed records

```json
[
  {
    "kind": "ticket",
    "ref": "tracker/tickets/skill-contract-manifests-11-artifact-sharing.md"
  },
  {
    "kind": "initiative",
    "ref": "tracker/initiatives/skill-contract-manifests/index.md"
  },
  {
    "kind": "review-input",
    "ref": "workflows/skill-contract-manifests-11-artifact-sharing/events/review-start-0043.yaml"
  },
  {
    "kind": "review-input",
    "ref": "workflows/skill-contract-manifests-11-artifact-sharing/events/fix-result-0040.yaml"
  },
  {
    "kind": "review-input",
    "ref": "workflows/skill-contract-manifests-11-artifact-sharing/events/fix-complete-0041.yaml"
  },
  {
    "kind": "review-input",
    "ref": "workflows/skill-contract-manifests-11-artifact-sharing/artifacts/snapshots/pr-draft-fix-0040.md"
  },
  {
    "kind": "review-input",
    "ref": "workflows/skill-contract-manifests-11-artifact-sharing/artifacts/reviews/review-review-result-0032.md"
  },
  {
    "kind": "review-input",
    "ref": "workflows/skill-contract-manifests-11-artifact-sharing/artifacts/snapshots/coordination-review-0043.json"
  },
  {
    "kind": "axis-result",
    "ref": "/var/home/zenobius/.local/state/result-delivery/runs/aa2c49a7-03d2-43fd-854a-3cff98b87483/result.json",
    "sha256": "6121b9e7128ed1b5a7e0bbc5675010a379df3e022169d4342f950a237ab2043a"
  },
  {
    "kind": "axis-result",
    "ref": "/var/home/zenobius/.local/state/result-delivery/runs/7a5b19a2-3197-4ae0-a718-be25710fc3f8/result.json",
    "sha256": "af643c31f56984f82283765e201fa34833fe338244698e5dd50debb895efdc30"
  }
]
```

## Axis handoff validation

```json
[
  {
    "axis": "Standards",
    "run_id": "aa2c49a7-03d2-43fd-854a-3cff98b87483",
    "payload_sha256": "13e07b9dd6b85c0af85c460fc7eae8ae388748a507c69b73b87a0245c15f96c4",
    "acknowledged": true
  },
  {
    "axis": "Spec",
    "run_id": "7a5b19a2-3197-4ae0-a718-be25710fc3f8",
    "payload_sha256": "5c2380dfbc307cf24b4579e46b395e919630f41c26424e322edfe5e027607c38",
    "acknowledged": true
  }
]
```

