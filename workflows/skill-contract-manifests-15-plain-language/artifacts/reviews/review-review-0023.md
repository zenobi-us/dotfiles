# Review: skill-contract-manifests-15-plain-language

## Verdict

FAILURE. Standards: 0 findings. Spec: 1 blocking finding (SPEC-001, high).

## Scope

Ticket: `tracker/tickets/skill-contract-manifests-15-plain-language.md`.
Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.
Source branch: `feature/skill-contract-manifests-15-plain-language`. Base branch: `master`.
Reviewed commit: `a33155b7b6f74e8b2437a1c631578fb500d84eb1`.
Reviewed tree: `2a365abea33be13b00bcd8cfb92737dfc49a38a6`.
Review base: `6beaf578a762e1b47cb9947227cbfc7910a5487b`.
Timestamp: 2026-11-26T02:25:15.048Z.

Committed comparison: `git diff 6beaf578a762e1b47cb9947227cbfc7910a5487b...a33155b7b6f74e8b2437a1c631578fb500d84eb1`.
The diff is non-empty and contains 24 paths. Source and publication checkout share the same real Git common directory.
Base-only workflow records are not proposed deletions. The source was not repinned.

### Changed paths

- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/audit-corpus.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/audit-evidence.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/generate-report-cli.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/generate-report.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/lib/types.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/score-maturity.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/tests/behaviour-contract.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/tests/cli.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/tests/generate-report.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/assets/answers.example.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/contracts.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/references/assessment-upgrade.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/references/contracts.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/assessment-contracts.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/lib/contracts.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/lib/destinations.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/tests/contracts.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-text-audit/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-text-audit/scripts/audit-text.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-text-audit/contracts.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/references/interview-guide.md`
- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`

### Affected contracts

- `plain-language-answers/v1`
- `plain-language-answers/v2`
- `plain-language-findings/v1`
- `plain-language-findings/v2`
- `plain-language-evidence/v1`
- `plain-language-evidence/v2`
- `plain-language-maturity/v1`
- `plain-language-maturity/v2`
- `plain-language-audit-state/v1`
- `plain-language-audit-state/v2`
- `skill-contract-manifest/v1`
- `worktree-receipt/v3`
- `selected prose read-only boundary`
- `agent-core plugin/marketplace version synchronization`

## Standards

Standards: PASS. Reviewed the committed three-dot diff from 6beaf578a762e1b47cb9947227cbfc7910a5487b to a33155b7b6f74e8b2437a1c631578fb500d84eb1, tree 2a365abea33be13b00bcd8cfb92737dfc49a38a6. No material documented-standard breaches or baseline smells found.

Sources: injected AGENTS communication rules; typescript, code-comments, iso-24495-code, iso-24495-1, and skill-contracts guidance. Read the canonical ticket, initiative, domain documents, and ADR index from the publication checkout through mq and resolved tracker routes. The indexed Pi Ink ADR does not apply.

The change keeps assessment content validation with its owner and persistence with the shared safe-upgrade writer. Type-only imports avoid a runtime scoring/validator cycle. New regression tests check preserved authored history, rejected identities, semantic errors, aliases, and lossy conversion. Removed source-wording and full-report-copy assertions match the verification rules. No additional smell finding warrants a judgement-call warning. Tooling-enforced style is excluded.

Prerequisite 88bdcdf101a487b1cb0daa10bbebbf50d86a0128: ACCEPT. Independently inspected its exact diff and complete phase-context.ts at that commit. The exception applies only to failed/blocked start, implementation, or fix completions with a matching failed/blocked result. It retains source commit/tree checks, parent validation, and clean-source gates for successful completion and review/submit/finish. Tests cover changed HEAD and a completed-child bypass. Guidance and developer release metadata match the change. It is base-only; an ordinary merge retains it.

Observed verification: two actual score-maturity CLI invocations used an isolated temporary fixture with BUN_OPTIONS=--install=fallback. Current v2 answers produced governance level 1, overall 0, and v2 maturity without changing the input. An unknown explicit version returned exit 1 and preserved the existing output bytes. Removed only the owned fixture. Did not run the full suite, prerequisite suite, or fixed-path smoke. No source, tracker, dependency, or historical artifact changes.

## Spec

FAILURE: one blocking input-preservation gap at audit-text.ts:150 and audit-corpus.ts:1208. Output alias checks omit the consumed acronym lexicon. An isolated actual CLI command replaced ["XYZ"] with findings JSON and exited 0. This breaks the ticket's stored-input preservation requirement and the required unchanged lexicon boundary. Protect the lexicon alongside selected prose before writing.

Reviewed a33155b7b6f74e8b2437a1c631578fb500d84eb1 against the specified three-dot base. Read the complete canonical ticket and initiative independently through shared-context and mq. All five assessment families have separate v2 identities, unversioned historical readers, and declared shared safe-upgrade paths. Text-audit references the findings owner and includes skipped entries. Unknown and mixed identities fail. Conversion retains unknown authored fields; audit-state appends preserve complete historical entries. The substantive diff leaves English heuristics, scoring policy, frontmatter reading, report limitations, and trend calculations unchanged. No additional scope gap found.

