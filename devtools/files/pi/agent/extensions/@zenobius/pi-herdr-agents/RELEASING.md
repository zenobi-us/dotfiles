# Release guide

GitHub Actions publishes this package when the version in `package.json` changes on `main`. The release workflow reads the package name and version from `package.json`, validates the package, publishes to npm, creates a matching `vX.Y.Z` tag, and creates a GitHub Release with generated notes and a link to the npm package.

The published version must be unique on npm.

## Public versioning

`0.0.1` was a manual bootstrap publication that established the npm package. `0.0.2` is the first release published through the trusted GitHub Actions workflow and is the current public baseline.

Do not design a release that creates a GitHub Release without a successful npm publish for a new version. The workflow publishes first, then tags and creates the GitHub Release.

## Prerequisites

You need:

- Permission to manage this repository's GitHub Actions settings and npm package access for `pi-herdr-agents`
- A clean local `main` branch

Automated release gates (run by the workflow and required locally):

```bash
npm ci
npm run lint
npm test
npm pack --dry-run
```

Manual deterministic Herdr integration (required before you push a release commit; not run in GitHub Actions):

```bash
npm run test:integration
```

Run that suite from inside Herdr. It uses real Pi and Herdr processes with the local deterministic provider, so it needs no provider credentials or network access.

The optional live-provider smoke test is not a release gate:

```bash
PI_TEST_MODEL="openai-codex/gpt-5.6-luna" PI_TEST_TIMEOUT=180000 npm run test:integration:live
```

Do not release from skipped Herdr tests. Confirm the package preview includes `README.md`, `CHANGELOG.md`, `AGENTS.md`, `docs/`, `agents/`, `skills/orchestrate/SKILL.md`, and `pi-extension/subagents/workflow-worker.js`. Confirm it excludes plans, journals, sessions, prototypes, generated evidence, and local `config.json`, and that the worktree integration tests leave no test workspace behind.

## npm authentication

### Steady state: trusted publishing (tokenless)

After the package exists on npm, steady-state releases use npm trusted publishing (OIDC). No long-lived `NPM_TOKEN` is required.

1. Open the package settings for `pi-herdr-agents` on [npmjs.com](https://www.npmjs.com/).
2. Add a trusted publisher for GitHub Actions with:
   - Organization or user: `giuseppecrj`
   - Repository: `pi-herdr-agents`
   - Workflow filename: `publish.yml`
   - Allowed action: `npm publish`
3. Confirm the release job has `permissions.id-token: write` and runs on a GitHub-hosted runner (already set in `.github/workflows/publish.yml`).
4. Confirm the workflow uses the exactly pinned Node `26.3.0`, whose bundled npm supports trusted publishing.
5. Publish stays tokenless: `npm publish --access public --provenance`.

When the repository secret `NPM_TOKEN` is absent, the publish step unsets `NODE_AUTH_TOKEN` and relies on OIDC. Once the package exists, the workflow fails if `NPM_TOKEN` is still configured, so steady-state releases cannot silently keep using the bootstrap credential. Manual dispatch runs only from `main`; other refs are rejected.

### Bootstrap history

The initial `0.0.1` publication established the npm package. Trusted publishing is now configured for `giuseppecrj/pi-herdr-agents` and `publish.yml`, so all later releases use OIDC only. Later version bumps use trusted publishing only. Do not add `NPM_TOKEN`: the workflow rejects it once the package exists.

## Publish a release

Choose the semantic version increment:

- `patch`: compatible bug fixes, such as `0.0.2` to `0.0.3`
- `minor`: compatible features, such as `0.0.2` to `0.1.0`
- `major`: breaking changes, such as `0.0.2` to `1.0.0`

Create the version commit without a local tag:

```bash
git fetch --tags --prune
npm version patch --no-git-tag-version
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release v$(node -p \"require('./package.json').version\")"
git push origin main
```

The `npm version` hook regenerates `CHANGELOG.md` with `auto-changelog`. Use `npm run changelog` to regenerate it without changing the version.

Replace `patch` with `minor` or `major` when appropriate. The push triggers the **Release** workflow, which installs dependencies, runs lint and unit tests, previews package contents, publishes to npm with provenance, creates and pushes the version tag, and creates the GitHub Release.

You can rerun a failed or incomplete release from **Actions → Release → Run workflow**. If npm already has `PACKAGE_NAME@VERSION`, the workflow reads that version's `gitHead` and continues only when it matches `GITHUB_SHA` (exact-commit retry). A foreign publish fails before tag or GitHub Release creation. Existing tags are verified to point at the release commit. The workflow does not create a GitHub Release for a version that still needs publish and failed to publish.

## Verify the release

After the workflow succeeds, inspect the published package:

```bash
npm view pi-herdr-agents
```

Test installation through Pi:

```bash
pi install npm:pi-herdr-agents
```

The package should appear at <https://pi.dev/packages/pi-herdr-agents> after the gallery indexes the npm release.

## Troubleshooting

### Tag points to another commit

The workflow stops if the matching version tag already points to a different commit. Do not move or reuse release tags. Increment the package version and push a new release commit instead.

### npm rejects authentication

Confirm that the trusted publisher matches owner `giuseppecrj`, repository `pi-herdr-agents`, and workflow `publish.yml`, that the job has `id-token: write`, and that the runner is GitHub-hosted. If a release reports that `NPM_TOKEN` is bootstrap-only, remove the secret and use the trusted publisher.

### npm reports that the version already exists

If the published `gitHead` does not match this commit, the workflow fails before tagging. npm versions are immutable: increment the package version and push a new release commit. If it is a retry of the exact same commit, the workflow skips publish and continues with tag/release.

### Initial branch creation did not release

A clean repository's first push has `github.event.before` all zeroes. The workflow treats that as `release=false`. This package is already established on npm, so use tokenless trusted publishing for later releases.

### The package is absent from pi.dev

Confirm that npm published the package publicly and that `package.json` contains the `pi-package` keyword. Gallery indexing may take some time.
