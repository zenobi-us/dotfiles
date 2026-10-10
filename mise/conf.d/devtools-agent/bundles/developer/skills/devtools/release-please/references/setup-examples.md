# release-please setup examples

## Source of truth

- Action README: https://github.com/googleapis/release-please-action/blob/main/README.md
- Manifest releaser docs: https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md

## Single-package workflow

```yaml
name: release-please

on:
  push:
    branches: [main]

permissions:
  contents: write
  issues: write
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

## Manifest-mode workflow

```yaml
name: release-please

on:
  push:
    branches: [main]

permissions:
  contents: write
  issues: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json
```

## Minimal manifest files

### `release-please-config.json`

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "node",
  "packages": {
    ".": {
      "component": "app",
      "release-type": "node"
    },
    "packages/pkg-a": {
      "component": "pkg-a",
      "release-type": "node"
    }
  }
}
```

### `.release-please-manifest.json`

```json
{
  ".": "0.1.0",
  "packages/pkg-a": "0.1.0"
}
```

## Identity rules

| Field | Purpose | Example |
|---|---|---|
| Package key | Repository path, manifest key, action output prefix | `packages/pkg-a` |
| `component` | Stable release identity and default tag prefix | `pkg-a` |
| `package-name` | Strategy-specific package identity; often discovered from package metadata | `@scope/pkg-a` |
| `include-component-in-tag` | Controls component prefix in tags | `true` |

Default tags above are `app-v<version>` and `pkg-a-v<version>`. Package and manifest keys remain `.` and `packages/pkg-a`.

Use `include-component-in-tag: false` only when one release stream intentionally owns plain `v<version>` tags. Multiple independent packages cannot safely share that tag namespace.

## Notes

- Package keys must exactly match repository paths.
- Components should be unique, stable, and independent of directory layout.
- Seed manifest versions to currently-released versions during migration.
- Component renames require a tag-history migration plan because stable-tag lookup uses the component prefix.
- Use PAT/App token when downstream workflows must trigger on release-please-created artifacts.
