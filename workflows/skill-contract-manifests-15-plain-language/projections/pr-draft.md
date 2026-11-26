---
schemaVersion: worktree-pr-draft/v1
workflow_id: skill-contract-manifests-15-plain-language
receipt_id: fix-0026
source_commit: 5456c4a5dfda4e5634a383a2236e4ad0630e6c06
source_tree: 6d818ee3eb08d7ae44c233b53dfac6b308096cae
---
# Plain-language assessment contracts

## Ticket and problem

Ticket: tracker/tickets/skill-contract-manifests-15-plain-language.md.
Assessment records need explicit identities and safe conversion. Review review-0023 also found that both audit producers omitted the consumed acronym lexicon from destination protection (SPEC-001).

## Current implementation

Declare five assessment record families with current v2 output and explicit unversioned v1 readers. Share findings with text-audit, including skipped entries. Validate all report inputs before writes. Use the shared safe-upgrade writer for authorized state appends and explicit conversions. Preserve authored fields, historical entries, scores, evidence citations, limitations, and selected prose.

Both audit producers now include the consumed project acronym lexicon in the existing destination guard before output writes. Each path uses the same project directory as its loader. The existing guard handles direct identity and filesystem aliases, including symlinked ancestors. No global filename ban or new validation framework was added.

The external string-array lexicon and selected prose keep their bytes and formats. Current v2 output, historical unversioned v1 readers, English heuristics, scoring and frontmatter reading remain unchanged.

## Changed files

### Current fix

- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/references/contracts.md
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/audit-corpus.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/tests/cli.test.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-text-audit/scripts/audit-text.ts
- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json

Normal commit hooks changed only the two listed plugin metadata files beyond the four authored files.

### Retained implementation

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

## Verification

- Targeted permanent regressions: 2 passed, 0 failed, 32 assertions. Both real CLI entrypoints reject direct and ancestor-alias lexicon outputs. They preserve exact lexicon and selected-prose bytes. Identical inputs and options with a distinct same-basename destination produce the expected v2 legalese finding and no acronym finding.
- Separate real CLI proof: 6 fixture-only commands. Four expected refusals exit 1; two legitimate outputs exit 0. Exact argv, cwd, status, findings and byte comparisons are retained in artifacts/evidence/fix-0026/lexicon-cli-proof.json.
- Required full suite: 150 passed, 0 failed, 2175 assertions.
- Fresh workflow smoke: 54 actual commands passed, including 20 expected negative or partial outcomes, both public manifest validations, all declared definition resolutions, scoring, reporting, state appends and refusal byte checks.

Checks ran before commit. Source hashes and unchanged post-commit authored-file hashes are retained. These are not final-commit test executions. The regression was written before the production edit but was not run red: the independently captured destructive result is ground truth. No user or repository corpus was audited. Owned fixtures and source dependency alias were removed. The parent dependency installation remains. No helper or service was launched.

## Review history and findings

Earlier attempts remain immutable in events/start-0001.yaml through events/start-complete-0018.yaml. Implementation implementation-0020 and completion start-complete-0021 record the prior source a33155b7b6f74e8b2437a1c631578fb500d84eb1. Its 148-test suite and 54-command smoke remain prior evidence, not proof of this fix.

Review review-0023 and completion review-complete-0024 record FAILURE with one blocking finding, SPEC-001, and zero standards findings. Fix fix-0026 consumes that review and resolves SPEC-001 with the proof above. No unresolved fix finding or implementation question remains. Fresh independent review of 5456c4a5dfda4e5634a383a2236e4ad0630e6c06 is required. The current overall review verdict is null, not SUCCESS.

Both review axes and the primary reviewer independently accepted the exact publication-only prerequisite commit 88bdcdf101a487b1cb0daa10bbebbf50d86a0128. It is not on this source branch. Normal integration must retain it; this fix did not edit or integrate it.

## Merge status

Committed locally with normal hooks. Not pushed or merged. No integration approval exists. The parent owns fresh independent review, completion and later integration.

## Canonical references

- tracker/initiatives/skill-contract-manifests/index.md
- tracker/tickets/skill-contract-manifests-15-plain-language.md
- workflows/skill-contract-manifests-15-plain-language/events/implementation-0020.yaml
- workflows/skill-contract-manifests-15-plain-language/events/start-complete-0021.yaml
- workflows/skill-contract-manifests-15-plain-language/artifacts/snapshots/pr-draft-implementation-0020.md
- workflows/skill-contract-manifests-15-plain-language/events/review-0023.yaml
- workflows/skill-contract-manifests-15-plain-language/events/review-complete-0024.yaml
- workflows/skill-contract-manifests-15-plain-language/artifacts/reviews/review-review-0023.md
- workflows/skill-contract-manifests-15-plain-language/events/fix-start-0025.yaml
- workflows/skill-contract-manifests-15-plain-language/events/fix-0026.yaml
- workflows/goal-skill-contract-manifests/events/dispatch-reserved-0051.yaml
- workflows/skill-contract-manifests-15-plain-language/artifacts/snapshots/pr-draft-fix-0026.md
- workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/fix-0026/lexicon-cli-proof.json
- workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/fix-0026/targeted-suite.json
- workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/fix-0026/suite.json
- workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/fix-0026/commands-and-observations.json
- workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/fix-0026/source-binding.json
- workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/fix-0026/committed-source.json
