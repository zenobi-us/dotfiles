---
created: 2026-11-21T03:39:56.682017+00:00
title: Independent post-fix tracker review
type: Report
---

# Independent post-fix tracker review

## Verdict

**SUCCESS**. Standards: 0 findings. Spec: 0 findings. No blocking findings remain for the frozen source.

## Source and authority

Ticket: `tracker/tickets/skill-contract-manifests-04-tracker.md`. Parent: `tracker/initiatives/skill-contract-manifests/index.md`.
Source branch: `feature/skill-contract-manifests-04-tracker`. Base branch: `master`.
Source commit: `007dbbf52e4fc2da57ac10ebdafcf9e23c1adf4d`.
Source tree: `232b6a74548c15731a6fba4290a21936357c6ece`.
Review base: `a831e8cafda04d6102adc3220d829bb6990ccca6`.
Timestamp: `2026-11-21T03:39:56.682017+00:00`. Review attempt: 2. Receipt: `review-0011`.
Publication checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`. Source checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker`.

Exact full-source diff:
```sh
git diff a831e8cafda04d6102adc3220d829bb6990ccca6...007dbbf52e4fc2da57ac10ebdafcf9e23c1adf4d
```
Exact fix delta:
```sh
git diff b062761b4a31681f4e826c4e3dad8770e8944607..007dbbf52e4fc2da57ac10ebdafcf9e23c1adf4d
```
Source commits: `b062761b feat(tracker): skill-contract-manifests-04-tracker adopt v2`; `007dbbf5 fix: skill-contract-manifests-04-tracker safety guards`.
The review covers the full original implementation and its fix, not the fix alone.

The review consumed the canonical ticket, complete parent initiative, original implementation receipt and draft, fix-0008 receipt and draft, previous review-0005 receipt and artifact, and review-start-0010.
It used CONTEXT-MAP.md, CONTEXT.md, domain guidance, tracker guidance and the ADR index.
The previous FAILURE is stale for this new source. Fixer checks are context, not independent proof.
**NO ADR** applies. The only indexed ADR concerns Pi Ink cleanup, not tracker contracts.

## Standards

No substantiated Standards findings. Reviewed the full 53-file diff from a831e8cafda04d6102adc3220d829bb6990ccca6 to 007dbbf52e4fc2da57ac10ebdafcf9e23c1adf4d, including the safety fix delta. Checked injected repository rules, CONTEXT-MAP.md, CONTEXT.md, docs/agents/domain.md, docs/agents/issue-tracker.md, and docs/adr/index.md. The sole indexed ADR concerns Pi Ink cleanup and does not apply. No documented-standard breach or material baseline smell was established. Historical and current definitions deliberately describe separate wire contracts; their similarity alone is not a duplication finding. The setup YAML comment guard explicitly rejects conversion that cannot preserve comments. It does not silently discard them. Verdict: PASS for Standards only.

Fresh muxer child `d82d995c-5529-45df-8bd1-7711257b0c24` returned an immutable typed `code-review-axis/v1` report.
Its transport hash is `718f64fca4e2db411db807e2b0075620c0671562912fd106f54c0eebd0dd6902`.
This axis performed static review only. It ran no tests, builds, lint or source edits.
The supplied baseline covered Mysterious Name, Duplicated Code, Feature Envy, Data Clumps, Primitive Obsession, Repeated Switches, Shotgun Surgery, Divergent Change, Speculative Generality, Message Chains, Middle Man and Refused Bequest.
Repo rules override these heuristics. Tool-enforced rules were not reported as findings.

## Spec

No substantiated Spec findings. Reviewed the full branch diff and safety-fix delta against the supplied initiative and tracker acceptance criteria. The current cutover declares owned contracts, retains explicit historical readers, and adds owning update and bulk-conversion operations. The safety fix checks parent-initiative membership before ticket persistence. The setup adapter rejects non-JSON YAML containing '#' without rewriting the source. This conservative restriction satisfies the preservation boundary; broader YAML support is not required. Runtime acceptance remains unverified in this read-only review.

Fresh muxer child `3b0e0189-a89f-49cc-85f4-1e6c60af0cb9` returned an immutable typed `code-review-axis/v1` report.
Its transport hash is `10d38221d3dc83f77983652c265b40be8921284127104f849be6fdd72adb7911`.
This axis performed static review only. Parent-owned production probes and checks below supply independent runtime acceptance.

## Findings

None. No finding requires an ID, severity, ADR, location or required change.

