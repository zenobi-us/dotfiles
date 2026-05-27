---
name: portless-cli
description: Guides correct usage of the Portless CLI for local named URLs, monorepo workflows, HTTPS/LAN/Tailscale modes, and proxy routing pitfalls, when developers need stable local domains instead of port juggling, resulting in reproducible commands and fewer misconfiguration loops.
---

# Portless CLI

## Overview
Portless maps local apps to stable named URLs like `https://myapp.localhost`. It removes manual port juggling and reduces cross-app cookie/origin clashes.

Source of truth: `vercel-labs/portless` GitHub README and `portless --help`.

## When to Use
Use when you need:
- Stable local hostnames instead of `localhost:NNNN`
- Monorepo app naming/worktree-safe URLs
- HTTPS local dev with trusted local CA
- LAN or Tailscale sharing of local apps

Do not use for public production ingress.

## Quick Start
```bash
npm install -g portless
portless run next dev
# -> https://<project>.localhost
```

Explicit name:
```bash
portless myapp next dev
# -> https://myapp.localhost
```

## Core Commands
- `portless` / `portless run` — run package dev script through proxy
- `portless run <cmd>` — run command through proxy
- `portless <name> <cmd>` — explicit app name
- `portless proxy start|stop`
- `portless list`
- `portless get <name>`
- `portless trust`
- `portless hosts sync|clean`
- `portless service install|status|uninstall`
- `portless clean`

## Monorepo Pattern
- Put `portless.json` in repo root.
- Optional `apps` map for naming overrides.
- From monorepo root, `portless` starts all workspace packages with a `dev` script.

Example `portless.json`:
```json
{
  "apps": {
    "apps/web": { "name": "web" },
    "apps/api": { "name": "api" }
  }
}
```

## Critical Pitfalls
1. **Wrong syntax hallucination**: No `--from/--to/--path` flow. Use `run`, `<name> <cmd>`, `alias`, `get`, `list`.
2. **Wrong package name**: CLI install is `portless`, not `vercel-labs/portless`.
3. **Proxy loops between apps**: If frontend proxies to another Portless host, set `changeOrigin: true`.
4. **Safari DNS issues**: run `portless hosts sync`.
5. **Reserved names**: `run|get|alias|hosts|list|trust|clean|prune|proxy|service` cannot be app names unless forced with `--name`.
6. **Invalid command family**: MUST NOT use `portless http ...` (not a valid subcommand in this CLI).
7. **Invalid `apps` schema**: In `portless.json`, app entries SHOULD be objects (e.g. `{ "name": "web" }`), not ad-hoc undocumented shapes.

## API Proxy Example (Vite)
```ts
server: {
  proxy: {
    '/api': {
      target: 'https://api.myapp.localhost',
      changeOrigin: true,
      ws: true,
    },
  },
}
```

## LAN / Tailscale
- LAN mode: `portless proxy start --lan`
- Tailscale share: `portless myapp --tailscale next dev`
- Public Funnel: `portless myapp --funnel next dev`

## Validation Checklist
- `portless --help` shows command used exists.
- URL resolves at `https://<name>.localhost`.
- `portless list` shows active route.
- Cross-app proxy does not loop (no 508 Loop Detected).
- Output MUST NOT include `portless http`, `--from`, `--to`, or `--path`.
