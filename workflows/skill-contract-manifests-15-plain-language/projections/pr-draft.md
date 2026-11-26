---
schemaVersion: worktree-pr-draft/v1
workflow_id: skill-contract-manifests-15-plain-language
receipt_id: implementation-0020
source_commit: a33155b7b6f74e8b2437a1c631578fb500d84eb1
source_tree: 2a365abea33be13b00bcd8cfb92737dfc49a38a6
---
# Plain-language assessment contracts

## Ticket and problem

Ticket: tracker/tickets/skill-contract-manifests-15-plain-language.md.

Assessment artifacts previously had no explicit identity or shared safe-upgrade boundary.

## Implementation

Declare five assessment record families with current v2 output and explicit unversioned v1 readers. Share findings with text-audit, including skipped entries. Validate all report inputs before writes. Use the shared safe-upgrade writer for authorized state appends and explicit conversions. Preserve authored fields, historical entries, scores, evidence citations, limitations, and selected prose.

## Changed files

- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/SKILL.md
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/audit-corpus.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/audit-evidence.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/generate-report-cli.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/generate-report.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/lib/types.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/score-maturity.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/tests/behaviour-contract.test.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/tests/cli.test.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/tests/generate-report.test.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/assets/answers.example.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/contracts.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/references/assessment-upgrade.md
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/references/contracts.md
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/assessment-contracts.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/lib/contracts.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/lib/destinations.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/tests/contracts.test.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-text-audit/SKILL.md
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-text-audit/scripts/audit-text.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-text-audit/contracts.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/references/interview-guide.md
- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json

## Validation

The required scoped Bun suite passed: 148 tests, 0 failures, 2143 assertions. Fresh fixture-only smoke passed all 54 CLI commands. The smoke validates both public manifests and resolves every declared definition. It exercises historical/current scoring and reports, two state appends, text-audit frontmatter reading and skipped entries, explicit and partial bulk upgrades, and unknown/mixed/ambiguous/lossy/unsafe refusal byte equality. It compares business results with the retained legacy baseline.

Checks ran before commit on the exact 22 preserved source files recorded in workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/implementation-0020/source-binding.json. They are not final-commit suite runs. Normal commit hooks generated only the required agent-core 0.1.46 metadata.

## Review history and findings

No independent review has run. The parent owns review of this exact source commit. No implementation questions remain. The separate prerequisite commit 88bdcdf101a487b1cb0daa10bbebbf50d86a0128 still requires parent-owned independent review. It was not adopted into this source.

## Merge status

Committed locally. Not pushed or merged.

## Inputs

- tracker/initiatives/skill-contract-manifests/index.md
- tracker/tickets/skill-contract-manifests-15-plain-language.md
- workflows/skill-contract-manifests-15-plain-language/events/start-0019.yaml
- workflows/goal-skill-contract-manifests/events/dispatch-reserved-0045.yaml
- workflows/goal-skill-contract-manifests/events/checkpoint-0044.yaml
- workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/implementation-0017/source-binding.json
- workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/implementation-0014/smoke-source.ts
- workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/parent-legacy-baseline-0001

## Outputs and evidence

- workflows/skill-contract-manifests-15-plain-language/events/implementation-0020.yaml
- workflows/skill-contract-manifests-15-plain-language/artifacts/snapshots/pr-draft-implementation-0020.md
- workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/implementation-0020/suite.json
- workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/implementation-0020/commands-and-observations.json
- workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/implementation-0020/smoke-source.ts
- workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/implementation-0020/source-binding.json
- workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/implementation-0020/summary.json

The owned loader alias and fixture directory were removed. The parent dependency installation remains. No owned service remains running.

