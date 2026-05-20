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
    ".": { "release-type": "node" },
    "packages/pkg-a": { "release-type": "node" }
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

## Notes

- Package keys must exactly match repository paths.
- Seed manifest versions to currently-released versions during migration.
- Use PAT/App token when downstream workflows must trigger on release-please-created artifacts.
