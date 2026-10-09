# Release and publish workflow plan

Status: proposed; no implementation applied.

## Goal

Separate release coordination from artifact publication without sending computed versions or GitHub release tags across workflows.

- `release.yml` owns commit/branch eligibility, Release Please, Moon project selection, and repository dispatch.
- `publish.yml` owns source checkout, publish metadata computation, GitHub release resolution/creation, and execution of the Moon publish task.
- `channel` means only distribution channel: `latest` or `next`.
- `release_tag` means only the actual GitHub Release tag receiving assets.
- Release Please package keys remain Moon project source paths because Release Please uses them to locate package files.
- Release Please `component` names use Moon project IDs, producing readable, path-independent release tags.
- Publish metadata is computed once from the immutable checked-out source by a deployment helper.

## Target state machine

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
                                      get-publish-matrix selects targets
                                                      |
                              dispatch target/channel/source identity
                                                      |
                                                      v
                                               publish.yml
                                                      |
                             verify source ref, checkout immutable SHA
                                                      |
                           resolve version and release tag from source
                                                      |
                         create/find GitHub release and run Moon publish
```

`prs_created` remains reporting data. It MUST NOT suppress `channel=next` publishing.

## Ownership boundaries

### `.github/workflows/release.yml`

MUST own:

- branch ownership and duplicate-processing gates;
- normal versus hotfix Release Please config selection;
- explicit Release Please target branch on `release/*`;
- stable/prerelease channel selection from `releases_created`;
- affected Moon project selection through `get-publish-matrix`;
- immutable source identity added to dispatch;
- one repository dispatch per selected Moon project.

MUST NOT:

- compute artifact versions;
- compute GitHub release tags;
- publish artifacts;
- pass caller-computed version or release tag to `publish.yml`.

### `.github/workflows/publish.yml`

MUST own:

- both `workflow_dispatch` and trusted `repository_dispatch` entry points;
- payload/input normalization;
- dispatch actor validation;
- source branch and SHA validation;
- immutable source checkout;
- publish metadata computation from checked-out source;
- prerelease GitHub Release creation;
- stable GitHub Release existence validation;
- publish environment export;
- `moon run "${PUBLISH_TARGET}:publish" --force`.

MUST NOT:

- query affected projects;
- choose normal versus hotfix release policy independently of the verified source branch;
- accept a version or GitHub release tag supplied by repository dispatch.

### Moon project publish tasks

MUST consume exact environment values and perform package-specific publication only:

```text
PUBLISH_TARGET       Moon project ID
PUBLISH_CHANNEL      Distribution channel: next | latest
PUBLISH_VERSION      Computed artifact semantic version
PUBLISH_RELEASE_TAG  Computed GitHub Release tag
PUBLISH_REF          Verified immutable source SHA
```

## Dispatch and manual input contracts

Preserve existing `target` naming to avoid an unrelated migration. Rename only the overloaded tag concept.

### Repository dispatch

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

`release.yml` supplies:

- `target` from `get-publish-matrix`;
- `channel=latest` when `releases_created=true`, otherwise `channel=next`;
- `source_sha=github.sha`;
- `source_branch=github.ref_name`.

No `version` or `release_tag` field is dispatched.

### Manual workflow dispatch

Keep manual publishing on `publish.yml`:

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

For manual runs:

- source SHA comes from `github.sha`;
- source branch comes from `github.ref_name`;
- the selected ref MUST still pass trusted branch/reachability validation.

## Channel rename

Apply the rename across workflow contracts, matrix handling, environment variables, summaries, tests, and project tasks:

```text
inputs.tag                 -> inputs.channel
client_payload.tag         -> client_payload.channel
matrix.tag                 -> release job channel value
PUBLISH_TAG                -> PUBLISH_CHANNEL
```

Do not rename native external CLI flags. npm still receives:

```bash
npm publish --tag "${PUBLISH_CHANNEL}"
```

Remove ambiguous `mode`/`tag` duplication from the publish matrix and dispatch payload.

## Release Please synchronization

Update `.github/actions/sync-moon-to-release-please/action.sh` so `package.json` is not an inclusion requirement.

### Discovery rule

```text
moon query projects
  -> use project.source as Release Please package/manifest key
  -> use project.id as Release Please component
```

Release Please still tracks package files and manifest versions by source path. Human-facing component names and release tags use stable Moon project IDs instead of repository paths.

### Version source and Release Please type

Provide a expandable architecture to `./github/actions/sync-moon-to-release-please/action.sh` for future version source discovery. Provide a documented case statement or plugin architecture for future version source discovery.

For each publishable project:

1. If `<source>/package.json` exists:
   - read `.version`;
   - use `release-type: node`.
2. Else if `<source>/Cargo.toml` exists:
   - read package version through Cargo metadata;
   - use `release-type: rust`.
3. Else:
   - fail synchronization; a publishable project without a supported version source is invalid. And human must provide a resolution discovery mechanism for the unknown package type.

Synchronization MUST:

- preserve an existing `.release-please-manifest.json` version;
- seed a new manifest entry from the project version source;
- write the same project-source key set into normal and hotfix Release Please configs;
- write `component: <moon-project-id>` for every package config entry;
- keep Moon source paths only as Release Please package and manifest keys;
- avoid package-name-to-project-ID guessing or a static mapping file.

Moon project IDs MUST be unique and stable. Renaming a Moon project ID is a release-component migration and MUST include tag-baseline migration handling.

## Minimal `get-publish-matrix`

Keep `.github/tasks/get-publish-matrix` as the only affected-project selector. Reduce its output to publish targets only.

Input remains:

- Release Please outputs, used only to validate/derive channel in the coordinator;
- Moon base and head refs for affected selection.

Output becomes:

```json
[
  { "target": "docs" },
  { "target": "zellij-plugin" }
]
```

Behavior:

1. Run `MOON_BASE=... MOON_HEAD=... moon query projects --affected`.
2. Retain projects containing a `publish` task.
3. Return sorted Moon project IDs as `target`.
4. Do not compute or emit `mode`, `tag`, `channel`, `version`, `release_tag`, or `source_sha`.

`release.yml` adds channel and source identity when constructing each dispatch payload.

## Discrete publish metadata resolver

Replace the narrow `pkgs/tools/deployment/generate-publish-git-tag` behavior with one deployment helper responsible for publish metadata. Preferred name:

```text
pkgs/tools/deployment/resolve-publish-metadata
```

Remove the old helper after updating its callers; keeping both would duplicate version logic.

### Interface

```text
resolve-publish-metadata <target> <channel> <source-branch> <run-attempt>
```

The script runs after full-history checkout and toolchain setup. It returns machine-readable metadata, preferably JSON:

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

`publish.yml` validates the JSON and exports:

```text
PUBLISH_VERSION
PUBLISH_RELEASE_TAG
PUBLISH_PROJECT_SOURCE
```

### Project resolution

The resolver MUST:

1. Query Moon for the exact target.
2. Fail if target is unknown.
3. Fail if target lacks a `publish` task.
4. Read Moon `source`; this is the Release Please package/manifest key and version-source location.
5. Use the exact Moon project ID as the Release Please `component` and release tag prefix.
6. Read current version from `package.json`, otherwise `Cargo.toml` through Cargo metadata.
7. Fail on absent or malformed semantic version.

No static project mapping is needed.

### Version rules

For `channel=latest`:

```text
PUBLISH_VERSION = current source version
```

The release commit already contains the stable version written by Release Please.

For `channel=next`:

```text
main:       current stable -> next minor -> <next>-next.<commit-distance>.<run-attempt>
release/*:  current stable -> next patch -> <next>-next.<commit-distance>.<run-attempt>
```

Examples:

```text
main:       1.2.3 -> 1.3.0-next.7.1
release/*:  1.2.3 -> 1.2.4-next.2.1
retry:      1.2.4-next.2.1 -> 1.2.4-next.2.2
```

Compute commit distance per component:

1. Derive the component stable tag prefix from the Moon project ID.
2. Find the latest stable semantic-version tag reachable from `HEAD` for that component. Prerelease tags MUST be excluded.
3. Count first-parent commits from that stable tag to `HEAD`:

   ```bash
   git rev-list --first-parent --count "${stable_tag}..HEAD"
   ```

4. If the component has no reachable stable tag yet, count first-parent history from the repository root:

   ```bash
   git rev-list --first-parent --count HEAD
   ```

5. Append `github.run_attempt` from `publish.yml` as the final identifier.

Commit distance makes the primary prerelease identity source-derived: manual and repository dispatches for the same commit compute the same distance. `run_attempt` intentionally gives a GitHub rerun a distinct artifact version. A fresh manual dispatch of the same commit starts at attempt `1` again and therefore resolves the same version as the original first attempt.

The resolver MUST reject unsupported source branches rather than guessing a bump policy.

### GitHub release tag rules

Use the Release Please component convention:

```text
<moon-project-id>-v<version>
```

Examples:

```text
docs-v0.1.0
zellij-plugin-v0.1.1-next.7.1
```

The root package key `.` does not remove the component prefix. A configured Moon project ID still produces `<moon-project-id>-v<version>`. Use `include-component-in-tag: false` only for an explicitly single-component repository that intentionally wants `v<version>` tags.

During migration from source-path tags, the resolver SHOULD accept the latest reachable legacy `<project-source>-v<version>` stable tag as a one-way baseline fallback when no component-named stable tag exists. All newly created tags MUST use the Moon project ID component name. Remove fallback after every component has a component-named stable release.

For `channel=latest`, `publish.yml` MUST require the computed stable release tag to already exist. Release Please owns stable release creation.

For `channel=next`, `publish.yml` MUST create the computed tag as a prerelease if absent. Creation MUST tolerate a concurrent-create race by retrying `gh release view` after a failed create.

## `publish.yml` execution flow

Normalize trigger values first:

```text
repository_dispatch:
  target        = client_payload.target
  channel       = client_payload.channel
  source_sha    = client_payload.source_sha
  source_branch = client_payload.source_branch

workflow_dispatch:
  target        = inputs.target
  channel       = inputs.channel
  source_sha    = github.sha
  source_branch = github.ref_name
```

Then execute:

1. Validate non-empty target, source SHA, and source branch.
2. Validate channel is exactly `next` or `latest`.
3. For repository dispatch, require an explicit trusted coordinator actor/App allowlist.
4. Fetch full history plus `main` and `release/*` refs.
5. Require source branch to be `main` or `release/*`.
6. Verify source SHA is reachable from the claimed trusted source branch.
7. Check out exact source SHA before executing repository code with publish credentials.
8. Set up Moon/Bun/Rust toolchains and install dependencies.
9. Run `resolve-publish-metadata` with publish workflow `github.run_attempt`; the resolver computes commit distance from checked-out Git history.
10. Export `PUBLISH_TARGET`, `PUBLISH_CHANNEL`, `PUBLISH_VERSION`, `PUBLISH_RELEASE_TAG`, and `PUBLISH_REF`.
11. For `next`, create/find the prerelease at `PUBLISH_RELEASE_TAG`, targeted at `PUBLISH_REF`.
12. For `latest`, require the Release Please-created stable release at `PUBLISH_RELEASE_TAG`.
13. Run `moon run "${PUBLISH_TARGET}:publish" --force`.
14. Summarize target, channel, version, release tag, source branch, source SHA, trigger, and result.

Concurrency:

```text
publish-<target>-<computed-version>
cancel-in-progress: false
```

Because version is computed inside the job, implement concurrency at the narrowest practical level supported by Actions. If job-level concurrency cannot reference computed step outputs, use a pre-publish lock keyed by release tag or retain target/channel concurrency with `cancel-in-progress: false`. Do not cancel retries of the same publication.

## Publish task updates

### `pkgs/plugins/zellij-plugin/moon.yml`

Replace GitHub release use of `PUBLISH_TAG` with `PUBLISH_RELEASE_TAG`:

```text
gh release view   PUBLISH_RELEASE_TAG
gh release upload PUBLISH_RELEASE_TAG
```

The task MUST NOT derive version or release tag.

### `apps/docs/.moon/tasks/generate-version-manifest`

Rename environment lookup:

```text
PUBLISH_TAG -> PUBLISH_CHANNEL
```

The generated metadata field may remain named `channel`.

### `pkgs/tools/deployment/npm-publish`

Remove local version/release-tag computation. Consume metadata exported by `publish.yml`:

- require `PUBLISH_CHANNEL`;
- require `PUBLISH_VERSION` for prereleases;
- update package version to `PUBLISH_VERSION` when channel is `next`;
- call npm with `--tag "${PUBLISH_CHANNEL}"`.

The npm CLI flag remains `--tag`; only internal workflow terminology changes.

## Branch ownership work retained in `release.yml`

Implement or retain helpers for:

```text
get-commits RELEASE_BRANCH MAIN_BRANCH
is-root-commit COMMIT RELEASE_BRANCH MAIN_BRANCH
is-hotfix-commit COMMIT RELEASE_BRANCH MAIN_BRANCH
is-hotfix-merge COMMIT MAIN_BRANCH
```

Rules:

1. Release branch root belongs to the prior stable `main` release and publishes nothing on `release/*`.
2. Commits after the root belong to hotfix policy.
3. Hotfix history merged back to `main` publishes nothing again. (TODO: explore creating two release PRs from commits on hotfix branch: a) release hotfix release, b) release merge-back. This allows conflicts to be resolved in the merge-back PR.)
4. New `main` work uses normal policy.
5. Release Please on `release/*` receives the current branch explicitly as target branch.
6. Associated PR head branch is the primary merge/squash signal; fetched ancestry is fallback.

## GitHub automation project

Add `.github` as a Moon project so workflow helpers and Bats tests join the normal task graph.

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

Include `actionlint` either in this task or as a separate `github:lint` task.

## Tests

### Sync action

- package.json publish project becomes a Node Release Please component;
- Cargo.toml publish project becomes a Rust Release Please component;
- package config key remains the Moon source path while `component` equals the Moon project ID;
- Moon project without a publish task is excluded;
- existing manifest versions are preserved;
- new manifest versions are seeded from source;
- publish project with no supported version source fails;
- normal and hotfix configs receive identical package keys and component values.

### Publish matrix

- affected project with publish task emits only `{target}`;
- project without publish task is omitted;
- output is stable and sorted;
- `releases_created` no longer changes matrix entry shape;
- invalid payload/base/head remains fatal.

### Metadata resolver

- Node current version resolves correctly;
- Cargo current version resolves correctly;
- `latest` preserves current version;
- `next` on `main` bumps minor;
- `next` on `release/*` bumps patch;
- prerelease uses first-parent distance from the latest reachable stable component tag;
- missing stable component tag falls back to first-parent count from repository root;
- prerelease tags are excluded when locating the stable baseline;
- retry attempt changes only the final prerelease identifier;
- a fresh dispatch of the same commit and attempt resolves the same version;
- Moon-project-ID release tag is component-unique;
- legacy source-path stable tag is accepted only as migration fallback;
- unknown target fails;
- non-publishable target fails;
- unsupported branch fails;
- malformed version fails.

### Publish workflow

- manual `inputs.channel` reaches `PUBLISH_CHANNEL`;
- repository `client_payload.channel` reaches `PUBLISH_CHANNEL`;
- old `tag` payload/input is rejected or absent;
- untrusted dispatch actor is rejected;
- source SHA not reachable from claimed trusted branch is rejected;
- exact SHA is checked out;
- stable release must exist;
- prerelease creation is idempotent under concurrent create;
- Zellij asset uploads to `PUBLISH_RELEASE_TAG`, never `next` or `latest`.

### Branch ownership

- release branch root is skipped;
- post-root release commit uses hotfix policy;
- main merge containing hotfix history is skipped;
- squash merge is recognized through associated PR branch;
- normal main work uses normal policy.

## Validation commands

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

## Implementation order

1. Add/update tests describing channel terminology and target-only publish matrix.
2. Update sync action discovery to include publishable Node and Cargo projects and emit `component: <moon-project-id>`.
3. Synchronize Release Please configs and manifest; verify source-path package keys and Moon-ID component names.
4. Add temporary legacy source-path stable-tag fallback for component-name migration.
5. Reduce `get-publish-matrix` to target selection only.
6. Add `resolve-publish-metadata`; migrate and remove `generate-publish-git-tag`.
7. Rename workflow/input/environment terminology from tag to channel.
8. Update `release.yml` dispatch contract without version/release tag.
9. Harden `publish.yml`, compute metadata after immutable checkout, and manage releases.
10. Update docs, npm, and Zellij publish consumers.
11. Add branch ownership gates and explicit hotfix target branch.
12. Add `.github` Moon project and run full validation.
13. Smoke-test manual next publish, normal stable release, hotfix release, and hotfix merge-back.

## Deliberate exclusions

- No static Moon-project-to-manifest mapping. Moon `source` is the package key; Moon project ID is the component identity.
- No duplicate version logic in workflows or package tasks.
- No caller-supplied version or release tag.
- No rename of npm's native `--tag` option.
- No second publish-project helper beside `get-publish-matrix`.
