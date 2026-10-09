---
name: publishing-with-release-please-and-moonrepo-on-github-actions
description: Coordinates Release Please policy, Moon project selection, source-derived publish metadata, and SHA-pinned GitHub Actions publication. Use when standardizing monorepo release.yml/publish.yml workflows across main and release/* branches without passing computed versions or GitHub release tags between workflows.
---

# Publishing with Release Please and Moonrepo on GitHub Actions

## Source of Truth

Read `references/release-publish-channel-and-metadata-plan.md` before implementing this pattern. It contains the full contract, test matrix, and implementation order.

Terminology is strict:

- `channel` means only the distribution channel: `next` or `latest`.
- `release_tag` means only the actual GitHub Release tag receiving assets.
- `source_sha` means the immutable commit that publication verifies and checks out.
- Moon project `source` is the Release Please package/manifest key and version-source location.
- Moon project `id` is the Release Please `component` and human-facing release-tag prefix.

Do not reuse older guidance that dispatches computed versions or release tags. Publish metadata must be computed once from the verified checked-out source.

## Architecture

```text
push: main | release/*
          |
          v
 release.yml branch ownership gates
          |
          +-- release branch root ----------------> stop
          +-- hotfix merge-back on main ----------> stop
          +-- main-owned commit ------------------> normal RP config
          +-- release-owned commit ---------------> hotfix RP config
                                                      |
                                                      v
                                               Release Please
                                                      |
                           +--------------------------+------------------+
                           |                                             |
                releases_created=true                       releases_created=false
                channel=latest                              channel=next
                           |                                             |
                           +--------------------------+------------------+
                                                      |
                               get-publish-matrix selects target IDs
                                                      |
                         dispatch target/channel/source_sha/source_branch
                                                      |
                                                      v
                                               publish.yml
                                                      |
                          validate source, checkout immutable source_sha
                                                      |
                            resolve metadata from checked-out Moon project
                                                      |
                           create/find release, run Moon publish task
```

`prs_created` is reporting data only. It MUST NOT suppress `channel=next` publishing.

## Ownership Boundaries

### `release.yml`

MUST own:

- branch ownership and duplicate-processing gates;
- normal versus hotfix Release Please config selection;
- explicit Release Please target branch on `release/*`;
- channel selection from `releases_created`;
- affected publish-target selection through `get-publish-matrix`;
- immutable source identity in repository dispatch;
- one dispatch per selected Moon project.

MUST NOT:

- compute artifact versions;
- compute GitHub release tags;
- publish artifacts;
- dispatch a version or release tag.

### `publish.yml`

MUST own:

- `workflow_dispatch` and trusted `repository_dispatch` entry points;
- input/payload normalization;
- dispatch actor validation;
- source branch and SHA validation;
- exact immutable checkout;
- publish metadata computation from checked-out source;
- prerelease creation and stable release validation;
- publish environment export;
- `moon run "${PUBLISH_TARGET}:publish" --force`.

MUST NOT:

- query affected projects;
- independently choose normal versus hotfix policy outside verified branch rules;
- accept a caller-computed version or GitHub release tag.

### Moon publish tasks

MUST consume exact environment values and perform package-specific publication only:

```text
PUBLISH_TARGET       Moon project ID
PUBLISH_CHANNEL      next | latest
PUBLISH_VERSION      Computed artifact semantic version
PUBLISH_RELEASE_TAG  Computed GitHub Release tag
PUBLISH_REF          Verified immutable source SHA
```

Tasks MUST NOT derive versions or release tags.

## Dispatch Contracts

Repository dispatch:

```json
{
  "event_type": "publish-package",
  "client_payload": {
    "target": "zellij-plugin",
    "channel": "next",
    "source_sha": "abc123",
    "source_branch": "release/0.1"
  }
}
```

No `version`, `release_tag`, overloaded `tag`, or duplicate `mode` field is allowed.

Manual publishing belongs on `publish.yml`:

```yaml
workflow_dispatch:
  inputs:
    target:
      type: string
      required: true
    channel:
      type: choice
      required: true
      default: next
      options: [next, latest]
```

Manual source identity comes from `github.sha` and `github.ref_name`, then passes the same branch and reachability checks as repository dispatch.

## Channel Migration

Apply this rename across workflows, matrices, summaries, tests, and project tasks:

```text
inputs.tag                 -> inputs.channel
client_payload.tag         -> client_payload.channel
PUBLISH_TAG                -> PUBLISH_CHANNEL
```

Do not rename native external CLI flags:

```bash
npm publish --tag "${PUBLISH_CHANNEL}"
```

## Release Please Synchronization

`.github/actions/sync-moon-to-release-please/action.sh` MUST discover publishable Moon projects without requiring `package.json`.

Discovery:

1. Run `moon query projects`.
2. Retain projects with a `publish` task.
3. Use `project.source` as the Release Please package and manifest key.
4. Set `component` to the exact Moon project ID.
5. If `<source>/package.json` exists, read `.version` and use `release-type: node`.
6. Else if `<source>/Cargo.toml` exists, read package version through Cargo metadata and use `release-type: rust`.
7. Otherwise fail with an unsupported version-source error.

Synchronization MUST preserve existing manifest versions, seed new entries from source versions, and write the same source-path keys and Moon-ID component values to normal and hotfix configs. Do not guess Moon IDs from package names or add a static mapping file.

Release Please package keys MUST remain repository paths. Setting `component` changes human-facing component names and tag prefixes without breaking package discovery:

```json
"pkgs/plugins/zellij-plugin": {
  "component": "zellij-plugin",
  "release-type": "rust"
}
```

Keep version-source discovery expandable with a documented `case` statement or equivalent plugin boundary.

## Publish Target Selection

Keep `.github/tasks/get-publish-matrix` as the only affected-project selector.

It MUST:

1. Run `MOON_BASE=... MOON_HEAD=... moon query projects --affected`.
2. Retain projects containing a `publish` task.
3. Return sorted Moon project IDs only:

```json
[
  { "target": "docs" },
  { "target": "zellij-plugin" }
]
```

It MUST NOT emit `mode`, `tag`, `channel`, `version`, `release_tag`, or `source_sha`. `release.yml` adds channel and source identity when dispatching.

## Publish Metadata Resolver

Use one deployment helper, preferably:

```text
pkgs/tools/deployment/resolve-publish-metadata
```

Remove `generate-publish-git-tag` after migrating callers. Two helpers would duplicate version logic.

Interface:

```text
resolve-publish-metadata <target> <channel> <source-branch> <run-attempt>
```

Return machine-readable metadata, preferably JSON:

```json
{
  "target": "zellij-plugin",
  "source": "pkgs/plugins/zellij-plugin",
  "component": "zellij-plugin",
  "current_version": "0.1.0",
  "stable_tag": "zellij-plugin-v0.1.0",
  "commit_distance": 7,
  "version": "0.1.1-next.7.1",
  "release_tag": "zellij-plugin-v0.1.1-next.7.1"
}
```

The resolver MUST:

- resolve the exact Moon target;
- reject unknown or non-publishable targets;
- read Moon `source` as package key and version-source location;
- use the exact Moon project ID as component identity;
- read version from `package.json`, otherwise Cargo metadata for `Cargo.toml`;
- reject absent or malformed semantic versions;
- reject source branches other than `main` or `release/*`;
- generate `<moon-project-id>-v<version>`.

Version rules:

```text
latest:     current source version
next/main:  next minor -> <next>-next.<commit-distance>.<run-attempt>
next/release/*: next patch -> <next>-next.<commit-distance>.<run-attempt>
```

Commit distance is component-specific:

1. Find the latest reachable `<moon-project-id>-v<version>` stable tag for the component; exclude prerelease tags.
2. Count first-parent commits from that tag to `HEAD`.
3. If none exists, count first-parent history from repository root.
4. Append `github.run_attempt` as the final prerelease identifier.

Do not use `github.run_number` as the primary prerelease identity. Source-derived commit distance keeps manual and repository dispatch metadata consistent for the same commit.

When migrating from old source-path tags, use the latest reachable `<project-source>-v<version>` stable tag only as a temporary baseline fallback if no Moon-ID component tag exists. New tags MUST use the Moon project ID. Remove fallback after each component has a component-named stable release.

## Publish Workflow Security and Execution

Normalize trigger values before checkout. Then:

1. Require non-empty target, source SHA, and source branch.
2. Require channel exactly `next` or `latest`.
3. For repository dispatch, require an explicit trusted coordinator actor/App allowlist.
4. Fetch full history plus `main` and `release/*` refs.
5. Require source branch to be `main` or `release/*`.
6. Verify source SHA is reachable from the claimed source branch.
7. Check out the exact source SHA before executing repository code with publish credentials.
8. Set up Moon/Bun/Rust and install dependencies.
9. Run the metadata resolver with `github.run_attempt`.
10. Export `PUBLISH_TARGET`, `PUBLISH_CHANNEL`, `PUBLISH_VERSION`, `PUBLISH_RELEASE_TAG`, and `PUBLISH_REF`.
11. For `next`, create/find a prerelease targeted at `PUBLISH_REF`.
12. For `latest`, require the Release Please-created stable release to exist.
13. Run the Moon publish task.
14. Summarize target, channel, version, release tag, branch, SHA, trigger, and result.

Prerelease creation MUST tolerate concurrent creation: after a failed `gh release create`, retry `gh release view` and fail only if the release still does not exist.

Use `cancel-in-progress: false`. Prefer release-tag-scoped locking when workflow expression limits permit; otherwise retain target/channel locking. Do not cancel retries of the same publication.

## Branch Ownership

Keep these helper concepts:

```text
get-commits RELEASE_BRANCH MAIN_BRANCH
is-root-commit COMMIT RELEASE_BRANCH MAIN_BRANCH
is-hotfix-commit COMMIT RELEASE_BRANCH MAIN_BRANCH
is-hotfix-merge COMMIT MAIN_BRANCH
```

Rules:

1. Release branch root belongs to the prior stable `main` release and publishes nothing on `release/*`.
2. Later release-branch commits use hotfix policy.
3. Hotfix history merged back to `main` publishes nothing again.
4. New main work uses normal policy.
5. Release Please on `release/*` receives the current branch explicitly as target branch.
6. Associated PR head branch is the primary merge/squash signal; fetched ancestry is fallback.

Never rely only on commit equality. Squash merges create new hashes.

## GitHub Automation Project

Add `.github` as a Moon project so workflow scripts and Bats tests join the normal task graph:

```yaml
# .moon/workspace.yml
projects:
  sources:
    github: ".github"
```

```yaml
# .github/moon.yml
id: github
language: bash
layer: tool

tasks:
  test:
    command: "bats tasks/*.bats"
    inputs:
      - "actions/**/*"
      - "tasks/**/*"
      - "workflows/**/*"
