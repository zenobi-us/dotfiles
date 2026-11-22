---
title: Artifact-share contracts — current fix
type: Concept
---

# Artifact-share contracts — FIXED, pending fresh review

## Ticket summary

[skill-contract-manifests-11-artifact-sharing](../../../tracker/tickets/skill-contract-manifests-11-artifact-sharing.md) remains claimed. This fix addresses all four current finding IDs.

## Problem

Existing repositories retained metadata consumers that rejected quoted v2 hashes. The real MDX loader also rejected historical numeric-only hashes.

## Implementation

`cli.ts upgrade <name> --dry-run` previews the owned consumer changes. `--confirm <name>` applies known changes locally and runs all four required publication checks. It never fetches, commits or pushes. The installed historical evidence pins the frozen base and earlier supported consumers. Unknown customized code and symlinks refuse without writes. Failed checks restore the original consumer files.

Only the type-check consumer, metadata helper, and schema/docs block plus import in `press.config.tsx` change. Registries, authored content, assets, site settings, hooks, workflows, scanner settings and other checks stay intact. New generation requires current consumers. Historical retrieval and read-only commands never upgrade code.

The MDX schema reads the loader context source before string validation. It shares the historical hash interpretation with the CLI/checker. Leading zeros remain exact; numeric v2 and unknown explicit versions still fail. Stored page bytes and external package/hosting formats do not change.

## Source identity

Branch: `feature/skill-contract-manifests-11-artifact-sharing`. Base: `master`. Source commit: `3378f0d89811c8ce67feadcc0326f8c86764a0ae`. Source tree: `6138a98322ac55a4bb0cc4b5a0a10c2f3578c27b`.

Commits: `9d8754211e8178c43beccc97e02e4f4b66adb5e3`, `3378f0d89811c8ce67feadcc0326f8c86764a0ae`. Required hook registry bumps retained: agent-core 0.1.40 and 0.1.41. Unrelated formatter churn removed.

## Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/consumer-history.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/README.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/press.config.tsx`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/src/share-metadata.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/metadata-v1.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/metadata-v2.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/share.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/template.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/consumers.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/consumers.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/site.test.ts`

## Validation

| Check | Observed result |
| --- | --- |
| Final affected suite | 36 pass, 0 fail, 232 assertions |
| Bundle typecheck | Passed |
| Contract declarations | Manifest, five definitions and config procedure resolved |
| Frozen base `69794e4eb60f7dbe26af658805c4876310d7e8ae` | Owning preview/apply/no-op passed; customized registry/content/site settings/config/checks preserved |
| Required publication checks | Actual CLI generated v2 passed all four checks after upgrade; subsequent retrieval returned unchanged |
| Unsafe consumers and required-check failure | Byte-stable refusal and complete consumer rollback passed |
| Actual Fumapress builds | Unversioned 860951705127, v1 000000000123 and quoted v2 passed with exact rendered hashes |
| Rejected site inputs | Numeric v2 and unknown explicit version failed; stored bytes unchanged |

[Detailed validation](../artifacts/snapshots/validation-fix-0018.json). The original failing cases were established by review-result-0014, not repeated merely to confirm them. The regression suite exercises actual owning commands, scanners and builds, without replacement mocks. Temporary inspection copies, fixtures and stages were removed.

## Review history

- [implementation-0002](../events/implementation-0002.yaml) introduced contracts; [original draft](../artifacts/snapshots/pr-draft-implementation-0002.md) retains the first implementation.
- [review-result-0006](../events/review-result-0006.yaml): FAILURE with SPEC-001. [Review artifact](../artifacts/reviews/review-review-result-0006.md).
- [fix-result-0010](../events/fix-result-0010.yaml) fixed SPEC-001; [draft](../artifacts/snapshots/pr-draft-fix-0010.md) and [parent completion](../events/fix-complete-0011.yaml) retain its validation and shutdown.
- [review-result-0014](../events/review-result-0014.yaml): FAILURE at `2b9160cdac8a7c413944876c87292d0d023eeaf1`. STANDARDS-001/SPEC-002 report existing consumer incompatibility; STANDARDS-002/SPEC-003 report historical site ingestion. [Immutable review](../artifacts/reviews/review-review-result-0014.md) and [parent completion](../events/review-complete-0015.yaml) remain unchanged.
- [fix-approval-0016](../events/fix-approval-0016.yaml) and [fix-start-0017](../events/fix-start-0017.yaml) authorize this fresh fix. [fix-result-0018](../events/fix-result-0018.yaml) records the new source.

## Resolved findings

SPEC-001 remains resolved from fix-result-0010. This fix resolves STANDARDS-001, SPEC-002, STANDARDS-002 and SPEC-003. Every finding remains in its original immutable review.

## Remaining findings

No unresolved implementation finding. Latest historical reviewer verdict: FAILURE, now stale. Current-source reviewer verdict: none. State: FIXED, pending a fresh independent review. This is not SUCCESS or merge approval.

## Merge status

Unmerged and not pushed. No remote operation, tracker mutation or metadata commit ran. Parent owns workflow commits, phase completion and pane closure.

## Resources

[Owned-resource observation](../artifacts/snapshots/resources-fix-0018.json). No domain service was launched. Agent/tool processes remain live for parent-owned child-pane closure. Shutdown is pending, not confirmed.


## Parent compatibility fix completion

The parent verified typed delivery against [fix-result-0018](../events/fix-result-0018.yaml) and all seven output paths. An independent actual CLI smoke on the frozen-base template passed preview, confirmed upgrade with all required checks, repeat no-op, persisted consumer updates and unchanged authored configuration. Temporary fixture removed.

[Parent completion](../events/fix-complete-0019.yaml) records the outcome. The fixer pane was removed; [owned-resource observation](../artifacts/snapshots/resources-fix-complete-0019.json) confirms shutdown. No domain service or remote mutation ran.

Fresh shared inspection confirms clean source `3378f0d89811c8ce67feadcc0326f8c86764a0ae`, valid receipt history and no diagnostics. It selects fresh independent review because source changed; the previous FAILURE remains historical, not a current-source verdict.