Observed checks: public manifest validation passed. An isolated six-command assessment scenario produced findings, evidence and maturity, then generated two successive reports from historical state. Three snapshots retained the historical citation and unknown container field. Unknown evidence identity failed with state and report bytes unchanged. Historical answers stayed byte-identical. The separate lexicon-overwrite reproduction failed the preservation boundary while leaving selected prose unchanged. No full suite or parent smoke driver was run by this axis.

ACCEPT prerequisite 88bdcdf101a487b1cb0daa10bbebbf50d86a0128 after inspecting its exact diff. It narrowly permits failed/blocked start, implementation and fix closures for matching unsuccessful child results. Frozen commit/tree checks remain; successful closures and review/submit/finish retain clean-source gates. Its tests cover changed HEAD, repinning and completed-child refusal. This decision uses code inspection, not a claimed independent prerequisite test run.

### SPEC-001 — NO ADR: consumed lexicon can become an output destination

- **Location:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-text-audit/scripts/audit-text.ts:150`; `mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/scripts/audit-corpus.ts:1208`.
- **Required change:** Include the consumed project acronym lexicon in destination alias protection for both audit-text and audit-corpus before any output write. Preserve lexicon and selected prose bytes on refusal.
- **Validation:** In an isolated fixture with .iso-24495-4/acronyms.json=["XYZ"], run each actual audit CLI with --json set to that lexicon. Require nonzero exit and byte-identical lexicon and selected prose. Also cover ancestor aliases. Use BUN_OPTIONS=--install=fallback.
- **Blocking reason:** The actual command destroys a consumed project input and returns success. No applicable ADR overrides input preservation.

## Published prerequisite

ACCEPT `88bdcdf101a487b1cb0daa10bbebbf50d86a0128`. Both independent axes inspected its exact commit diff and accepted it.
The primary also inspected the exact six-path diff and the source-identity gates.
Only matching failed/blocked implementation or fix result closures can retain dirty partial source.
The child SHA/tree remain fixed. Completed results, successful closures, and review/submit/finish retain clean-source gates.
The prerequisite is already on the base. A normal merge retains it; this review did not merge or cherry-pick it.

## Observed validation

- **Frozen-source suite:** `env BUN_OPTIONS=--install=fallback mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/tests`: 148 passed, 0 failed, 2143 assertions. This run used the final frozen source.
- **Fresh CLI smoke:** The cwd-based driver at `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/parent-source-verification-0001/smoke-source.ts` passed 54 actual commands, including 20 asserted negative/partial cases. It used isolated owned fixtures. It checked legacy/current pipelines, successive appends, scores, citations, totals, trends, limitations, read-only inputs, rejected conversions, and aliases.
- **Publication-base writer suite:** `env BUN_OPTIONS=--install=fallback mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts`: 64 passed, 0 failed, 484 assertions. This was a fresh run from the publication checkout, not the source checkout's old framework suite.
- **Independent checks:** Standards exercised two score CLI invocations. Spec exercised its assessment pipeline and the blocking lexicon-overwrite reproduction. The passing suite and smoke do not cover that missing protection.

Evidence: `workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/review-0023/suite.json`, `workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/review-0023/commands-and-observations.json`, `workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/review-0023/prerequisite-suite.json`, and the separate axis results.
The fresh smoke retained its real output in this evidence run. Its temporary result directory was removed after capture.
Earlier implementation checks remain pre-commit evidence. They were not relabelled as final-commit runs.

### Integration checks still required after a fix and merge

- `env BUN_OPTIONS=--install=fallback mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/tests mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts`
- `env BUN_OPTIONS=--install=fallback mise exec -- bun /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/parent-source-verification-0001/smoke-source.ts`

No candidate integration check ran. The parent owns any fix, fresh review, merge, generated metadata reconciliation, and tracker update.
The stale linked-checkout inventory remains incomplete. The supplied coordination assessment names no concrete scoped overlap or blocker.

## Resources and publication

Standards run: `d5e30a70-ca33-421c-9571-73e80ea40dd5`. Spec run: `474aa59a-49f7-47e1-b244-815cd0ff1c79`.
Both delivered `review-axis/v1` with the correct axis identity. Both transport payloads were validated and acknowledged.
Normal `hc kill` and `hc rm` closed only their owned terminals. Subsequent resource observations confirm all registered processes stopped.
The desktop no longer contains either axis terminal. The primary review terminal remains for parent closure.
No additional process signals or shutdown authorization were needed. Unrelated resources were preserved.
The primary removed only its owned ignored AJV alias. The parent's real dependency installation remains.
Tracked source was not edited. No commit, push, merge, tracker update, or projection write occurred.

Resources: `workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/review-0023/assignments.json`, `workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/review-0023/resources-before.json`, `workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/review-0023/resources-after.json`, `workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/review-0023/desktop-absence.json`.

Standards: 0 findings, no worst issue. Spec: 1 finding, high severity (SPEC-001).