```

Include `actionlint` in this task or a separate `github:lint` task.

## Minimum Validation

Tests MUST cover:

- Node and Cargo Release Please component discovery;
- manifest version preservation and unsupported source failure;
- target-only, sorted affected publish matrix;
- source-derived latest/main-next/release-next metadata;
- component stable-tag lookup, prerelease exclusion, root fallback, and retry attempt;
- unknown target, non-publishable target, unsupported branch, and malformed version failures;
- channel normalization and rejection of old `tag` fields;
- trusted dispatch actor and source reachability;
- exact SHA checkout;
- stable release existence and idempotent prerelease creation;
- `PUBLISH_RELEASE_TAG` use for GitHub assets;
- release-root and hotfix merge-back skips.

Run:

```bash
moon run github:test
moon run deployment:test
actionlint .github/workflows/release.yml .github/workflows/publish.yml
bash -n .github/tasks/*
bash -n pkgs/tools/deployment/*
moon run zellij-plugin:test
moon run zellij-plugin:check
moon run pi-extension:typecheck
git diff --check
```

## Common Mistakes

| Mistake | Correction |
|---|---|
| Dispatch version/release tag from `release.yml` | Dispatch target, channel, source SHA, and source branch only |
| Treat `publish.yml` as a dumb executor | It validates source and computes metadata after immutable checkout |
| Use `PUBLISH_TAG` for both channel and release tag | Use `PUBLISH_CHANNEL` and `PUBLISH_RELEASE_TAG` |
| Put manual changed/all/project selection on `release.yml` | Keep manual target/channel publishing on `publish.yml` |
| Return rich metadata from `get-publish-matrix` | Return sorted `{target}` entries only |
| Use `run_number` prerelease versions | Use component first-parent distance plus `run_attempt` |
| Require `package.json` for Release Please sync | Support Node and Cargo version sources |
| Use package path as human-facing component | Keep path as package key; set `component` to Moon project ID |
| Guess project-to-component mappings | Use Moon project ID directly |
| Create stable releases in `publish.yml` | Require Release Please-created stable release |
| Keep `generate-publish-git-tag` beside resolver | Migrate callers and remove old helper |
| Cancel concurrent/retry publication | Use `cancel-in-progress: false` and narrow locking |

## Implementation Order

1. Add tests for channel terminology and target-only matrix output.
2. Update Release Please synchronization for publishable Node and Cargo projects.
3. Synchronize configs/manifest and verify path keys plus Moon-ID component names.
4. Reduce `get-publish-matrix` to target selection.
5. Add `resolve-publish-metadata`; migrate and remove the old helper.
6. Rename internal tag terminology to channel.
7. Update release dispatch to send source identity without metadata.
8. Harden publish validation, immutable checkout, metadata resolution, and release management.
9. Update npm, docs, and GitHub asset consumers.
10. Add/retain branch ownership gates and explicit hotfix target branch.
11. Add the `.github` Moon project and run full validation.
12. Smoke-test manual next, normal stable, hotfix, and merge-back paths.

## Portability Boundary

Copy across repositories:

- ownership boundaries;
- target/channel/source dispatch contract;
- metadata resolver behavior;
- branch ownership rules;
- source-path package keys plus stable project-ID component identity;
- validation and test cases.

Keep repository-specific:

- trusted dispatch actor/App allowlist;
- Release Please config filenames;
- publish credentials and environments;
- package-specific Moon publish commands;
- stable bump policy if a repository intentionally differs.
