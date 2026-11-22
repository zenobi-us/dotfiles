# Grooming contract adoption

## Ticket summary

Ticket: [skill-contract-manifests-12-backlog-grooming](../../../../tracker/tickets/skill-contract-manifests-12-backlog-grooming.md).

## Problem

Research reports and compiled proposed actions had no explicit version. Consumers could interpret unsupported artifacts as current data.

## Implementation

Declared report and action contracts with current v2 outputs and historical v1 readers. Added shared safe upgrades through the owning command. Updated report authorship and action consumers. Preserved report sections, verdict conditions, evidence, authored findings, action identities, and action details.

Source commit: `4d56acb1e2863fd616577cae0afb3edc1a3cb8d3`.
Source tree: `27b7aacba6e27c3ba0e5c043e724591f06333190`.

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

## Validation

Manifest validation and all four definition resolutions passed. Owning command regressions passed: 2 tests and 49 assertions. The real check, render, check-actions, upgrade, and post-upgrade check passed on a temporary historical report. Checking preserved report bytes. Compilation preserved authored action detail exactly. Regression scenarios rejected unsupported identifiers, invalid verdict conditions, missing sections, duplicate action identities, unsafe numeric metadata, and immutable history. Rejected upgrades preserved source bytes. Bulk partial failure retained accurate item outcomes.

Exact argv, cwd, exit codes, stdout, stderr, commit, and tree are in [validation evidence](validation-implementation-0002.json).

TypeScript language-server diagnostics were unavailable because the server failed. Runtime verification passed. No full-repository validation was claimed. An early command-test timeout exposed a circular import; the pure report validator now avoids that cycle. Final command tests passed.

## Review history

No formal independent review yet. The next worktree phase is review of the committed source. No merge or push occurred. The ticket remains claimed.

## Findings and questions

No unresolved implementation finding or open domain question. The parent must perform the independent review phase.

## Receipts

- [Phase start](../../events/start-0001.yaml)
- [Implementation result](../../events/implementation-0002.yaml)
