---
title: Artifact-share fix
type: Concept
---

# Artifact-share contracts — FIXED, pending fresh review

## Ticket summary

[skill-contract-manifests-11-artifact-sharing](../../../tracker/tickets/skill-contract-manifests-11-artifact-sharing.md) remains claimed. This authorized fix addresses SPEC-001 only.

## Problem

YAML parsed unquoted numeric-only hashes as numbers. New generation and historical retrieval rejected valid content hashes; leading zeros could not be recovered from the parsed value.

## Implementation

New v2 pages quote hashes as strings. The shared consumer explicitly reads unversioned/v1 numeric scalars from their original frontmatter text, including leading zeros. It does not rewrite historical pages. Explicit v2 still requires string data; unknown versions and malformed hashes remain rejected. Authored metadata and publication/access boundaries are unchanged.

## Source identity

Source commit: 2b9160cdac8a7c413944876c87292d0d023eeaf1. Source tree: fb5625ebed3cdf92b322286d5c50aee485b887a1. Branch: feature/skill-contract-manifests-11-artifact-sharing. Base: master.

## Changed files

- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/src/share-metadata.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/metadata-v1.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/metadata-v2.json
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/share.md
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/contracts.test.ts

The commit hook generated the two required registry version bumps. The producer diff remains one line; unrelated formatter changes were removed before final verification.

## Validation

| Check | Observed result |
| --- | --- |
| Consumer regression before fix | 3 failures at legacy retrieval, reader and new generation |
| Same regression after fix | 3 passes; 29 assertions |
| Final affected suite | 32 passes; 0 failures; 132 assertions |
| Bundle typecheck | Passed |
| Isolated real owning CLI | Numeric hash 860951705127 generated with quotes; historical retrieval passed; url null |
| Repository checker | Leading-zero 000000000123 identity preserved; no rewrite |
| Rejection and preservation | Explicit v2 numeric scalar, unknown version and malformed data rejected; config, source and original clone bytes unchanged |

[Detailed command observations](../artifacts/snapshots/validation-fix-0010.json). Temporary fixtures and generated stages were removed. No remote operation or domain service ran.

## Review history

[Implementation-0002](../events/implementation-0002.yaml) and its [original draft](../artifacts/snapshots/pr-draft-implementation-0002.md) remain historical inputs.

Consumed [review-result-0006](../events/review-result-0006.yaml): FAILURE for 8d83701befd83473f2a3fb38162cbef0c5082e38, tree 6da0a4fe4f9809120bab3bc7c11cddd78e87ac22. [Immutable review artifact](../artifacts/reviews/review-review-result-0006.md). SPEC-001 was its only blocking finding. That verdict is stale after the source change, not SUCCESS.

## Resolved findings

SPEC-001: fixed by [fix-result-0010](../events/fix-result-0010.yaml); pending independent fresh review.

## Remaining findings

No unresolved implementation finding. Latest historical reviewer verdict: FAILURE (stale). Current-source reviewer verdict: none. Next action: fresh review after parent validates the fix and closes this child pane.

## Merge status

Unmerged and not pushed. No tracker edits. Parent owns workflow commits and phase completion. Contract validity grants no publication approval.

## Supporting records

- [Original start](../events/start-0001.yaml)
- [Implementation completion](../events/start-complete-0003.yaml)
- [Review start](../events/review-start-0005.yaml)
- [Review completion](../events/review-complete-0007.yaml)
- [Scoped fix approval](../events/fix-approval-0008.yaml)
- [Parent fix start](../events/fix-start-0009.yaml)
- [Fix result](../events/fix-result-0010.yaml)
- [Owned resources](../artifacts/snapshots/resources-fix-0010.json)

Agent/tool processes remain live for parent-owned pane closure; resource cleanup is pending, not confirmed shutdown.


## Parent fix completion

The parent verified the assigned fix envelope against the authoritative receipt and all output paths. Actual owning CLI retrieval of historical numeric-only hash `860951705127` passed with `unchanged: true`, `dryRun: true`, and `url: null`; source and page bytes were unchanged.

The fixer pane was removed. [Shutdown observation](../artifacts/snapshots/resources-fix-complete-0011.json) confirms all owned processes stopped. No domain service ran. Source remains clean at `2b9160cdac8a7c413944876c87292d0d023eeaf1`.

[Fix completion](../events/fix-complete-0011.yaml) records validation and shutdown. Fresh shared inspection selects independent review of changed source; no merge or push ran.
