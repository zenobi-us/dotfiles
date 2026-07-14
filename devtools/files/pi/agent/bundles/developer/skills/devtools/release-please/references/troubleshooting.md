# release-please troubleshooting

## Source of truth

- Release Please README troubleshooting sections:
  - https://github.com/googleapis/release-please/blob/main/README.md
- Release Please Action README:
  - https://github.com/googleapis/release-please-action/blob/main/README.md

## No Release PR created

Check in order:

1. Releasable commits exist since last release (`fix`, `feat`, `deps`; language-specific variants apply).
2. Workflow runs on target branch.
3. Existing stale autorelease labels (`autorelease: pending` / `autorelease: triggered`).
4. Token/permissions are sufficient.

## Wrong version bump

- `fix:` => patch
- `feat:` => minor
- `!` or `BREAKING CHANGE` => major

Audit merged commit/squash titles first.

## Missing changelog entries

- Commits/titles not following Conventional Commits.
- Non-linear history and noisy merge patterns.
- Path/release-type mismatch in manifest config.

## Monorepo path mismatch

Symptoms: wrong component bumps or missing bumps.

- `packages` keys in config do not match real directories.
- manifest key missing/stale after path rename/move.

## Component or tag-prefix mismatch

Symptoms: Release Please cannot find prior releases, proposes an unexpected version, or searches for the wrong tag.

- Package path and `component` are different identities. Keep `packages` keys as real directories.
- Check whether existing tags use `<old-component>-v<version>` while config now declares a new component.
- Check `include-component-in-tag`; disabling it changes lookup to `v<version>`.
- Check custom tag separators before assuming release history is absent.

A component rename is a release migration. Choose one explicit strategy:

1. Keep old component until next planned major transition.
2. Create/migrate an equivalent stable baseline tag using the new component.
3. Add temporary old-prefix lookup only in custom downstream metadata tooling, then remove it after a new component-named stable release.

Do not rename manifest path keys merely to obtain prettier tags. Set `component` instead.

## Permission/token failure

Typical symptom: `Resource not accessible by integration`.

- Ensure workflow permissions include `contents: write`, `pull-requests: write`.
- Org policy may require PAT/App token.
- If downstream workflows should trigger from release-please artifacts, avoid relying on default `GITHUB_TOKEN` behavior.

## Force rerun

If release PR seems missed, rerun action workflow (or force-run equivalent for app setups) after validating above conditions.
