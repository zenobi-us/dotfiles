---
created: 2026-11-21T02:57:54.483154Z
title: Independent tracker contract review
type: Report
---

# Independent tracker contract review

Verdict: **FAILURE**. Standards: 0 findings. Spec: 2 confirmed P2 findings.

## Source and authority

Ticket: `tracker/tickets/skill-contract-manifests-04-tracker.md`. Parent: `tracker/initiatives/skill-contract-manifests/index.md`.

Reviewed branch: `feature/skill-contract-manifests-04-tracker`. Base branch: `master`.
Reviewed commit: `b062761b4a31681f4e826c4e3dad8770e8944607`.
Reviewed tree: `c741f5a04985243460a9677166ab9d049d836e9b`.
Review base: `64f9621c136355337bbcf9c2e8ae31ddb4091257`.
Three-dot merge base: `cfd5af676f097aa7eae186357502972a03e0d61e`.
Timestamp: `2026-11-21T02:57:54.483154Z`.

The exact diff command was:

```sh
git diff 64f9621c136355337bbcf9c2e8ae31ddb4091257...b062761b4a31681f4e826c4e3dad8770e8944607
```

The source-side commit list contains one commit: `b062761b feat(tracker): skill-contract-manifests-04-tracker adopt v2`.
Base-only commits are `64f9621c`, `3098aa47`, `4899a33d`, and `969d261c`.
They change tracker/workflow metadata, not product code.
The publication checkout also contains the parent-owned review-start event.

The review used the canonical ticket, complete initiative, implementation receipt and snapshot.
The implementation's self-review was context, not independent proof.
It also used `CONTEXT-MAP.md`, `CONTEXT.md`, domain guidance, tracker guidance, and the ADR index.
**NO ADR** applies. The sole indexed Pi Ink cleanup ADR does not govern this tracker change.

## Producer and consumer contracts

- **Tracker records:** Current ticket/initiative writers use v2 `schemaVersion` only. Explicit v1 and supported unversioned readers remain available.
- **Tracker results:** The owner validates `tracker-result/v2`. Transport accepts that identity without changing `result-delivery/v1` or worktree receipt identities.
- **Migration history:** New plans/events use v2. Retained v1 plan IDs, property order, event hashes and bytes remain unchanged on check and idempotent apply.
- **Setup contracts:** Answers/state have v1 readers and declared v2 conversion. Setup results/errors have their own contracts.
- **Shared ownership:** The tracker references foreign transport definitions. Shared `skill-contracts` owns manifest validation, path selection and persistence. The tracker owns content validation and conversion.
- **Discovery consumers:** Normal graph and explorer readers accept historical/current records. They enforce direct initiative membership. SPEC-1 exposes a missing writer preflight.

## Standards

No concrete new Standards defect found. The tracker owner retains record and result validation. Shared contract code retains declaration resolution, upgrade selection and persistence. Explicit historical readers retain migration identities and event hashes. Record conversion compares authored bytes and initiative membership before persistence.

The fresh Standards session found no documented-standard breach or blocking baseline smell.
It inspected the frozen source without tests, builds, lint or edits.

## Spec

Two specification defects: ticket mutations bypass membership validation, and setup-answer conversion discards authored comments.

### SPEC-1 — P2: Validate ticket membership before persistence

ADR: `NO ADR`.
File: `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-migration.ts:321`.

The ticket requires: "Reject unsupported or unsafe inputs without persisted changes." The owning procedure also promises to validate "complete direct membership" before scalar updates. recordResult returns immediately for tickets, so update and bulk upgrade never inspect their initiative. A valid v1 ticket with parent release, omitted from release’s versioned Tickets index, is rewritten successfully. Both normal graph and explorer readers reject that same membership inconsistency. The mutation therefore reports passed validation for output that normal discovery cannot read.

Required change: Validate the selected ticket’s direct parent/index relationship before safeUpgrade or bulkUpgrade. Reject inconsistent membership without changing bytes. Keep valid standalone and supported hierarchical tickets usable.

