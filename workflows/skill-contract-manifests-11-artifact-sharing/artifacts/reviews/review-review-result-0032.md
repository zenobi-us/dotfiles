---
description: Independent frozen-source Standards and Spec review
title: Artifact-sharing review 0032
type: Concept
---

# Review result 0032

## Verdict

FAILURE. One blocking finding on each axis. The existing suite passes but does not cover these two defects.

## Frozen scope

Ticket: `tracker/tickets/skill-contract-manifests-11-artifact-sharing.md`. Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.

Source branch: `feature/skill-contract-manifests-11-artifact-sharing`. Base branch: `master`.

Source checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing`. Publication checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`.

Reviewed commit: `8b616592357dd7c5c7472b54d3e946029bd2d2a9`. Reviewed tree: `d3d9d6e312b93131799b44b1d11b49d07bd1ebb8`. Review base: `47ad60c441602729d0c565125f8ae609211fe2d5`. Timestamp: `2026-11-23T08:21:03.397758Z`.

Exact diff command:

```sh
git diff 47ad60c441602729d0c565125f8ae609211fe2d5...8b616592357dd7c5c7472b54d3e946029bd2d2a9 -- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json
```

Exact commit list, newest first:

```text
8b616592357dd7c5c7472b54d3e946029bd2d2a9 fix(artifact-shares): preserve exponent hashes for skill-contract-manifests-11-artifact-sharing
3378f0d89811c8ce67feadcc0326f8c86764a0ae fix(skills): skill-contract-manifests-11-artifact-sharing upgrade
9d8754211e8178c43beccc97e02e4f4b66adb5e3 fix(skills): skill-contract-manifests-11-artifact-sharing mdx hashes
2b9160cdac8a7c413944876c87292d0d023eeaf1 fix(skills): skill-contract-manifests-11-artifact-sharing hash text
8d83701befd83473f2a3fb38162cbef0c5082e38 test(skills): skill-contract-manifests-11-artifact-sharing boundaries
e45c91191a026ad972c6437b0a89fb71b34c5cd0 feat(skills): skill-contract-manifests-11-artifact-sharing contracts
```

Changed scope:

```json
[
  "mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares",
  "mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json",
  "mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json"
]
```

Affected contracts:

```json
[
  "artifact-share configuration v1/v2",
  "artifact-share metadata v1/v2",
  "share index",
  "existing repository consumer upgrades",
  "MDX site ingestion"
]
```

