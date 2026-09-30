# Domain Docs

How the engineering skills should consume this project's domain documentation from the active Matt Pocock alignment root.

## Before exploring, read these

- **`CONTEXT-MAP.md`** at the alignment root. It lists the stable context entry
  points.
- **`CONTEXT.md`** when the map identifies one root domain, or the relevant
  **`domains/<domain>/CONTEXT.md`** files when it identifies multiple domains.
- **`docs/adr/index.md`** and the ADRs that affect the current area.

If a linked domain document does not exist, proceed silently. The
`/domain-modeling` skill creates it when terms or decisions are resolved.

## File structure

Single-context project:

```text
/
├── CONTEXT-MAP.md
├── CONTEXT.md
└── docs/adr/
    └── index.md
```

Multi-context project:

```text
/
├── CONTEXT-MAP.md
├── docs/adr/
│   └── index.md
└── domains/
    ├── ordering/
    │   └── CONTEXT.md
    └── billing/
        └── CONTEXT.md
```

Keep all ADRs under `docs/adr/`. Use the domain links in `CONTEXT-MAP.md` instead
of putting ADR directories under source code.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