Validation command:

```sh
"$TICKET_SKILL_ROOT/scripts/records.ts" update --repository "$FIXTURE_REPOSITORY" --ticket T-1 --request "$UPDATE_REQUEST"; "$TICKET_SKILL_ROOT/scripts/records.ts" check --repository "$FIXTURE_REPOSITORY" --ticket T-1
```

### SPEC-2 — P2: Preserve authored setup-answer comments

ADR: `NO ADR`.
File: `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/setup.ts:344`.

The parent requires: "Automatic conversion requires a declared, supported path that preserves meaning and authored content." The registered setup adapter accepts commented historical YAML answers. Its preservation hook returns only parseAnswers output, and convert writes JSON.stringify of that output. A shared safe-upgrade on answers.yml therefore deletes authored YAML comments while reporting a lossless conversion; the preservation comparison cannot detect the loss.

Required change: Preserve YAML comments during setup-answer conversion, or reject commented inputs with byte equality. Include authored content in the preservation value rather than only parsed decisions.

Validation command:

```sh
"$SKILL_CONTRACTS_ROOT/scripts/router.ts" safe-upgrade --skill "$TICKET_SKILL_ROOT" --owner file:scripts/setup.ts --artifact "$COMMENTED_HISTORICAL_ANSWERS" --operation upgrade
```

### Confirmed reproduction results

SPEC-1 used a disposable Git repository with a v1 ticket whose parent was `release`.
The versioned `release` index omitted that ticket from `## Tickets`.
The owning `check` command rejected it before mutation.
The owning `update` returned exit 0, `ok: true`, and passed validation while changing its bytes.
The next `check` rejected the same membership mismatch.
Explicit bulk upgrade also returned success and changed that ticket.
The diagnostic was `initiative release is missing ticket T-1 from its Tickets index.`

SPEC-2 used `answers.yml` containing a rationale comment, `schema: 1`, and a valid backend.
The declared shared `safe-upgrade` command loaded the installed `setup.ts` owner.
It returned `status: completed`, `changed: true`, and the expected v2 destination.
The persisted JSON omitted the authored YAML rationale comment.
Normal setup staging does not rewrite the input answers file. This finding concerns the declared direct conversion path.

## Verification

```sh
mise exec -- bun test mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/scripts
```

Exit `1`. 112 passed; two files could not load the known version-qualified Ajv dependency. No behavioral test failure in the loaded files. Imported files were retried separately with isolated Ajv 8.17.1 through an ignored temporary link.

```sh
mise exec -- bun test mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.test.ts mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-upgrade.test.ts
```

Exit `0`. 30 passed; 170 assertions. Only the two previously unexecuted files ran after isolated Ajv 8.17.1 preparation. All 142 tests from the declared owner/delivery selection passed across the initial loaded files and this retry. Expected missing-member mq diagnostics appeared during rejection tests.

```sh
mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts
```

Exit `0`. 33 passed; 288 assertions.

```sh
mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/data.test.ts --test-name-pattern versioned|initiative links
```

Exit `0`. 5 passed; 40 filtered; 24 assertions. Known broad-suite explorer failures were not rerun.

```sh
mise exec -- bun --install=fallback /tmp/tracker-independent-smoke.ts
```

Exit `0`. Actual production shebang CLI and graph reader passed old v1 read/check byte equality, authorized ticket/initiative update with v2-only identity and authored content preservation, explicit partial bulk rejection byte equality, current owner result validation, current migrate plan/apply/check, and retained v1 migration check/idempotent apply with unchanged plan/event bytes. Fixture removed. First attempt had a historical-fixture property-order error; corrected fixture used the owning saved-plan output, not canonically sorted transport output.

```sh
mise exec -- bun --install=fallback /tmp/tracker-review-defects.ts
```

Exit `0`. Confirmed SPEC-1: check rejected missing ticket membership before and after update, while update and bulk both returned success and changed bytes. Confirmed SPEC-2: declared shared safe-upgrade of commented historical answers returned completed and erased authored comment. Fixtures removed.

