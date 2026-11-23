---
description: Frozen-source standards and spec review with owning-command evidence
title: Independent artifact-sharing review
type: Concept
---

# Artifact-sharing review

## Verdict

FAILURE. Standards: no actionable findings. Spec: one blocking medium-severity compatibility finding, SPEC-004.

## Frozen identity

| Field | Value |
| --- | --- |
| Ticket | tracker/tickets/skill-contract-manifests-11-artifact-sharing.md |
| Initiative | tracker/initiatives/skill-contract-manifests/index.md |
| Reviewed commit | 3378f0d89811c8ce67feadcc0326f8c86764a0ae |
| Reviewed tree | 6138a98322ac55a4bb0cc4b5a0a10c2f3578c27b |
| Review base | b31360101dafd23ae07fe82dc3813973a56935e8 |
| Source branch | feature/skill-contract-manifests-11-artifact-sharing |
| Base branch | master |
| Timestamp | 2026-11-23T04:22:43.863Z |
| Parent receipt | review-start-0021 |
| Review result | review-result-0022 |
| Review run | bebff568-dfd5-45d5-9536-a2d51dcfe907 |

Diff command: `git diff b31360101dafd23ae07fe82dc3813973a56935e8...3378f0d89811c8ce67feadcc0326f8c86764a0ae`. Commits: e45c9119, 8d83701b, 2b9160cd, 9d875421, 3378f0d8.

## Scope and requirements

- **Skill:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares`.
- **Marketplace:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`.
- **Plugin:** `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`.

Read the ticket, initiative, CONTEXT-MAP.md, CONTEXT.md and docs/adr/index.md from the publication checkout. The only indexed ADR concerns Pi Ink and does not apply. Read prior review 0014, fix result 0018, parent completion 0019 and fix draft 0018 as retained provenance, not acceptance proof. The inspector reported valid history, exact clean source and one source candidate. The parent approved review ownership in review-approval-0020; unrelated inventory drift was not adopted.

## Standards

Standards: no actionable findings. Reviewed git diff b31360101dafd23ae07fe82dc3813973a56935e8...3378f0d89811c8ce67feadcc0326f8c86764a0ae across artifact-shares and both plugin manifests. Read the ticket, initiative, repository context, contract definitions, configuration owner and integration, metadata producer and consumers, consumer-upgrade implementation, guidance, and changed regression coverage. Configuration interpretation remains with its owner adapter; persistence reuses shared safeUpgrade. The CLI and repository checker share metadata interpretation. Consumer upgrades restrict replacements to recognized owned code and preserve authored site settings. No documented-standard breach or judgment-call smell established a concrete consumer risk. ADR: none applicable. This is a static review only. Tests, builds, linters, formatters, owning-command smoke checks, and remote operations were not run, as assigned. The parent owns runtime verification. Source, tests, and configuration were not edited.

## Spec

Spec: FAILURE. One historical-compatibility gap remains. Reviewed git diff b31360101dafd23ae07fe82dc3813973a56935e8...3378f0d89811c8ce67feadcc0326f8c86764a0ae and current scoped implementation. The base producer emitted bare hash scalars; the new shared reader recovers only decimal-digit hashes, not exponent-shaped hexadecimal identities. Configuration preservation, explicit identity rejection, consumer upgrades and MDX ingestion were inspected. No source files changed. No tests, builds, formatters or remote operations ran, as assigned. Validation command is proposed, not executed. Standards findings were not inspected.

The independent Spec report used temporary ID SPEC-01 and marked its finding as static inference. This review assigns durable ID SPEC-004. The owning-command reproductions below confirm the defect. No Standards finding was merged or reranked.

### SPEC-004 — medium, blocking

