---
name: release-please
description: Use when adopting or operating Release Please for automated versioning, changelog generation, and GitHub releases in single-package or manifest-mode repositories
---

# Release Please

Lean operating guide for `googleapis/release-please` + `googleapis/release-please-action`.

Use this file for **mode selection**, **quick setup**, and **guardrails**.
Use references for **full examples**, **output contracts**, and **troubleshooting detail**.

## When to Use

Use this skill when you need:

- Conventional Commit-driven version bumps and changelog generation
- Automated Release PR creation and GitHub release tagging
- Single-package or monorepo/manifest release orchestration
- Migration off manual tags/changelog/version workflows

## Choose a Mode

- **Single-package mode**: one version stream from repo root.
- **Manifest mode**: independent versions per path/package.

If you have more than one independently-versioned package, use manifest mode.

## Prerequisites (Quick)

- Conventional Commits in default branch history (`fix:`, `feat:`, `!`/BREAKING)
- Branch/workflow permissions sufficient for PR + release writes
- Workflow trigger on your default release branch (`main`/`master`)

Recommended minimum workflow permissions:

- `contents: write`
- `pull-requests: write`
- `issues: write` (optional but commonly useful)

## Quick Start

### A) Single-package (minimal)

Create `.github/workflows/release-please.yml` with `googleapis/release-please-action@v4` on push to default branch.

### B) Manifest mode

Add:

- `release-please-config.json`
- `.release-please-manifest.json`
- workflow passing `config-file` + `manifest-file`

## Lifecycle

1. Merge Conventional Commit PRs.
2. Release Please opens/updates the Release PR.
3. CI validates release PR.
4. Merge release PR.
5. Action creates tag + GitHub Release.

## Migration from Manual Releases

- Stop manual changelog/tag edits on release-managed branch.
- Seed manifest versions to currently released versions (manifest mode).
- Merge first Release PR and validate output shape usage in downstream workflow steps.

## Common Failure Patterns (Summary)

- **No release PR**: no releasable commits, wrong branch trigger, stale autorelease labels, or token/permission mismatch
- **Wrong bump**: commit semantics mismatch with Conventional Commit expectations
- **Missing changelog entries**: non-conventional squash titles/commit history
- **Manifest mismatch**: package path keys don’t match actual directories
- **Workflow chain not firing**: using `GITHUB_TOKEN` when downstream workflows require PAT/App token behavior

## Guardrails

- Enforce Conventional Commit linting in CI.
- Keep release ownership explicit (who merges release PRs).
- In monorepos, add package paths incrementally and verify each.
- Avoid manual tags/changelog edits in release-managed paths.
- Keep release PRs small and predictable.

## Quick Verification Checklist

- [ ] Workflow triggers on push to tracked branch
- [ ] Permissions are explicitly set
- [ ] Release PR appears after releasable commit
- [ ] Merge creates tag and GitHub release
- [ ] Downstream steps using action outputs parse expected keys safely

## References

### Core upstream

- Release Please: https://github.com/googleapis/release-please
- Release Please Action: https://github.com/googleapis/release-please-action

### Local references (read these for detail)

- `references/setup-examples.md`
- `references/action-outputs.md`
- `references/return-shapes.md`
- `references/troubleshooting.md`
