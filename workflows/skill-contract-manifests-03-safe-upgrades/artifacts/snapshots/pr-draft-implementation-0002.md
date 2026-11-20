# Safe contract upgrades

## Ticket summary

Implement [skill-contract-manifests-03-safe-upgrades](../../../../../tracker/tickets/skill-contract-manifests-03-safe-upgrades.md). Shared upgrade operations preserve owner-defined meaning and authored content.

## Problem statement

Manifest declarations previously resolved definitions but could not execute safe conversions before authorized mutation or explicit bulk conversion.

## Implementation summary

Source commit: 61325389b18be55808813456371f0ebdb270e285. Source tree: 6e606a819342ae734a569a304861c723d8e3a743. Branch: feature/skill-contract-manifests-03-safe-upgrades. The source worktree is clean.

Public safe-upgrade and bulk-upgrade commands reuse the shared manifest resolver. Installed owner adapters retain domain validation, legacy detection, immutable classification, operation destinations, conversion and mutation. Shared checks require one declared path, validated intermediate content, lossless authored-content comparison and final mutation validation before atomic persistence. Cleanup errors retain the actual persisted result and return nonzero.

The runnable note owner performs a structural title/body conversion, not a label replacement. It preserves text and metadata and rejects numeric values that cannot round-trip exactly. Other owners remain outside this ticket.

## Changed files

- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/SKILL.md
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/upgrades/contracts.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/upgrades/definitions.txt
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/upgrades/owner.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/upgrades/upgrade.txt
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/how-to-validate-contracts.md
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/references/manifest.md
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/references/upgrades.md
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.test.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.ts

Repository commit hooks generated the two plugin/catalogue metadata changes and set agent-core to 0.1.33. Source commits: e3e1c5cc (operations, example and regressions), 61325389 (guidance).

## Validation results

Working directory for all checks: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-03-safe-upgrades.

### 72 tests passed across 2 files; 291 assertions

```sh
'mise' 'exec' '--' 'bun' 'test' 'mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts'
```

Exit code: 0. 72 tests passed across 2 files; 291 assertions. Public commands cover declared and multi-step paths, operation destinations, legacy identity, conversion preservation, immutable refusal, rejected byte equality and actual bulk persistence.

### Scoped strict typecheck passed for all skill scripts, tests and the example owner

```sh
'mise' 'exec' '--' 'bun' '/tmp/skill-contract-typecheck-d81/node_modules/typescript/bin/tsc' '--noEmit' '-p' '/tmp/skill-contract-typecheck-d81/tsconfig.json'
```

Exit code: 0. Scoped strict typecheck passed for all skill scripts, tests and the example owner. Used isolated dependencies and mappings for Bun versioned imports; no source dependency installation.

### Real executable shebang CLI: validate and resolve left artifact bytes unchanged; safe-upgrade persisted a structural conversion and requested rename; bulk-upgrade persisted mutable input, rejected immutable input, returned partial/nonzero, and preserved rejected bytes; unsupported explicit ID rejected unchanged

```sh
'mise' 'exec' '--' 'bun' '/tmp/skill-contract-upgrade-smoke.ts'
```

Exit code: 0. Real executable shebang CLI: validate and resolve left artifact bytes unchanged; safe-upgrade persisted a structural conversion and requested rename; bulk-upgrade persisted mutable input, rejected immutable input, returned partial/nonzero, and preserved rejected bytes; unsupported explicit ID rejected unchanged.

### Before safety fixes: public regression scenarios reproduced authored numeric rounding and false unchanged reports after committed conversion plus lock cleanup failure

```sh
'mise' 'exec' '--' 'bun' 'test' 'mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.test.ts' '--test-name-pattern' 'unsafe authored|post-commit'
```

Exit code: 1. Before safety fixes: public regression scenarios reproduced authored numeric rounding and false unchanged reports after committed conversion plus lock cleanup failure. Six scenario assertions failed.

### After safety fixes: 6 public regression scenarios passed; 26 assertions

```sh
'mise' 'exec' '--' 'bun' 'test' 'mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.test.ts' '--test-name-pattern' 'unsafe authored|post-commit'
```

Exit code: 0. After safety fixes: 6 public regression scenarios passed; 26 assertions. Original bytes preserved for unsafe numbers; post-commit cleanup errors retained changed:true and failed status.

### Bundle typecheck unavailable: tsc was not installed in this source worktree

```sh
'mise' 'exec' '--' 'bun' 'run' '--cwd' 'mise/conf.d/devtools-agent/bundles/agent-core' 'typecheck'
```

Exit code: 127. Bundle typecheck unavailable: tsc was not installed in this source worktree. Replaced verification with the passing isolated scoped strict typecheck above.


The final relevant suite passed 72 tests with 291 assertions. The real executable CLI smoke verified persisted structural conversion, requested rename, authored-content preservation, byte-identical read-only access and rejections, and partial bulk persistence. The original bundle typecheck could not run without tsc; the isolated scoped strict typecheck passed. Temporary smoke and compiler files were removed after verification. No evidence run was created.

## Review history

No formal worktree review phase has run. Internal implementation checks found one standards issue and two spec issues, representing two unique defects. Their retained results are [standards](file:///var/home/zenobius/.local/state/result-delivery/runs/0cd923ba-f9a0-4209-9008-5ececb0d9e06/result.json) and [spec](file:///var/home/zenobius/.local/state/result-delivery/runs/8114a260-8b73-40db-a7ff-d0ee33fd262e/result.json). Both child processes stopped; their panes were removed and shutdown was confirmed. No services remain.

## Resolved findings

- Numeric rounding: reject source numeric values whose exact decimal value changes during JSON parsing and serialization. Public regression tests failed before the fix and passed after it.
- Post-commit cleanup reporting: attempt cleanup independently and retain changed:true after a successful rename. Public single-file and bulk fault-injection regressions failed before the fix and passed after it.

## Remaining findings

No known implementation findings remain. Formal parent review remains pending.

## Latest reviewer verdict

None. Internal implementation checks are not a worktree review verdict.

## Merge status

Not merged or pushed. No PR was submitted. The ticket remains claimed, not completed.

## Supporting records

- [Start receipt](../../events/start-0001.yaml)
- [Implementation result](../../events/implementation-0002.yaml)
- [Immutable implementation draft](../../artifacts/snapshots/pr-draft-implementation-0002.md)
