# Domain Docs

How engineering skills should consume domain documentation in this repo.

## Before exploring, read these

- `CONTEXT-MAP.md` at repo root when present (multi-context index)
- Context-specific `CONTEXT.md` files referenced by the map
- `docs/adr/` and `src/<context>/docs/adr/` where present

If files are missing, proceed without blocking and use available context.

## Layout policy

This repo is configured as **multi-context**.

Expected shape:

```
/
├── CONTEXT-MAP.md
├── docs/adr/                     # system-wide decisions
├── devtools/   
│   ├── CONTEXT.md 
│   └── docs/adr/
├── <context-a>/
│   ├── CONTEXT.md
│   └── docs/adr/
└── <context-b>/
    ├── CONTEXT.md
    └── docs/adr/
```

## Vocabulary and ADR conflicts

- Use glossary terms exactly as defined in context docs.
- If output conflicts with an ADR, call out the conflict explicitly.