## Earlier finding resolution

### SPEC-1 — resolved

`record-migration.ts:321-323` calls `validateTicketParent` before returning a ticket projection.
The helper at lines 347-370 follows ticket ancestors and calls the existing initiative `recordResult` validator.
Both update and bulk preflight use that projection before shared persistence.
A disposable v1 ticket omitted from its parent index failed update with exact unchanged Markdown bytes.
A mixed bulk selection returned nonzero and partial status. The invalid ticket stayed byte-identical while a standalone ticket upgraded.
Valid standalone, direct and supported hierarchical update/check commands passed.
The direct membership validator remains the common owner rule; the fix does not establish a second membership definition.

### SPEC-2 — resolved

`setup.ts:342-349` rejects non-JSON YAML containing any `#` before JSON conversion.
Valid historical commented answers and a valid quoted-`#` value rejected without byte changes.
Valid uncommented historical YAML upgraded to `tracker-setup-answers/v2`.
Normal production setup plan, authorized init and check passed.
The conservative quoted-value rejection is documented. The owning contract requires lossless conversion, not support for every YAML spelling.
Valid historical fixtures used `schema: 1`, `tracker_backend: local-markdown`, and `instruction_file: AGENTS.md`.
No malformed `backend` fixture was treated as a product failure.

## Producer and consumer contracts

- **Contract:** tracker-initiative/ticket v1 explicit historical readers and v2 schemaVersion producers.
- **Contract:** tracker-result/v2 owner validation and result-delivery/v1 transport compatibility.
- **Contract:** tracker-migration-plan/event v1 immutable history and v2 current writers.
- **Contract:** shared skill-contracts manifest, historical resolution, safeUpgrade and bulkUpgrade owner adapter.
- **Contract:** tracker setup answers/state v1 readers and v2 authorized mutation.
- **Contract:** normal Markdown graph and pi-shared-context explorer membership/identity validation.

The tracker owns record/result content validation and conversion. Shared skill-contracts owns declarations, path selection, locking and persistence.
Current record/result/migration writers emit their v2 `schemaVersion` identities only.
Explicit v1 and supported unversioned readers remain separate from current producers.
Foreign transport references retain result-delivery ownership. No new result-delivery or worktree receipt wire version is claimed.
Normal graph and explorer consumers participate in the same record cutover.
Immutable migration history remains historical; checks do not stamp it.

## Independent runtime validation

All three declared integration checks ran once after isolated dependency preparation.
They passed: owner/delivery selection 145 tests; worktree delivery 33 tests; filtered explorer 5 tests.
The broad explorer cases at data.test.ts:296 and :609 were not rerun.
No full explorer-suite pass is claimed.

Production shebang commands ran against disposable Git repositories, not live tracker data.
The owner scripts use Bun `--install=fallback`; no source resolver shim was added.
Qualified Ajv and Crust links existed only through a temporary isolated node_modules tree.
A process-local `core.excludesfile` ignored that link. It changed no repository config.
The link and isolated dependencies were removed before publication.

Observed scenario assertions:
- **Passed:** SPEC-1 inconsistent update and partial bulk reject with exact unchanged bytes; independent standalone item upgrades.
- **Passed:** v1 read/check byte preservation; v2 authorized mutation preserves exact remaining authored bytes, comments, unknown fields, identity, parent and blockers.
- **Passed:** supported hierarchical parent update/check remains usable.
- **Passed:** SPEC-2 valid commented and quoted-# historical YAML reject unchanged; valid uncommented historical YAML upgrades.
- **Passed:** normal authorized setup plan/init/check pass with valid legacy answers.
- **Passed:** current immutable migration plan/events unchanged on production check and idempotent apply.
- **Passed:** historical v1 migration snapshot and event-chain exact bytes retained on production check and idempotent apply.
- **Passed:** actual owner result validator accepts production v2 result and rejects malformed ticket projection.

The current and historical migration probes used actual plan/apply/check commands.
The historical fixture retained its v1 plan ID, property order, event hashes, event count and exact snapshot/event bytes.
The current result validator accepted the production v2 result and rejected a malformed ticket projection.
The passing owner suite also exercises nonempty direct-blocker preservation through the actual update CLI.

One initial probe used noncanonical setup artifact basenames (`comment.yaml`, `quoted.yaml`, `plain.yaml`).
The owner correctly refused those names at its immutable-artifact boundary.
The probe then used separate directories with the supported `answers.yaml` basename.
Only those corrected cases establish comment-guard acceptance. This fixture error is not a product finding.
Temporary scripts and fixture repositories were removed.

