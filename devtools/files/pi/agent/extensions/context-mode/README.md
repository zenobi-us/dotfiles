# Context Mode Extension for pi

> Adapted from [mksglu/claude-context-mode](https://github.com/mksglu/claude-context-mode)

Reduce context window consumption from tool outputs by **~98%** using sandboxed execution and intent-driven filtering.

## The Problem

Every MCP tool call dumps raw data into your context window:
- A Playwright snapshot: **56 KB**
- Twenty GitHub issues: **59 KB**
- One access log: **45 KB**

After 30 minutes, **40% of your context is gone**.

## The Solution

Context Mode is an MCP server that processes tool outputs in sandboxes:
- **315 KB → 5.4 KB** (98% reduction)
- FTS5 knowledge base with BM25 ranking
- Intent-driven search for large outputs

## Installation

### 1. Install the MCP Server

```bash
npm install -g context-mode
```

### 2. Configure in pi

Run the setup command:

```
/context-mode:setup
```

Or manually add to `~/.config/pi/mcp.json`:

```json
{
  "mcpServers": {
    "context-mode": {
      "command": "npx",
      "args": ["-y", "context-mode"]
    }
  }
}
```

### 3. Restart pi

The MCP server will be available after restart.

## Commands

| Command | Description |
|---------|-------------|
| `/context-mode:stats` | Show context savings for the current session |
| `/context-mode:doctor` | Run diagnostics — checks runtimes, MCP config, npm packages |
| `/context-mode:setup` | Configure the MCP server in pi's config |
| `/context-mode:help` | Show available commands |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+C` | Quick access to statistics |

## MCP Tools Provided

Once configured, the following MCP tools become available:

| Tool | What it does | Context saved |
|------|--------------|---------------|
| `execute` | Run code in 10 languages. Only stdout enters context. | 56 KB → 299 B |
| `batch_execute` | Run multiple commands in ONE call | 986 KB → 62 KB |
| `execute_file` | Process files in sandbox | 45 KB → 155 B |
| `index` | Chunk markdown into FTS5 with BM25 ranking | 60 KB → 40 B |
| `search` | Query indexed content | On-demand retrieval |
| `fetch_and_index` | Fetch URL, convert to markdown, index | 60 KB → 40 B |

## How It Works

### Sandboxed Execution

Each `execute` call spawns an isolated subprocess:
- Scripts can't access each other's memory or state
- Only stdout enters the conversation context
- Raw data (logs, API responses, snapshots) never leaves the sandbox

### Knowledge Base

The `index` tool:
- Chunks markdown by headings (keeps code blocks intact)
- Stores in SQLite FTS5 virtual table
- Uses BM25 ranking for relevance scoring
- Porter stemming for flexible matching

### Fuzzy Search

Three-layer fallback:
1. **Porter stemming** — "caching" matches "cached", "caches"
2. **Trigram substring** — "useEff" finds "useEffect"
3. **Levenshtein correction** — "kuberntes" → "kubernetes"

## Data Location

Extension data stored in:
```
~/.local/share/pi-context-mode/
├── config.json        # Extension settings
└── session-stats.json # Current session statistics
```

## Credits

- Original implementation: [Mert Koseoğlu](https://github.com/mksglu)
- Repository: [mksglu/claude-context-mode](https://github.com/mksglu/claude-context-mode)
- License: MIT
