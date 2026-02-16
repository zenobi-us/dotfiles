# pi-agentic-compaction

A [pi](https://github.com/badlogic/pi-mono) extension that provides conversation compaction using a virtual filesystem approach.

## Installation

```bash
pi install npm:pi-agentic-compaction
```

Or add to your `~/.pi/agent/settings.json`:

```json
{
  "packages": ["npm:pi-agentic-compaction"]
}
```

## How it works

When pi triggers compaction (either manually via `/compact` or automatically when approaching context limits), this extension:

1. Converts the conversation to JSON and mounts it at `/conversation.json` in a virtual filesystem
2. Spawns a summarizer agent with bash/jq tools to explore the conversation
3. The summarizer queries specific parts of the conversation (beginning, end, file modifications, user feedback)
4. Returns a structured summary to pi

### Why use this instead of built-in compaction?

**pi's default compaction** sends the entire conversation to an LLM in one pass. This works well for shorter sessions, but for long conversations (50k+ tokens), you pay for all those input tokens and the model may miss details in the middle.

**This extension's approach** lets a small, fast model *explore* the conversation by running queries. Only the queried portions enter the summarizer's context, making it cheaper and more focused for long sessions.

**Trade-offs**:
- Cheaper for very long conversations
- May miss context that a full-pass approach would catch
- Requires multiple LLM calls (but with a fast model like Cerebras, this is still quick)

## Usage

Compaction happens automatically when needed, or manually with `/compact`.

You can pass a note to guide the summarizer:

```
/compact focus on the authentication changes
```

## Configuration

Edit the constants at the top of `index.ts`:

```typescript
// Models to try for compaction, in order of preference
const COMPACTION_MODELS = [
    { provider: "cerebras", id: "zai-glm-4.7" },
    { provider: "anthropic", id: "claude-haiku-4-5" },
];

// Debug mode - saves compaction data to ~/.pi/agent/compactions/
const DEBUG_COMPACTIONS = false;
```

## License

MIT