```sh
mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts validate --skill /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets
```

Exit `0`. Owner manifest, all produced/accepted definitions and declared upgrade procedures resolved successfully.

The preservation fixture checked ticket identity, direct blockers, unknown nested metadata, body text and comments.
It also checked initiative body and membership links, including v2-only output identities.
Every runtime scenario used disposable repositories. No live tracker files changed.
Throwaway scenarios and isolated dependencies were removed after execution.

## Integration compatibility

The frozen review base differs only in workflow/tracker metadata.
The changed transport dispatch is restricted to tracker result identities.
The worktree explorer delegates record validation to the tracker owner.
The declared delivery and explorer checks passed on the frozen source.

No integration candidate was prepared. Textual and behavioral compatibility with a future base remains an integration gate.
The separate muxer workstream overlaps manifests, receipts and explorer consumers.
The frozen repair workstream also touches `workflow.ts` and retains its own FAILURE review.
This review neither integrates nor approves either workstream. Coordination inventory remains incomplete, as the handoff states.

## Limits and resources

- **Verification limit:** The implementation broad suite previously failed unchanged explorer assertions data.test.ts:296 and :609. No baseline run exists. These known failures were not rerun and remain disclosed limits.
- **Verification limit:** The first declared owner suite invocation could not load two files because Bun test does not auto-resolve version-qualified Ajv. Only those unexecuted files were retried using isolated dependencies.
- **Verification limit:** No integration candidate was prepared or tested. This review covers the frozen source, not another workstream or a future base/source merge.
- **Verification limit:** No repeated typecheck, broad suite, live tracker migration, source edit, commit, push, tracker update or projection update ran.

Two fresh depth-2 sessions performed the Standards and Spec axes concurrently.
Both delivered typed `review-axis/v1` reports. Their hashes were verified and acknowledged.
Both OMP processes exited with Ctrl+D before their owned shell terminals were removed.
The final resource observer reported `shutdown: confirmed` for both runs.
No unrelated terminal or service was stopped. No exceptional signal was needed.
The installed wait router returned one timeout and one null-status completion error; these did not establish domain success.
Typed delivery, explicit shell observations and final process-identity observations supplied separate evidence.
The desktop listing confirmed both child tabs were absent and the review workspace remained open.

- **Owned child:** `a874fe38-f9e5-4f61-9f58-8938de54e9f3` — `confirmed`; observed PIDs 1596789.
- **Owned child:** `a5310414-9b5c-45bc-a526-6fba923961a1` — `confirmed`; observed PIDs 1596867, 1602134.

## Exact changed scope

- **Changed file:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/data.test.ts`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/scripts/delivery.test.ts`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/scripts/delivery.ts`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow.ts`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/.claude-plugin/plugin.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/SKILL.md`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/assets/tree/alignment/docs/agents/issue-tracker.md.jinja`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/contracts.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/initiative-legacy-v1.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/initiative-v1.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/initiative-v2.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/migration-plan-v1.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/migration-plan-v2.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/migration-v1.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/migration-v2.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/record-upgrade.md`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/result-v1.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/result-v2.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/ticket-legacy-v1.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/ticket-v1.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/ticket-v2.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/result-contract.md`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/schema.md`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/answers-v1.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/answers-v2.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/error-v1.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/result-v1.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/state-v1.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/state-v2.json`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/upgrade-v1-v2.md`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup/cli.md`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/stores/local-markdown.md`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/tasks/initiative.md`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/tasks/migrate.md`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/usage.md`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/dep-tree-markdown.test.ts`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/dep-tree-markdown.ts`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-markdown.mq`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-migration.ts`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-schema.test.ts`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-schema.ts`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-upgrade.test.ts`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-upgrade.ts`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.test.ts`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/setup.test.ts`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/setup.ts`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/validate-result.test.ts`
- **Changed file:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/validate-result.ts`

## Decision

Keep this source unmerged. Resolve SPEC-1 and SPEC-2, then review the new exact source independently.

