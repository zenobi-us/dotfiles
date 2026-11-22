# Grooming contract adoption

## Ticket summary

[Adopt contracts in backlog grooming](../../../tracker/tickets/skill-contract-manifests-12-backlog-grooming.md).

## Problem statement

Reports and proposed action records needed explicit identities, validated historical readers, and lossless upgrade boundaries.

## Implementation summary

Declared grooming report and proposed-action contracts; added historical readers, shared safe upgrades, checked action consumption, preserved authored content and action identities, and verified public owning commands.

Source commit: `4d56acb1e2863fd616577cae0afb3edc1a3cb8d3`.
Source tree: `27b7aacba6e27c3ba0e5c043e724591f06333190`.

The commit also contains developer plugin version updates from `0.2.65` to `0.2.66` in plugin and marketplace metadata.

## Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/contracts.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/references/contracts/actions-v1.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/references/contracts/actions-v2.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/references/contracts/report-v1.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/references/playbooks/collate.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/references/playbooks/propose.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/references/report-contract.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/references/upgrades.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/scripts/grooming-report.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/scripts/grooming-report.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/scripts/report-owner.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/scripts/reports.ts`

## Validation results

- `/home/zenobius/.omp/agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts validate --skill /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming/mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming`
  - cwd: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming`; exit: `0`.
- `/home/zenobius/.omp/agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts resolve --skill /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming/mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming --contract grooming-report/v1`
  - cwd: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming`; exit: `0`.
- `/home/zenobius/.omp/agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts resolve --skill /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming/mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming --contract grooming-report/v2`
  - cwd: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming`; exit: `0`.
- `/home/zenobius/.omp/agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts resolve --skill /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming/mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming --contract grooming-actions/v1`
  - cwd: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming`; exit: `0`.
- `/home/zenobius/.omp/agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts resolve --skill /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming/mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming --contract grooming-actions/v2`
  - cwd: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming`; exit: `0`.
- `mise exec -- bun test /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming/mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/scripts/grooming-report.test.ts`
  - cwd: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming`; exit: `0`.
- `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming/mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/scripts/grooming-report.ts check /tmp/grooming-owning-smoke-t6cfuxia`
  - cwd: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming`; exit: `0`.
- `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming/mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/scripts/grooming-report.ts render /tmp/grooming-owning-smoke-t6cfuxia`
  - cwd: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming`; exit: `0`.
- `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming/mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/scripts/grooming-report.ts check-actions /tmp/grooming-owning-smoke-t6cfuxia/actions.json`
  - cwd: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming`; exit: `0`.
- `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming/mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/scripts/grooming-report.ts upgrade /tmp/grooming-owning-smoke-t6cfuxia/selected.json`
  - cwd: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming`; exit: `0`.
- `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming/mise/conf.d/devtools-agent/bundles/developer/skills/backlog-grooming/scripts/grooming-report.ts check /tmp/grooming-owning-smoke-t6cfuxia`
  - cwd: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-12-backlog-grooming`; exit: `0`.

The command regression suite passed 2 tests and 49 assertions. The owning-command smoke preserved exact authored detail. Rejected and immutable inputs remained unchanged. TypeScript language-server diagnostics were unavailable. No full-repository validation was claimed.

## Review history

No independent review result exists in the event history.

## Resolved findings

No formal review findings yet.

## Remaining findings

None recorded. Independent review is the next parent-owned phase.

## Latest reviewer verdict

None.

## Merge status

Not merged or pushed. Ticket remains claimed.

## Supporting receipts and artifacts

- [start-0001](../events/start-0001.yaml): start / started.
- [implementation-0002](../events/implementation-0002.yaml): implementation / completed.
- [Immutable implementation snapshot](../artifacts/snapshots/pr-draft-implementation-0002.md)
- [Exact validation evidence](../artifacts/snapshots/validation-implementation-0002.json)
