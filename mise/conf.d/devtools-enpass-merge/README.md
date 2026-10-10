# Bun Configuration

This directory contains Bun configuration files.

## Files

- `bunfig.toml` - Bun configuration with JSR scope mapping

## Install

The root `mise.toml` links this file during bootstrap:

```bash
mise bootstrap --only dotfiles --yes
```

Manual install:

```bash
ln -sf "$PWD/bunfig.toml" ~/.bunfig.toml
```

## Check

```bash
cat ~/.bunfig.toml
```

Expected output:

```toml
[install.scopes]
"@jsr" = "https://npm.jsr.io"
```
