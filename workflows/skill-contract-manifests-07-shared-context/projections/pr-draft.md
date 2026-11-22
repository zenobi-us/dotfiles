# Adopt contracts in shared-context operations

## Ticket summary

Ticket: skill-contract-manifests-07-shared-context. Initiative: skill-contract-manifests.
Source: `fc4bf19ed4d42aae5fb246e40904f4be956d3298`. Tree: `7f3a38fb53fa37605d2128815c2c3d9f8041b122`.
State: REVIEW_FAILED; fix the current blocking finding before another review.

## Problem

Review-0011 found three compatibility failures: aliased upgrade reporting, retained migration-plan readers, and historical project identity preservation.

## Implementation summary

Preserve lexical caller paths in public upgrade results while keeping canonical filesystem guards. Read retained migration resolutions under their historical shape without rewriting plan IDs, property order, snapshots, or event hashes. Preserve equivalent authored project identity bytes; reject canonical remote mismatches during init and migration.

Commits: 58e472f0 (STD-001), 1101dfb2 (SPEC-01), fc4bf19e (SPEC-02). Existing commit hooks updated bundle metadata.

## Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/references/upgrades.md`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/tasks/migrate.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/changelog.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test/contracts.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-migration.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.test.ts`

## Validation results

- Affected suite: 152 passed; one new alias fixture failed because its routes were incomplete. Corrected that fixture; targeted rerun passed (1 test, 4 assertions). No production-code change followed the suite. The seven-file run made 698 assertions.
- Actual source records.ts upgrade through an ancestor-aliased shared-store root: partial result retains both selected paths, persists v2 for the valid ticket, preserves the rejected ticket, and reports changed fields and required publication.
- Exact fixed-base archive e89668ebab19e7b40b7cb03edcf59a2c2e3ba0ba produced and applied plan e84129a50ebec9bde7851b25. Actual source migrate check returned contentVerified:true; idempotent apply returned idempotent:true. Original plan and every event remained byte-identical.
- Actual source shared-context migrate sources --to shared and init --store shared: equivalent historical .git origins, with and without authored extra fields, remained byte-identical. Both commands rejected a different remote without replacing metadata.
- Source resolution emitted shared-context-resolution/v1. New-plan regression keeps current versioned route snapshots.
- TypeScript LSP could not initialize: TypeScript is absent. No typecheck claimed.
- Tests used copied source and real Ajv 8.20.0, YAML 2.9.1, Crust core 0.0.19/plugins 0.1.2, with qualified aliases only outside source. Initial isolated HOME smoke setup could not find Bun/mq; corrected PATH and used the existing mise environment for explicit disposable tracker paths.

## Review and implementation history

- implementation-0002 adopted owned contracts at 2d5779034ef9f36b24356632a327070ae61daea0; start and completion retained.
- review-0005 returned FAILURE for that source with Standards-1, Standards-2 and SPEC-01 through SPEC-05.
- fix-0008 addressed those seven findings at 3a70f87bac3f44cd6ceb41cebd0887c11ebdbb59; fix-complete-0009 retained. Prior validation: 117 passed, 494 assertions.
- review-0011 returned FAILURE for 3a70f87bac3f44cd6ceb41cebd0887c11ebdbb59 with STD-001, SPEC-01 and SPEC-02. review-complete-0012 retained.
- fix-approval-0013 authorized transfer after prior-owner exit. fix-start-0014 authorized this independent attempt.
- fix-0015 resolves the three review-0011 findings at the new source above. Previous events and reviews remain unchanged.

## Resolved findings

Review-0011: STD-001, SPEC-01, SPEC-02. Review-0005 resolutions remain recorded under fix-0008; finding IDs are scoped to their review.

## Remaining findings

Review-0018 has one blocking finding, SPEC-0018-01. STD-0018-01 is a non-blocking heuristic. Prior resolved findings remain recorded under their original reviews.

## Latest reviewer verdict

FAILURE from review-0018 for fc4bf19ed4d42aae5fb246e40904f4be956d3298. See the immutable review artifact for findings and evidence.

## Merge status

Not merged, rebased, or pushed. Ticket remains claimed and unchanged. Source commits are clean. Parent completion validates the delivered result and retains the source worktree.

## Open questions

None. Parent validated and acknowledged the result, closed the fixer terminal, and confirmed all registered process shutdown. The current blocking finding requires a fix.

## Supporting records

- [start-0001](../events/start-0001.yaml).
- [implementation-0002](../events/implementation-0002.yaml).
- [start-complete-0003](../events/start-complete-0003.yaml).
- [review-start-0004](../events/review-start-0004.yaml).
- [review-0005](../events/review-0005.yaml).
- [review-complete-0006](../events/review-complete-0006.yaml).
- [fix-start-0007](../events/fix-start-0007.yaml).
- [fix-0008](../events/fix-0008.yaml).
- [fix-complete-0009](../events/fix-complete-0009.yaml).
- [review-start-0010](../events/review-start-0010.yaml).
- [review-0011](../events/review-0011.yaml).
- [review-complete-0012](../events/review-complete-0012.yaml).
- [fix-approval-0013](../events/fix-approval-0013.yaml).
- [fix-start-0014](../events/fix-start-0014.yaml).
- [fix-0015](../events/fix-0015.yaml).
- [review-review-0005.md](../artifacts/reviews/review-review-0005.md).
- [review-review-0011.md](../artifacts/reviews/review-review-0011.md).
- [pr-draft-implementation-0002.md](../artifacts/snapshots/pr-draft-implementation-0002.md).
- [pr-draft-fix-0008.md](../artifacts/snapshots/pr-draft-fix-0008.md).
- [pr-draft-fix-0015.md](../artifacts/snapshots/pr-draft-fix-0015.md).

## Parent completion

[fix-complete-0016](../events/fix-complete-0016.yaml) records verified delivery, exact clean source, passing parent resolver smoke, and confirmed child resource shutdown. No merge or push occurred.

## Review-0018 outcome

The independent review returned FAILURE for the unchanged source. Standards: one non-blocking P3 heuristic. Spec: one blocking P2 finding. The affected suite passed 153 tests and 701 assertions. Owning CLI scenarios exposed the blocking index producer/read mismatch. No typecheck or combined current-base integration approval is claimed.

[Immutable review](../artifacts/reviews/review-review-0018.md), [review result](../events/review-0018.yaml), and [parent completion](../events/review-complete-0019.yaml) contain the evidence. The parent checked delivery, appended the ticket verdict, closed the reviewer, and confirmed process shutdown. Source remains clean and unmodified. Nothing was merged or pushed.
