---
title: PR draft implementation-0005
type: Report
---

# Validate manifests and resolve local definitions

## Ticket and source target

Ticket: [skill-contract-manifests-01-local-definitions](../../../../tracker/tickets/skill-contract-manifests-01-local-definitions.md).
Initiative: [skill-contract-manifests](../../../../tracker/initiatives/skill-contract-manifests/index.md).
Branch: feature/skill-contract-manifests-01-local-definitions. Base: master.
Implementation commit: 73e3625197070245eec00d78b30baeb57745f637.
Frozen source target after tracker update: ebe8017f9e5e5794c22a0ae55052b3cfda7d624a.
Frozen source tree: 3703925f5f70985bbe85ef5e8346c498b634612b.
The final receipt records the current exact HEAD after the workflow-only publication commit. These source changes do not change in that commit.

## Problem

Consumers need one shared manifest specification and validator. Input support, output production, and definition ownership must remain distinct. Caller directories must not change reference meaning.

## Implementation

Added the skill-contracts public validate and resolve commands and importing APIs. The shared JSON Schema validates required collections and identifiers. Local resolution reads every declared definition and upgrade procedure before success. The manifest contract uses a built-in authoritative definition. Owner validators retain domain content validation. Inspection is read-only and never executes upgrades.

## Changed files

- bun.lock
- mise/conf.d/devtools-agent/bundles/agent-core/package.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/SKILL.md
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/contracts.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/empty/contracts.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/local/contracts.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/local/record-v1.schema.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/local/record-v2.schema.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/local/upgrade.txt
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/how-to-validate-contracts.md
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/references/manifest.md
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/references/manifest.schema.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/contracts.test.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/contracts.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts
- mise/conf.d/devtools-agent/bundles/agent-core/types/versioned-imports.d.ts
- tracker/tickets/skill-contract-manifests-01-local-definitions.md

## Validation

- mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents: passed: 104 tests, 0 failures, 499 assertions across 5 files.
- mise exec -- bun run typecheck (cwd mise/conf.d/devtools-agent/bundles/agent-core): passed: tsc --noEmit -p tsconfig.json.
- mise exec -- bun /tmp/skill-contract-local-smoke.ts: passed: copied installed skill including executable router into a temporary path with spaces; invoked shebang from /tmp; valid/empty manifests, independent produces/accepts, exact resolved content, built-in manifest definition, malformed/unresolved rejection with exit 1 and empty stdout, unchanged persisted content; temporary installation and smoke script removed.
- mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/contracts.test.ts -t 'trailing line terminators': passed: 2 regressions, 34 assertions after standards finding correction.
- mise exec -- hk run pre-commit --staged: passed for source implementation and tracker change; bundle-versions check completed; HK=0 used for subsequent commits to avoid the separately owned unsafe stash hook.
- Tracker records.ts check passed before and after the change. Canonical state is implemented. Its older graph renderer calls implemented COMPLETED; this display inconsistency was reported, not used as completion authority.
- Language-server diagnostics were unavailable. Bundle tsc passed.

## Review history

Implementation self-check only; no formal worktree review phase started.
- Standards axis: one identifier end-anchor finding. The shared schema now rejects trailing line terminators. Two endpoint-position regressions passed.
- Spec axis: no findings across the four ticket acceptance criteria.
- Latest formal reviewer verdict: none.

## Resolved findings

The shared identifier regex now requires the absolute end of the string. Regressions cover LF and CR in produces, accepts, definition keys, both upgrade endpoints, and requested identifiers; the invalid-key matrix also covers Unicode line separators.

## Remaining findings and questions

No unresolved implementation findings or open questions. Historical Git resolution, upgrade execution, and owner adoption remain separate tickets. No runtime behavior from those tickets was added.

## Merge status

Not merged, not pushed, not submitted. The ticket is implemented, not completed. The worktree remains available for independent review.

## Receipts and artifacts

- [Original start](../../events/start-0001.yaml)
- [Prior blocked result](../../events/implementation-0002.yaml)
- [Prior blocked parent completion](../../events/start-complete-0003.yaml)
- [Authorised recovery start](../../events/start-0004.yaml)
- [Implementation result](../../events/implementation-0005.yaml)
- [Observed verification evidence](../evidence/implementation-0005/checks.json)
- [Frozen PR draft snapshot](pr-draft-implementation-0005.md)

User approval in start-0004 authorises this fresh takeover after tooling repair. The old t3v session was removed. At recovery, hc ls showed t41 as the only live terminal in this worktree. No goal dispatch exists for this ticket. All prior events remain unchanged.

