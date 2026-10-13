# Agent contract: zot

## Detection

The upstream zot project does not document a self-identifying environment variable. This router uses `AGENT=zot` as an explicit local marker. Set it in zot's process environment to enable automatic detection. Otherwise, pass `--agent zot`.

`command -v zot` only proves the binary is installed, not that the current process is zot.

## Launch

```bash
zot <task or -- @handoff-file>
```

hrdx's built-in harness kind for this agent is `zot`.
