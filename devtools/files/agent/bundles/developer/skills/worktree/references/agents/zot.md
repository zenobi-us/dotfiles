# Agent contract: zot

## Detection — unresolved

zot has no self-identifying environment variable. Checked `github.com/patriceckhart/zot`'s own README/docs directly: it documents provider API keys, `ZOT_HOME`, `ZOT_INLINE_IMAGES`, `ZOT_FLAT_TOOLS`, `ZOT_TOOL_ARG_WIDTH`, `ZOT_COMPACT_INPUT`, proxy vars, `TERM`/`TERM_PROGRAM` — none of them mean "running inside zot."

- `detect-agent` cannot see zot automatically today.
- MUST pass `--agent zot` explicitly (to `scripts/router.mjs route`) when the caller knows zot is the target.
- `command -v zot` only proves the binary is installed, not that the current process is zot — do not use it as a detection substitute.

## Launch

```bash
zot <task or -- @handoff-file>
```

hrdx's built-in harness kind for this agent is `zot`.
