---
name: inmemoria
description: Use when building persistent codebase intelligence for AI agents or integrating knowledge systems via MCP
---

# In Memoria: Persistent Codebase Intelligence

**In Memoria** is an MCP server that learns your codebase patterns once, then exposes that intelligence to AI agents persistently. Instead of re-analyzing code on every interaction, it maintains a semantic understanding of your architecture, conventions, and decisions.

## Core Concept

Setup → Learn → Verify → Serve. After that, AI agents query persistent intelligence without repeated parsing.

## Quick Start (5 minutes)

```bash
# 1. Configure for your project
npx in-memoria setup --interactive

# 2. Build intelligence database
npx in-memoria learn ./src

# 3. Verify it worked
npx in-memoria check ./src --verbose

# 4. Keep it fresh (optional but recommended)
npx in-memoria watch ./src

# 5. Expose to agents via MCP
npx in-memoria server
```

## When to Use

✅ **Use In Memoria:**
- Building long-lived AI agent partnerships (Claude, Copilot, etc.)
- Projects where consistency across sessions matters
- Teams wanting shared codebase intelligence

❌ **Skip it:**
- One-off analysis (use `npx in-memoria analyze [path]` directly)
- Simple projects agents can read directly

## The 5 Core Commands

| Command | Purpose | When |
|---------|---------|------|
| `setup --interactive` | Configure exclusions, paths, preferences | First time only |
| `learn [path]` | Build/rebuild intelligence database | After setup, major refactors |
| `check [path]` | Validate intelligence layer | After learn, before server |
| `watch [path]` | Auto-update intelligence on code changes | During development (optional) |
| `server` | Start MCP server for agent queries | After check passes |

**Key difference:** `learn` builds persistent knowledge. `analyze` is one-time reporting only.

## What Agents See

When connected, agents can query:
- **Project structure** - Tech stack, entry points, architecture
- **Code patterns** - Your naming conventions, error handling, patterns used
- **Smart routing** - "Add password reset" → suggests `src/auth/password-reset.ts`
- **Semantic search** - Find code by meaning, not keywords
- **Work context** - Track decisions, tasks, approach consistency

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Learn fails | Verify path is correct; check file permissions |
| Check reports missing intelligence | Run `learn [path]` again |
| Agent doesn't see new code | Is `watch` running? Start it: `npx in-memoria watch ./src` |
| Server won't start | Run `check --verbose` first; if issues, rebuild: `rm .in-memoria/*.db && npx in-memoria learn ./src` |
| Multiple projects conflict | Use `server --port 3001` (or different port per project) |

## Performance Notes

- **Small projects** (<1K files): 5-15s to learn
- **Medium** (1K-10K files): 30-60s
- **Large** (10K+ files): 2-5min

If learning stalls (>10min), verify you're not indexing `node_modules/`, `dist/`, or build artifacts—use setup's exclusion patterns.

## Key Principles

1. **Local-first** - Everything stays on your machine; no telemetry
2. **Persistent** - One learning pass; intelligence updates incrementally with `watch`
3. **Agent-native** - Designed for MCP; works with Claude, Copilot, and any MCP-compatible tool
4. **Pattern-based** - Learns from your actual code, not rules you define

## Deployment Pattern (3 terminals)

```bash
# Terminal 1: One-time setup
npx in-memoria setup --interactive
npx in-memoria learn ./src
npx in-memoria check ./src --verbose

# Terminal 2: Keep intelligence fresh
npx in-memoria watch ./src

# Terminal 3: Expose to agents
npx in-memoria server

# Now agents (Claude, Copilot, etc.) have persistent codebase context
```

See [GitHub](https://github.com/pi22by7/In-Memoria) for full API docs and agent integration examples.
