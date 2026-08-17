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

## Manifest Identity Model

Keep these fields separate:

- `packages` object key: repository-relative package path used for file discovery, manifest versions, and action output prefixes.
- `component`: stable human-facing release identity and default tag prefix.
- `package-name`: release-strategy package identity; many strategies discover it from `package.json`, `Cargo.toml`, or equivalent.
- `include-component-in-tag`: whether tags include the component prefix; keep enabled for independently-versioned monorepo packages.

Example:

```json
"packages/my-module": {
  "component": "my-module",
  "release-type": "node"
}
```

The package key stays `packages/my-module`; the default tag becomes `my-module-v1.2.3`.

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
- Choose stable component names before first managed release.
- If changing an existing component name, plan tag-history migration; Release Please searches tags using the configured component.
- Merge first Release PR and validate output shape usage in downstream workflow steps.

## Common Failure Patterns (Summary)

- **No release PR**: no releasable commits, wrong branch trigger, stale autorelease labels, or token/permission mismatch
- **Wrong bump**: commit semantics mismatch with Conventional Commit expectations
- **Missing changelog entries**: non-conventional squash titles/commit history
- **Manifest mismatch**: package path keys don’t match actual directories
- **Release history not found**: `component` changed but existing tags still use the old prefix
- **Workflow chain not firing**: using `GITHUB_TOKEN` when downstream workflows require PAT/App token behavior

## Guardrails

- Enforce Conventional Commit linting in CI.
- Keep release ownership explicit (who merges release PRs).
- In monorepos, add package paths incrementally and assign stable, unique components.
- Treat component renames as release migrations, not cosmetic config edits.
- Avoid manual tags/changelog edits in release-managed paths.
- Keep release PRs small and predictable.

## Quick Verification Checklist

- [ ] Workflow triggers on push to tracked branch
- [ ] Permissions are explicitly set
- [ ] Release PR appears after releasable commit
- [ ] Merge creates expected component-prefixed tag and GitHub release
- [ ] Manifest keys remain real repository paths
- [ ] Downstream steps use path-prefixed action outputs, not component-prefixed output keys

## References

### Core upstream

- Release Please: https://github.com/googleapis/release-please
- Release Please Action: https://github.com/googleapis/release-please-action

### Local references (read these for detail)

- `references/setup-examples.md`
- `references/action-outputs.md`
- `references/return-shapes.md`
- `references/troubleshooting.md`
