# @pi-extensions-dev/pi-remember

Pi extension for semantic long-term memory using local embeddings.

## Features

- `remember` tool: store memory items
- `recall` tool: semantic search across memory
- `forget` tool: delete memory by ID
- Appends semantic `<pi_remember_memories>` as hidden context via `before_agent_start` custom message (`display: false`)

## Storage

- Project DB: `./.agents/memory/memories.sqlite`
- Global DB: `~/.pi/agent/memory/memories.sqlite`
- Embedding model cache (global): `~/.pi/agent/memory/models`

## Config

Optional JSON config:

- Global: `~/.pi/agent/remember.json`
- Project: `./.agents/remember.json` (overrides global)

```json
{
  "enabled": true,
  "scope": "project",
  "inject": {
    "count": 5,
    "lowThreshold": 0.3,
    "highThreshold": 0.8
}
```

`scope`: `"global" | "project" | "both"`

## Install

```bash
pi install npm:@pi-extensions-dev/pi-remember
```

Local dev:
```bash
npm run build && pi -e /absolute/path/to/pi-remember/dist/index.js
```
