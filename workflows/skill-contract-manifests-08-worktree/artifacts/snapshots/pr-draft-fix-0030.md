---
receipt_id: fix-0030
schemaVersion: worktree-pr-draft/v1
source_commit: 2c8ef45d4987cead7ba120d64e3e5c896575ebc2
source_tree: 3f61dab6d0018150e4a214b20f9e63e698d1c4c2
type: Snapshot
workflow_id: skill-contract-manifests-08-worktree
---

# SPEC-1 source transition repair

## Resolution

SPEC-1 is resolved in source. Publication and normal recovery/explorer diagnostics share Git ancestry validation. Structural approval also requires the original base. Missing or invalid commits cannot validate transition history. Coordination reports source_transition_unverifiable without executing Git. Retained v1/v2/v3 receipt bytes remain unchanged.

## Exact source

Branch: resolve/skill-contract-manifests-08-worktree-finish. Base: master.

Commit: 2c8ef45d4987cead7ba120d64e3e5c896575ebc2. Tree: 3f61dab6d0018150e4a214b20f9e63e698d1c4c2.

Workspace: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/resolve-skill-contract-manifests-08-worktree-finish.

## Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/CHANGELOG.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/receipts.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/phase-context.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/receipt-diagnostics.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/source-transition.ts`

The commit operation automatically bumped developer plugin and marketplace versions from 0.2.73 to 0.2.74. Shared-context implementation and metadata remain untouched.

## Exercised checks

- Actual candidate inspect.ts ran against temporary isolated Git fixtures: descendant ancestry accepted with historyValid true and no diagnostics. Non-descendant and changed-base cases returned historyValid false with invalid_source_transition. Missing objects and invalid commits returned historyValid false with source_object_unavailable.
- Inspector fixture event bytes remained unchanged. Temporary fixtures were removed.
- Direct diagnostics smoke without Git access returned source_transition_unverifiable.
- LSP references were attempted; initialization failed because no TypeScript installation was available. All transition callers were identified by text search.

## Unrun checks

No build, lint, formatter or test suite ran, per the delegation contract. Added actual inspector regressions for non-descendant, changed-base, missing-object and invalid-commit cases, a coordination regression, and inspector acceptance assertions on the existing separate-candidate case. Parent must run the focused regression and final full suite.

## Review-required state

Fresh independent review is required for this new commit. No integration, rebase, source-worktree removal, original-source mutation, tracker completion or historical receipt rewrite occurred. Mutable projections remain for the parent to regenerate through candidate write-view.ts, preserving historical review links.

## Remaining questions

No implementation questions. Full-suite verification and fresh independent review remain parent-owned gates.

