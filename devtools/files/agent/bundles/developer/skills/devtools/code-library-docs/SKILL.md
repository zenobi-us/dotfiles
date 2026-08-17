---
name: code-library-docs
description: Use when understanding an unfamiliar code library, reusing cached local repo docs, or generating repo-native AGENTS.md and llms.txt navigation for cloned libraries.
---

# code-library-docs

## Overview
Cache-first, docs-first library understanding. Prefer repo-native `llms.txt`, `skills/`, and `docs/` before inventing summaries. If repo has no usable docs, build them once, cache them, reuse them.

## When to Use
- New dependency feels opaque
- Need fast mental model of repo/library
- Existing local store may already have summary
- Need `AGENTS.md` that routes to best docs
- Need fallback `llms.txt` for docs-poor repos

## Flow
```text
need library understanding?
  -> check local cache
    -> hit: read AGENTS.md + linked docs
    -> miss: gh clone repo into cache
      -> inspect repo llms.txt / skills/ / docs/
        -> found: link them from cache AGENTS.md
        -> none: generate cache llms.txt + brief
```

## Cache Layout
```text
$XDG_CACHE_HOME/agent-library-docs/
└── <owner>__<repo>/
    ├── repo/
    ├── AGENTS.md
    ├── llms.txt
    ├── briefs/
    └── meta.json
```

## Quick Reference
| Item | Rule |
|---|---|
| Cache key | `owner__repo` |
| Clone target | `.../<repo-key>/repo` |
| Discovery order | `llms.txt` -> `skills/` -> `docs/` |
| Generated docs | only when repo has none worth linking |

## Implementation
1. Search cache for repo key.
2. If missing, `gh repo clone` into cache `$XDG_CACHE_HOME/agent-library-docs/<owner>__<repo>/repo/`.
3. In cache `AGENTS.md`, link repo-native `llms.txt`, `skills/`, `docs/` in that order.
4. If none exist, link cache `llms.txt` and generate it with a research-oriented subagent.
5. Store the useful brief beside it; reuse on next lookup.

## Example
`github.com/acme/widgets` -> cache key `acme__widgets`

## Common Mistakes
- Cloning twice instead of reusing cache
- Writing summary before checking repo-native docs
- Hiding native `llms.txt` under generated junk
- Using repo name only -> collisions
- Treating generated brief like source truth
