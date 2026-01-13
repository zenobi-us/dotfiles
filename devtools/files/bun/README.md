# Bun Configuration

This directory contains Bun configuration files and provisioning manifests.

## Files

- `bunfig.toml` - Bun configuration with JSR scope mapping
- `bun.comtrya.yml` - Comtrya manifest for provisioning

## What it does

The bunfig.toml configures Bun to resolve `@jsr` scoped packages from the JSR registry (https://npm.jsr.io).

## Installation

### Manual Installation

```bash
cp bunfig.toml ~/.bunfig.toml
```

### Using Comtrya (Recommended)

**IMPORTANT: Always validate before applying!**

#### 1. Validate syntax
```bash
comtrya validate devtools/files/bun/bun.comtrya.yml
```

#### 2. Dry-run to preview changes
```bash
comtrya apply --dry-run --manifest devtools/files/bun/bun.comtrya.yml
```

#### 3. Apply the manifest
```bash
cd devtools/files/bun
comtrya apply --manifest bun.comtrya.yml
```

Or from anywhere:
```bash
comtrya apply --manifest devtools/files/bun/bun.comtrya.yml
```

## Verification

After installation, verify the configuration:

```bash
cat ~/.bunfig.toml
```

Expected output:
```toml
[install.scopes]
"@jsr" = "https://npm.jsr.io"
```

Test with a JSR package:
```bash
bun add @jsr/std__path
```

## Updating

To update the configuration:

1. Edit `bunfig.toml`
2. Run validation: `comtrya validate devtools/files/bun/bun.comtrya.yml`
3. Dry-run: `comtrya apply --dry-run --manifest devtools/files/bun/bun.comtrya.yml`
4. Apply: `comtrya apply --manifest devtools/files/bun/bun.comtrya.yml`

## Notes

- The manifest uses `file.copy` which will overwrite existing `~/.bunfig.toml`
- If you have custom Bun configuration, merge it with this file before applying
- This is idempotent - safe to run multiple times