- **ADR:** None.
- **File:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/src/share-metadata.ts:30`.
- **Requirement:** Ticket: “Preserve share names, references, repository settings, authored metadata, and source bytes.” Initiative user story 25 requires historical readers to keep old records usable without rewriting history.
- **Description:** Historical exponent-shaped hexadecimal hashes lose their identity at the shared metadata reader. The old producer emitted bare hash scalars. The valid SHA-256 prefix 42226e907802 for <h1>Historical review 313</h1>\n parses as a YAML number. Recovery accepts only [0-9]{12}, so actual share --dry-run retrieval rejects the unchanged historical page with "Share metadata hash must be a string." The owning check also rejects a historical 123456789e12 page. This violates ticket preservation and historical-read requirements. The MDX boundary uses the same incomplete recovery; its exponent case was inspected, not separately built.
- **Required change:** For historical contracts only, recover an unambiguous original plain hash scalar when it matches the complete 12-character lowercase hexadecimal hash grammar, including exponent-shaped hashes. Keep current-contract numeric scalars rejected. Cover retrieval and MDX ingestion without rewriting historical pages.
- **Validation command:** `Add historical hash 123456789e12 to the owning-command retrieval and actual MDX ingestion cases, then run: mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/contracts.test.ts mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/site.test.ts`. This is the proposed regression command, not an additional executed check.

## Actual verification

All CLI commands used the frozen source implementation. Every publication fixture was temporary and had no remote. No configured user publication repository was read or changed.

The smoke proved legacy read byte stability, authorized v2 configuration mutation, authored-value retention, current no-op stability, and unknown-version rejection without writes. Actual dry-run generation produced metadata v2 with quoted hash 18bd7c741cee. mq read the generated page. Asset bytes and original source bytes matched. The clone received no publication files. Required size, image metadata and secret checks ran in the dry-run command.

The exact retrieval reproduction used source bytes `<h1>Historical review 313</h1>\n`. Its real SHA-256 prefix is `42226e907802`. A historical page with that bare hash and matching index failed actual retrieval. A second fixture failed the owning repository check for historical hash `123456789e12`. Neither failure rewrote its page. These are new edge cases, not repeats of prior reported failures.

The focused existing suite ran once after the axis investigation and smoke: 36 pass, 0 fail, 232 assertions across four files. Its real owning-command and MDX cases passed, but do not cover SPEC-004. Passing tests do not override this reproduced compatibility failure.

### Command records

```json
[
  {
    "argv": [
      "git",
      "init",
      "-q",
      "/tmp/review-0022-fixture-WHyl4K/review-private"
    ],
    "cwd": "/tmp/review-0022-fixture-WHyl4K",
    "exit_code": 0,
    "stdout": "",
    "stderr": "",
    "expected_exit_code": 0
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "list"
    ],
    "cwd": "/tmp/review-0022-fixture-WHyl4K",
    "exit_code": 0,
    "stdout": "review-private  [0 shares]\n  repo:  fixture/no-network\n  pages: disabled\n  clone: /tmp/review-0022-fixture-WHyl4K/review-private\n",
    "stderr": "",
    "expected_exit_code": 0
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "config",
      "clone-root",
      "/tmp/review-0022-fixture-WHyl4K"
    ],
    "cwd": "/tmp/review-0022-fixture-WHyl4K",
    "exit_code": 0,
    "stdout": "{\n  \"artifact\": \"/tmp/review-0022-fixture-WHyl4K/config.json\",\n  \"changed\": true,\n  \"from\": \"artifact-share-config/v1\",\n  \"to\": \"artifact-share-config/v2\",\n  \"status\": \"completed\"\n}\n",
    "stderr": "",
    "expected_exit_code": 0
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "config",
      "upgrade"
    ],
    "cwd": "/tmp/review-0022-fixture-WHyl4K",
    "exit_code": 0,
    "stdout": "{\n  \"artifact\": \"/tmp/review-0022-fixture-WHyl4K/config.json\",\n  \"changed\": false,\n  \"from\": \"artifact-share-config/v2\",\n  \"to\": \"artifact-share-config/v2\",\n  \"status\": \"completed\"\n}\n",
    "stderr": "",
    "expected_exit_code": 0
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "config",
      "upgrade"
    ],
    "cwd": "/tmp/review-0022-fixture-WHyl4K",
    "exit_code": 1,
    "stdout": "",
    "stderr": "Error: Unsupported explicit contract identifier; legacy detection is forbidden.\n",
    "expected_exit_code": 1
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "share",
      "doc",
      "/tmp/review-0022-fixture-WHyl4K/review.html",
      "--into",
      "review-private",
      "--dry-run"
    ],
    "cwd": "/tmp/review-0022-fixture-WHyl4K",
    "exit_code": 0,
    "stdout": "size check: ok (0 KiB published)\nmetadata check: ok (0 image(s))\nsecrets check: ok (offline scan of /tmp/artifact-share-18bd7c741cee-lpASFa)\n{\n  \"dryRun\": true,\n  \"name\": \"review-private\",\n  \"repo\": \"fixture/no-network\",\n  \"kind\": \"doc\",\n  \"hash\": \"18bd7c741cee\",\n  \"title\": \"Independent review fixture\",\n  \"url\": null,\n  \"repositoryPath\": \"content/shares/18bd7c741cee.mdx\",\n  \"page\": \"/tmp/artifact-share-18bd7c741cee-lpASFa/content/shares/18bd7c741cee.mdx\",\n  \"stage\": \"/tmp/artifact-share-18bd7c741cee-lpASFa\",\n  \"files\": [\n    \"review.html\"\n  ]\n}\n\nNothing was written to the clone and nothing was pushed.\nRead the page before you publish it:\n  cat /tmp/artifact-share-18bd7c741cee-lpASFa/content/shares/18bd7c741cee.mdx\n",
    "stderr": "[checks:size] $ /tmp/review-0022-fixture-WHyl4K/review-private/.mise/tasks/checks/size.ts --root /tmp/artifact-share-18bd7c741cee-lpASFa\n[checks:metadata] $ /tmp/review-0022-fixture-WHyl4K/review-private/.mise/tasks/checks/metadata.ts --root /tmp/artifact-share-18bd7c741cee-lpASFa\n[checks:secrets] $ /tmp/review-0022-fixture-WHyl4K/review-private/.mise/tasks/checks/secrets.ts --root /tmp/artifact-share-18bd7c741cee-lpASFa\n",
    "expected_exit_code": 0
  },
  {
    "argv": [
      "mise",
      "exec",
      "--",
      "mq",
      "--allow-http-import",
      "-I",
      "raw",
      "-F",
      "text",
      "import \"github.com/harehare/okf.mq\" | .",
      "/tmp/artifact-share-18bd7c741cee-lpASFa/content/shares/18bd7c741cee.mdx"
    ],
    "cwd": "/tmp/review-0022-fixture-WHyl4K",
    "exit_code": 0,
    "stdout": "---\nschemaVersion: artifact-share-metadata/v2\ntitle: \"Independent review fixture\"\nkind: doc\nhash: \"18bd7c741cee\"\ndate: 2026-11-23\nsource: \"review.html\"\n---\n\n<ShareMeta kind=\"doc\" hash=\"18bd7c741cee\" date=\"2026-11-23\" source=\"review.html\" raw=\"s/18bd7c741cee/\" />\n\nRead-only preview.\n\n## Files\n\n<FileTree root=\"s/18bd7c741cee\" files={[\n  { path: \"s/18bd7c741cee/review.html\" }\n]} />\n\n",
    "stderr": "",
    "expected_exit_code": 0
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "share",
      "doc",
      "/tmp/review-0022-retrieval-cyTp41/report.html",
      "--dry-run",
      "--into",
      "legacy"
    ],
    "cwd": "/tmp/review-0022-retrieval-cyTp41",
    "exit_code": 1,
    "expected_exit_code": 0,
    "result": "Reproduced SPEC-004. Hash 42226e907802 from exact bytes <h1>Historical review 313</h1>\\n. Error: Share metadata hash must be a string. Historical page and source bytes unchanged."
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "check",
      "--into",
      "legacy"
    ],
    "cwd": "/tmp/review-0022-exponent-y3RUSg",
    "exit_code": 1,
    "expected_exit_code": 0,
    "result": "Reproduced SPEC-004. checks:types rejects bare historical 123456789e12; Bun YAML parses hash as 123456789000000000000. Stored page unchanged."
  },
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
    "exit_code": 0,
    "result": "36 pass; 0 fail; 232 expect() calls; 4 files; 67.16 seconds. Existing suite does not cover exponent-shaped historical hashes."
  },
  {
    "argv": [
      "/home/zenobius/.omp/agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts",
      "validate",
      "--skill",
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "exit_code": 0,
    "result": "Manifest, five definitions and declared configuration upgrade resolved."
  }
]
```

## Producer and consumer contracts

| Contract | Producer and consumers | Review result |
| --- | --- | --- |
| artifact-share-config/v1 and v2 | CLI configuration readers/writers, config-owner, shared safeUpgrade | Read stability, authorized conversion, authored preservation and rejection exercised |
| artifact-share-metadata/v1 and v2 | CLI generation/retrieval, checks:types, MDX ingestion | Current generation exercised; historical exponent scalar recovery remains incomplete |
| artifact-share-index/v1 | CLI index writer/reader and repository checker | Format remains unchanged; failure is metadata interpretation, not index identity |
| Existing repository consumer upgrade | Explicit local upgrade planner and recognized template consumers | Existing focused suite passed preservation, refusal, rollback and real repository checks |
| MDX site ingestion | press.config.tsx and interpretShareHash | Existing actual site suite passed; exponent-shaped historical hash has the same incomplete recovery |

## Integration hazards and limits

The verdict binds only to the frozen source commit and tree. Base-only movement does not invalidate it. Integration must combine this source with the current base and run the same focused command on the actual candidate. Check shared safeUpgrade interfaces, package versions and cloned consumer compatibility. Existing repositories need explicit consumer upgrades before v2 generation. Customized consumers still require manual review. Contract validity does not authorize publication or establish deployment success. No remote publication or deployment was attempted.

Required candidate command: `mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test`.

## Nested sessions and cleanup

Standards run: d42fc93b-42a2-495c-ba3f-1a0c3dbea53a. Spec run: 4edc49d3-3a59-47db-b706-d463d7acb2d3. Both fresh depth-2 sessions remained read-only. Their review-axis/v1 results were verified against assigned contexts and acknowledged by payload hash. No per-axis permanent review files were made. Both child tabs were removed; the review workspace and parent tab remain. Fixture directories and generated stages were removed. No source, tests, configuration, tracker or projections were changed.

Standards: 0 findings. Spec: 1 medium-severity blocking finding. Verdict: FAILURE.

Final owned-process shutdown observations:

```json
[
  {
    "schemaVersion": "muxer-resources/v2",
    "runId": "d42fc93b-42a2-495c-ba3f-1a0c3dbea53a",
    "observedAt": "2026-11-23T04:21:13.873Z",
    "processes": [
      {
        "pid": 2984238,
        "bootId": "1093b557-9bca-45b2-a143-4217cd820f51",
        "startTicks": "11271599",
        "command": "omp",
        "parentPid": 2983338,
        "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
        "state": "stopped"
      }
    ],
    "shutdown": "confirmed"
  },
  {
    "schemaVersion": "muxer-resources/v2",
    "runId": "4edc49d3-3a59-47db-b706-d463d7acb2d3",
    "observedAt": "2026-11-23T04:22:49.402Z",
    "processes": [
      {
        "pid": 2984158,
        "bootId": "1093b557-9bca-45b2-a143-4217cd820f51",
        "startTicks": "11271595",
        "command": "omp",
        "parentPid": 2983328,
        "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
        "state": "stopped"
      }
    ],
    "shutdown": "confirmed"
  }
]
```

The Spec process remained job-control stopped after pane removal. Its exact PID, boot ID, start ticks and run tag matched before SIGTERM and SIGKILL. The final observer confirmed its shutdown. No unrelated process was signalled.

