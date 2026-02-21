# AGENTS.md

## Repository Overview

Pi extension that provides semantic long-term memory tools and automatic memory injection.

## Build & Verification

- Typecheck: `npx tsc --noEmit`
- Build: `npm run build`

## Rules

- Keep model cache path global under `~/.pi/agent/memory/models`.
- Keep project memory data under `./.agents/memory/`.
- Avoid Bun runtime APIs; use Node-compatible dependencies.