Integration checks:

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
    ]
  }
]
```

## Standards

Reviewed all 27 changed files across 47ad60c441602729d0c565125f8ae609211fe2d5...8b616592357dd7c5c7472b54d3e946029bd2d2a9. One documented contract breach; no separate heuristic-only findings. Applied the complete supplied smell baseline. Duplicated validation shapes explain the finding below, but the finding rests on the declared contract, not the heuristic. Review was read-only; no tests, builds, lint or format commands ran.

Finding record:

```json
{
  "id": "STANDARDS-003",
  "severity": "P2",
  "adr": "NO ADR",
  "file": "mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/press.config.tsx",
  "line": 15,
  "description": "The actual MDX consumer applies an optional z.string() hash and optional owned fields rather than the declared metadata/v2 contract. An explicit v2 page with hash xyz can build successfully while readShareMetadata and the repository checker reject it. metadata-v2.json requires the owned fields and a 12-character lowercase hexadecimal hash. This blocks consistent contract validation at the independently consumed site boundary.",
  "required_change": "Apply the complete owned metadata validation after historical interpretation for share documents at the MDX boundary. Preserve support for ordinary non-share content pages.",
  "validation_command": "mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/site.test.ts (include malformed string hashes and missing required fields)"
}
```

## Spec

FAILURE — one missing contract requirement.

Reviewed all 27 scoped files between 47ad60c441602729d0c565125f8ae609211fe2d5 and 8b616592357dd7c5c7472b54d3e946029bd2d2a9 against the complete ticket and initiative. No tests, builds, lint, formatters, or source mutations were run.

[P2] Declare and validate the consumer-history asset contract. `scripts/artifact-shares/consumers.ts:11–16` parses `assets/consumer-history.json` with only a TypeScript assertion. Lines 26–29 then use its fields to decide which repository files the owning `upgrade` command may replace. `contracts.json:3–10` declares only configuration, metadata and index contracts. The new structured asset has no contract identity, authoritative definition, accepted-format declaration, or content validator. Thus a consumer cannot discover its supported interpretation, and the upgrade command does not reject an unknown explicit asset version before using its replacement allowlist.

Applicable initiative clauses: “Structured references and assets need contracts when consumers depend on their structure or meaning”; “Require authors to identify independently consumed structured inputs and outputs, their owners, validators, compatibility rules, and upgrade policies”; “An unknown explicit identifier is not a legacy candidate. Preserve the artifact and reject operations that require unsupported interpretation.” The ticket requires: “Preserve its contract ownership, safety boundaries, and scope limits.”

Required change: declare the asset’s owned contract and accepted formats in the manifest; validate its identity and complete structure before planning replacements. Define explicit handling for the present unversioned asset. Preserve repository bytes on rejection.

Proposed validation, not run: invoke `cli.ts upgrade <name> --dry-run` and `cli.ts upgrade <name> --confirm <name>` from an isolated skill installation whose history asset carries an unknown explicit version. Both must reject it, with the clone byte-identical. Also exercise the declared current and historical asset formats.

Finding record:

```json
{
  "id": "SPEC-005",
  "severity": "P2",
  "adr": "NO ADR",
  "file": "mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/consumers.ts",
  "line": 11,
  "description": "The new consumer-history.json structured asset controls the replacement allowlist but has no declared contract, accepted-format policy, or content validator. consumers.ts uses only a TypeScript assertion. The initiative says structured assets need contracts when consumers depend on their structure or meaning, and unknown explicit identifiers must reject interpretation. An unknown explicit asset version is ignored before consumer replacement.",
  "required_change": "Declare the owned consumer-history asset contract, authoritative definition, accepted formats and handling of the present unversioned asset. Validate identity and complete structure before planning or writing replacements; preserve clone bytes on rejection.",
  "validation_command": "In an isolated skill installation, invoke cli.ts upgrade private --dry-run and cli.ts upgrade private --confirm private with consumer-history.json declaring an unknown explicit version; both must reject with clone bytes unchanged."
}
```

## Observed defect evidence

STANDARDS-003: An isolated actual Fumapress build exited 0 and rendered `data-interpreted-hash="xyz"` from explicit v2 metadata. The actual repository checker exited 1 with a 12-character-hash error. The page bytes stayed unchanged.

SPEC-005: An isolated copy of the skill had `schemaVersion: artifact-share-consumer-history/v999` added to its history asset. Both `upgrade private --dry-run` and `upgrade private --confirm private` exited 0. The confirmed command replaced repository consumer files. The fixture had no remote.

## Validation

The affected suite passed: 36 tests, 0 failures, 275 assertions across 4 files. It ran the actual MDX builder for historical exponent, leading-zero, numeric-string and current metadata boundaries.

The independent smoke used a temporary config and a no-remote repository. It proved read-only configuration byte stability, authorised mutation with authored-data preservation, byte-stable unknown/unsafe rejection, current metadata generation, unversioned/v1 retrieval, required checker rejection and unchanged source bytes.

Actual argv, cwd and exit codes:

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
    "exit_code": 0,
    "result": "36 pass, 0 fail, 275 assertions across 4 files. Includes real historical MDX ingestion builds, rejection, consumer upgrade and rollback. 77.54s."
  },
  {
    "argv": [
      "mise",
      "exec",
      "--",
      "bun",
      "/tmp/review-0032/smoke.ts"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "exit_code": 0,
    "result": "Actual owning-command configuration read/mutation/rejection, generation/retrieval, checks and byte-preservation assertions passed."
  },
  {
    "argv": [
      "mise",
      "exec",
      "--",
      "bun",
      "/tmp/review-0032/defects.ts"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "exit_code": 0,
    "result": "Reproduced STANDARDS-003 and SPEC-005 through actual MDX build, checker and isolated upgrade CLI."
  },
  {
    "argv": [
      "mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts",
      "validate",
      "--skill",
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "exit_code": 0,
    "result": "Declared manifest and its five definitions and upgrade procedure resolved."
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "list"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "exit_code": 0,
    "scenario": "owning-command-smoke",
    "expected": "success"
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "config",
      "clone-root",
      "/tmp/review-0032-fixture-x7P9dY"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "exit_code": 0,
    "scenario": "owning-command-smoke",
    "expected": "success"
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "config",
      "upgrade"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "exit_code": 1,
    "scenario": "owning-command-smoke",
    "expected": "rejection"
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "config",
      "upgrade"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "exit_code": 1,
    "scenario": "owning-command-smoke",
    "expected": "rejection"
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "share",
      "doc",
      "/tmp/review-0032-fixture-x7P9dY/report.html",
      "--dry-run"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "exit_code": 0,
    "scenario": "owning-command-smoke",
    "expected": "success"
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "share",
      "doc",
      "/tmp/review-0032-fixture-x7P9dY/report.html",
      "--dry-run"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "exit_code": 0,
    "scenario": "owning-command-smoke",
    "expected": "success"
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "check",
      "--into",
      "isolated"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "exit_code": 0,
    "scenario": "owning-command-smoke",
    "expected": "success"
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "share",
      "doc",
      "/tmp/review-0032-fixture-x7P9dY/report.html",
      "--dry-run"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "exit_code": 0,
    "scenario": "owning-command-smoke",
    "expected": "success"
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "check",
      "--into",
      "isolated"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "exit_code": 0,
    "scenario": "owning-command-smoke",
    "expected": "success"
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "share",
      "doc",
      "/tmp/review-0032-fixture-x7P9dY/report.html",
      "--dry-run"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "exit_code": 1,
    "scenario": "owning-command-smoke",
    "expected": "rejection"
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing/mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "check",
      "--into",
      "isolated"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "exit_code": 1,
    "scenario": "owning-command-smoke",
    "expected": "rejection"
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
    "cwd": "/tmp/review-0032-defects-nhx4dL/site",
    "exit_code": 0,
    "scenario": "defect-reproduction"
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
    "cwd": "/tmp/review-0032-defects-nhx4dL/site",
    "exit_code": 0,
    "scenario": "defect-reproduction"
  },
  {
    "argv": [
      "/tmp/review-0032-defects-nhx4dL/site/.mise/tasks/checks/types.ts"
    ],
    "cwd": "/tmp/review-0032-defects-nhx4dL/site",
    "exit_code": 1,
    "scenario": "defect-reproduction"
  },
  {
    "argv": [
      "git",
      "init",
      "-q",
      "/tmp/review-0032-defects-nhx4dL/clones/private"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "exit_code": 0,
    "scenario": "defect-reproduction"
  },
  {
    "argv": [
      "/tmp/review-0032-defects-nhx4dL/runtime/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "upgrade",
      "private",
      "--dry-run"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "exit_code": 0,
    "scenario": "defect-reproduction"
  },
  {
    "argv": [
      "/tmp/review-0032-defects-nhx4dL/runtime/skills/artifact-shares/scripts/artifact-shares/cli.ts",
      "upgrade",
      "private",
      "--confirm",
      "private"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-11-artifact-sharing",
    "exit_code": 0,
    "scenario": "defect-reproduction"
  }
]
```

