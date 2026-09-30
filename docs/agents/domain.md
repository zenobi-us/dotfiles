# Domain documentation

This repository uses the single-context layout.

## Alignment root

The alignment root is the Git repository root:

```text
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles
```

## Documents

- Read `CONTEXT-MAP.md` first.
- Read root `CONTEXT.md` when the map links it.
- Read `domains/<domain>/CONTEXT.md` when the map links domain-specific context.
- Read `docs/adr/index.md` and the ADRs that affect the current work.
- Keep ADRs central under `docs/adr/`.
- Create domain documents only when domain terms or architectural decisions need
  to be recorded.

Use the vocabulary in the domain document linked from `CONTEXT-MAP.md`. Keep
ordinary project documentation outside alignment configuration unless it is an
ADR or agent workflow configuration.
