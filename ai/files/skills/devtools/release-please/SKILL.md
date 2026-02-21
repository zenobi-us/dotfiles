---
name: release-please
description: Use when adopting or operating Release Please for automated versioning, changelog generation, and GitHub releases in single-package or monorepo repositories
---

# Release Please

Practical guide for setting up and operating Release Please using `googleapis/release-please` and `googleapis/release-please-action`.

## When to Use

Use this skill when you need:

- Automated version bumps + changelog from Conventional Commits
- GitHub release PR automation on `main`/`master`
- Monorepo or multi-package release orchestration (manifest mode)
- Migration from manual version/changelog/tag release workflows

Use **single-package mode** when one version stream exists.
Use **manifest mode** when multiple packages/paths version independently.

---

## Prerequisites

## 1) Commit and branching hygiene

- Conventional Commits are required for accurate semver bumping and changelog sections.
- Protected default branch recommended (`main`)
- CI must run on release PRs and direct pushes to default branch

## 2) Repository permissions and token strategy

Choose one and stay consistent:

- `GITHUB_TOKEN` (simpler, default)
- PAT / GitHub App token (when cross-repo, stricter org policy, or release-trigger chaining is needed)

Minimum permissions for workflow job:

- `contents: write`
- `pull-requests: write`
- `issues: write` (optional but useful for labeling/commenting behavior)

## 3) Required files (depending on mode)

Single-package (minimal):

- `.github/workflows/release-please.yml`

Manifest mode (monorepo / multiple packages):

- `.github/workflows/release-please.yml`
- `release-please-config.json`
- `.release-please-manifest.json`

---

## Implementation Playbooks

## Playbook A — Action-based setup (single package)

Create `.github/workflows/release-please.yml`:

```yaml
name: release-please

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

What happens:

- On push to `main`, action evaluates commit history
- Creates/updates a Release PR when a releasable change exists
- After Release PR merge, creates tag + GitHub release

## Playbook B — Config-driven setup (manifest mode)

### `release-please-config.json`

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "node",
  "packages": {
    ".": {
      "release-type": "node"
    },
    "packages/pkg-a": {
      "release-type": "node"
    },
    "packages/pkg-b": {
      "release-type": "node"
    }
  }
}
```

### `.release-please-manifest.json`

```json
{
  ".": "0.1.0",
  "packages/pkg-a": "0.1.0",
  "packages/pkg-b": "0.1.0"
}
```

### Workflow (manifest)

```yaml
name: release-please

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          manifest-file: .release-please-manifest.json
          config-file: release-please-config.json
```

Notes:

- Package keys must match real repo paths exactly
- Manifest versions are the source of truth for next bumps

## Playbook C — Migration from manual releases

1. Normalize commit style to Conventional Commits from now onward.
2. Add workflow (single or manifest mode).
3. Seed versions in `.release-please-manifest.json` to current released versions (manifest mode).
4. Merge first Release PR.
5. Stop manual tag/changelog edits on default branch.

---

## Operational Workflows

## Bootstrap first automated release

Checklist:

- [ ] Workflow merged to default branch
- [ ] At least one releasable commit (`feat:`, `fix:`) exists after baseline
- [ ] Token permissions validated
- [ ] For manifest mode, config + manifest committed and valid paths

Expected result: first Release PR appears (`release-please--branches--main` style).

## Ongoing release PR lifecycle

1. Developers merge Conventional Commit PRs.
2. Release Please updates existing release PR (or opens a new one).
3. CI validates release PR.
4. Merge release PR when ready.
5. Action creates tag + GitHub Release.

## Tag/release behavior

- Tag/release happens after merge of release PR to tracked branch.
- Changelog + version files are authored in the release PR.
- Don’t hand-edit generated release PR content unless required by policy.

## Dry-run/testing strategy

- Validate config/manifest paths via PR checks before enabling strict branch rules.
- In test repos/branches, run with same workflow first.
- For production repos, start with one package path, then expand manifest coverage.

---

## Troubleshooting

## No release PR created

Check:

- No releasable commit types since last release (docs/chore only)
- Workflow not firing on tracked branch
- Token lacks `contents: write` / `pull-requests: write`
- Existing stale release PR already open

## Wrong version bump

Usually commit semantics mismatch:

- `fix:` => patch
- `feat:` => minor
- breaking change footer / `!` => major

Audit merged commit messages first; Release Please is usually doing exactly what commits say.

## Changelog missing/incorrect entries

- Confirm commits are Conventional Commit compliant
- Check release type + package path mapping in config
- Ensure squash merge titles are also Conventional Commit compatible

## Manifest sync issues (monorepo)

Symptoms: wrong package bumped or no bump.

- Path key mismatch between `packages` config and actual directory
- `.release-please-manifest.json` has stale/missing package key
- Package moved/renamed without updating both files

## Token/permissions failures

- `Resource not accessible by integration` => wrong token scope/permissions
- Org policy may block default `GITHUB_TOKEN`; use PAT/App token
- Ensure workflow-level `permissions` block is explicitly set

---

## Best Practices and Guardrails

- Enforce Conventional Commit linting in CI
- Keep release cadence predictable (e.g., weekly or on-demand but explicit)
- Protect default branch and require CI on release PRs
- Avoid manual tags/changelog edits on release-managed branches
- Keep release PR small; don’t batch unrelated long-lived work
- In monorepos, add packages incrementally and verify each path mapping
- Document release ownership (who merges release PRs)

---

## Quick Verification Checklist

- [ ] Workflow triggers on push to default branch
- [ ] Correct permissions in workflow
- [ ] Single-package: release PR appears after releasable commit
- [ ] Manifest mode: each package path maps correctly
- [ ] Merge release PR creates both tag and GitHub Release

---

## References

Primary upstream sources:

- Core project: `googleapis/release-please`
  - https://github.com/googleapis/release-please
- GitHub Action (current): `googleapis/release-please-action`
  - https://github.com/googleapis/release-please-action

Historical/migration context:

- Archived old action: `google-github-actions/release-please-action`
  - https://github.com/google-github-actions/release-please-action