## Inputs and coordination

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
    "kind": "receipt",
    "ref": "workflows/skill-contract-manifests-11-artifact-sharing/events/implementation-0002.yaml"
  },
  {
    "kind": "receipt",
    "ref": "workflows/skill-contract-manifests-11-artifact-sharing/events/fix-result-0026.yaml"
  },
  {
    "kind": "receipt",
    "ref": "workflows/skill-contract-manifests-11-artifact-sharing/events/fix-complete-0027.yaml"
  },
  {
    "kind": "receipt",
    "ref": "workflows/skill-contract-manifests-11-artifact-sharing/events/fix-cleanup-observed-0029.yaml"
  },
  {
    "kind": "receipt",
    "ref": "workflows/skill-contract-manifests-11-artifact-sharing/events/review-approval-0030.yaml"
  },
  {
    "kind": "receipt",
    "ref": "workflows/skill-contract-manifests-11-artifact-sharing/events/review-start-0031.yaml"
  },
  {
    "kind": "snapshot",
    "ref": "workflows/skill-contract-manifests-11-artifact-sharing/artifacts/snapshots/coordination-review-0031.json"
  },
  {
    "kind": "snapshot",
    "ref": "workflows/skill-contract-manifests-11-artifact-sharing/artifacts/snapshots/pr-draft-fix-0026.md"
  }
]
```

The publication ADR index lists only the Pi Ink cleanup trust-boundary ADR. It does not apply to this change. Findings use NO ADR.

The assigned review-start and approval authorize this fresh reviewer. The inspector reported valid history and the exact clean source. Its unknown-ownership warning concerns session liveness; the explicit assigned handoff and fix-cleanup-observed-0029 establish this review ownership and prior fixer shutdown. The coordination snapshot has no target reservation. Unrelated historical inventory errors remain a limitation. Ticket 18 is active separately. Base integration must reassess its changes and both plugin registries; this source verdict does not approve a later combined candidate.

## Nested sessions and resources

Both axes ran independently at depth 2. They skipped tests, builds, linters, formatters, source edits and workflow writes. Their typed result deliveries were verified and acknowledged before normal owned-terminal closure.

- **Owned axis:** Run/session `dcf4bf61-720c-463f-abb5-48ff2799d83d`, terminal `t22v`. Normal `hc kill` and `hc rm` exited 0. The post-closure resource observer confirmed shutdown.
- **Owned axis:** Run/session `de6c393e-c4ce-4f27-8bbd-62670422de2f`, terminal `t22w`. Normal `hc kill` and `hc rm` exited 0. The post-closure resource observer confirmed shutdown.

The app listing confirmed removal of both owned nested panes. It retained the reviewer and unrelated sessions. The main reviewer run/session is `66d1e3e1-4491-4025-a1af-a75f90701d8b`, terminal `t22r`. Its resource observation is pending while this reviewer is live. The parent owns final closure. No domain service remains.

## Limits and next action

No source, permanent test, config, tracker, projection, prior event or manifest was changed. No merge, push, real publication or hosted deployment ran. Temporary fixtures were removed. No evidence run was invented. The writer will verify frozen source identity and cleanliness before publication.

Keep previous resolved finding IDs in history. This review adds STANDARDS-003 and SPEC-005 only. Fix these defects in a separate authorised phase, then obtain a fresh independent review. Standards: 1 P2 finding. Spec: 1 P2 finding. Neither axis is reranked against the other.