### Exact command observations

Each entry records the actual argv and cwd. Expected rejection exits are acceptance checks, not failed tests.

1. Cwd: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker`. Exit: `0`.

```sh
mise exec -- bun test mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/scripts
```

145 passed, 0 failed; 808 assertions; 11 owner/delivery files

2. Cwd: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker`. Exit: `0`.

```sh
mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts
```

33 passed, 0 failed; 288 assertions

3. Cwd: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker`. Exit: `0`.

```sh
mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/data.test.ts --test-name-pattern 'versioned|initiative links'
```

5 passed, 40 filtered, 0 failed; 24 assertions

4. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `1`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts update --repository /tmp/review-0011-fixtures-y26r9ueh/repo --ticket T-1 --request /tmp/review-0011-fixtures-y26r9ueh/request.json
```

Production command returned a validated JSON result.

5. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `1`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts upgrade --repository /tmp/review-0011-fixtures-y26r9ueh/repo --artifacts /tmp/review-0011-fixtures-y26r9ueh/items.json
```

Production command returned a validated JSON result.

6. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts check --repository /tmp/review-0011-fixtures-y26r9ueh/repo --ticket T-1
```

Production command returned a validated JSON result.

7. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts update --repository /tmp/review-0011-fixtures-y26r9ueh/repo --ticket T-1 --request /tmp/review-0011-fixtures-y26r9ueh/request.json
```

Production command returned a validated JSON result.

8. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts check --repository /tmp/review-0011-fixtures-y26r9ueh/repo --ticket T-1
```

Production command returned a validated JSON result.

9. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts update --repository /tmp/review-0011-fixtures-y26r9ueh/repo --ticket SOLO --request /tmp/review-0011-fixtures-y26r9ueh/request.json
```

Production command returned a validated JSON result.

10. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts check --repository /tmp/review-0011-fixtures-y26r9ueh/repo --ticket SOLO
```

Production command returned a validated JSON result.

11. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts update --repository /tmp/review-0011-fixtures-y26r9ueh/repo --ticket CHILD --request /tmp/review-0011-fixtures-y26r9ueh/request.json
```

Production command returned a validated JSON result.

12. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts check --repository /tmp/review-0011-fixtures-y26r9ueh/repo --ticket CHILD
```

Production command returned a validated JSON result.

13. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `1`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts safe-upgrade --skill /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets --owner file:scripts/setup.ts --artifact /tmp/review-0011-fixtures-y26r9ueh/comment/answers.yaml --operation upgrade
```

Cannot losslessly upgrade YAML containing '#'; retain the authored file and convert it with a comment-preserving editor.

14. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `1`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts safe-upgrade --skill /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets --owner file:scripts/setup.ts --artifact /tmp/review-0011-fixtures-y26r9ueh/quoted/answers.yaml --operation upgrade
```

Failed source content validation.

15. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts safe-upgrade --skill /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets --owner file:scripts/setup.ts --artifact /tmp/review-0011-fixtures-y26r9ueh/plain/answers.yaml --operation upgrade
```

Production command returned a validated JSON result.

16. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/setup.ts plan /tmp/review-0011-fixtures-y26r9ueh/setuprepo --answers /tmp/review-0011-fixtures-y26r9ueh/answers.yaml --shared-context /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts --json
```

Production command returned a validated JSON result.

17. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/setup.ts init /tmp/review-0011-fixtures-y26r9ueh/setuprepo --answers /tmp/review-0011-fixtures-y26r9ueh/answers.yaml --shared-context /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts --json
```

Production command returned a validated JSON result.

18. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/setup.ts check /tmp/review-0011-fixtures-y26r9ueh/setuprepo --shared-context /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts --json
```

Production command returned a validated JSON result.

19. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts migrate plan --repository /tmp/review-0011-fixtures-y26r9ueh/repo --ticket LEGACY --output /tmp/review-0011-fixtures-y26r9ueh/plan.json
```

Production command returned a validated JSON result.

20. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts migrate apply --repository /tmp/review-0011-fixtures-y26r9ueh/repo --plan /tmp/review-0011-fixtures-y26r9ueh/plan.json --acknowledge-writer-safety
```

Production command returned a validated JSON result.

21. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts migrate check --repository /tmp/review-0011-fixtures-y26r9ueh/repo --migration 984a047dbe7d33e60c2a4e22
```

Production command returned a validated JSON result.

22. Cwd: `/tmp/review-0011-fixtures-y26r9ueh/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts migrate apply --repository /tmp/review-0011-fixtures-y26r9ueh/repo --plan /tmp/review-0011-fixtures-y26r9ueh/plan.json --acknowledge-writer-safety
```

Production command returned a validated JSON result.

23. Cwd: `/tmp/review-0011-history-4zms5pf3/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts migrate plan --repository /tmp/review-0011-history-4zms5pf3/repo --ticket OLD --output /tmp/review-0011-history-4zms5pf3/plan.json
```

Production command returned a validated JSON result.

24. Cwd: `/tmp/review-0011-history-4zms5pf3/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts migrate check --repository /tmp/review-0011-history-4zms5pf3/repo --migration af2387d7740d059d1cfb5ef9
```

Production command returned a validated JSON result.

25. Cwd: `/tmp/review-0011-history-4zms5pf3/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts migrate apply --repository /tmp/review-0011-history-4zms5pf3/repo --plan /tmp/review-0011-history-4zms5pf3/plan.json --acknowledge-writer-safety
```

Production command returned a validated JSON result.

26. Cwd: `/tmp/review-0011-history-4zms5pf3/repo`. Exit: `0`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/validate-result.ts --input /tmp/review-0011-history-4zms5pf3/result.json
```

Production command returned a validated JSON result.

27. Cwd: `/tmp/review-0011-history-4zms5pf3/repo`. Exit: `1`.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/validate-result.ts --input /tmp/review-0011-history-4zms5pf3/result.json
```

Invalid tracker result: data/tickets/0 must have required property 'title', data/tickets/0 must have required property 'ref'

## Historical validation limits

The original implementation recorded 142 owner/delivery tests, 33 worktree delivery tests and 5 filtered explorer tests passing.
Its broad explorer run retained the two known assertion failures. No baseline rerun or full explorer pass was claimed.
The fix owner suite initially recorded 85 passes and 6 failures.
After fixture/dependency repair, its six targeted cases passed. This review preserves those facts; it does not rewrite them as a full fixer-suite pass.
This review's new 145/33/5 results describe only the commands above.
No repeated typecheck ran. No live tracker migration, merge, push or integration candidate ran.

## Moving-base integration assessment

Base-only changes between the reviewed source and frozen review base affect tracker/workflow metadata.
They do not change product-code contracts. The current publication base advanced to `f290017fec56aef8d25a3b7f0cf578f89c86a5a7`.
That additional commit records this review's phase-start receipt only.
This base movement does not change the frozen source verdict.
The handoff records an incomplete cross-initiative inventory and no hard blocker for this read-only review.
Plugin metadata and workflow.ts overlap with other streams still require fresh compatibility checks against the actual integration candidate.
A clean textual merge alone will not prove compatibility. Regenerate projections from the combined authoritative history if needed.
This source review does not authorize integration or approve product conflict resolution.

## Owned resource observations

Both child results passed transport schema, identity and hash verification and were acknowledged.
The parent sent Ctrl+D to both OMP sessions and observed zsh in the foreground before terminal kill/removal.
Both retained resource reports show `shutdown: confirmed`; all observed owned processes stopped.
The app no longer lists either child terminal. The source workspace remains open.
No owned external services were started. Parent review OMP remains live for parent-owned closure.

## Reviewed paths

- **Path:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/data.test.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/scripts/delivery.test.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/scripts/delivery.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/.claude-plugin/plugin.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/SKILL.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/assets/tree/alignment/docs/agents/issue-tracker.md.jinja`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/contracts.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/initiative-legacy-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/initiative-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/initiative-v2.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/migration-plan-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/migration-plan-v2.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/migration-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/migration-v2.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/record-upgrade.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/result-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/result-v2.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/ticket-legacy-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/ticket-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/ticket-v2.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/result-contract.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/schema.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/answers-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/answers-v2.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/error-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/result-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/state-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/state-v2.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/upgrade-v1-v2.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup/cli.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/stores/local-markdown.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/tasks/initiative.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/tasks/migrate.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/usage.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/dep-tree-markdown.test.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/dep-tree-markdown.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-markdown.mq`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-migration.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-schema.test.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-schema.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-upgrade.test.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-upgrade.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.test.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/setup.test.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/setup.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/validate-result.test.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/validate-result.ts`

