# Generate Commit Message Extension

Automated semantic commit generation using AI models with intelligent model selection and configuration.

## Features

- **Two-command design:** Separate configuration from commit generation
- **Cost-aware model selection:** Automatically chooses the cheapest model, with optional configuration
- **Interactive model picker:** Full-width overlay with dynamic sorting by name, provider, or cost
- **Persistent configuration:** Saves selected model to `~/.pi/agent/generate-commit-message.json`
- **Theme-aware UI:** Respects user's pi theme settings
- **Fallback agents:** Creates a fallback agent if none are found in the project

## Commands

### `/commit [optional prompt]`

Generate and stage a semantic commit using the configured model.

```bash
/commit                                    # Uses default prompt from skill
/commit "fix: update dependencies"         # Uses custom prompt
```

**How it works:**
1. Checks for configured model in `~/.pi/agent/generate-commit-message.json`
2. Falls back to auto-selecting the cheapest available model
3. Delegates to a subagent with the `writing-git-commits` skill
4. Shows feedback about which model was used and its pricing

### `/commit-model [optional model]`

Configure which model to use for future commits. Can be called with or without arguments.

```bash
/commit-model                              # Opens interactive picker to select model
/commit-model anthropic/claude-opus        # Directly configure without UI
```

**Model picker controls:**
- `↑` / `↓` or `j` / `k` - Navigate models (automatically skips provider headers)
- `n` - Sort by name (toggle A→Z / Z→A)
- `p` - Sort by provider (toggle A→Z / Z→A) — default
- `c` - Sort by cost (toggle cheapest first / most expensive first)
- `Enter` or `Space` - Select and save configuration
- `Esc` or `Ctrl+C` - Cancel without saving
- Type any character - Filter models by fuzzy matching
- `Backspace` - Clear filter

**Model picker layout:**
Models are grouped by provider with separator headers:
```
── anthropic ──────────────────────────────────────────────────────────────────
   claude-sonnet-4                                    $3/$15 per 1M tokens
 ▶ claude-sonnet-4-20250514                           $3/$15 per 1M tokens
── openai ─────────────────────────────────────────────────────────────────────
   gpt-4o                                             $5/$15 per 1M tokens
   gpt-4o-mini                                        $0.15/$0.6 per 1M tokens
```

## Configuration

Configuration uses `@zenobius/pi-extension-config` for layered config management.

**Config locations (highest priority first):**
1. **Environment variables** — `GENERATE_COMMIT_MESSAGE_MODE`, `GENERATE_COMMIT_MESSAGE_MAX_OUTPUT_COST`
2. **Project config** — `.pi/generate-commit-message.config.json` (in git root or cwd)
3. **Home config** — `~/.pi/agent/generate-commit-message.config.json`
4. **Defaults** — Built-in defaults

```json
{
  "mode": "anthropic/claude-opus"
}
```

### Config Fields

- `mode` (string) - Model to use in `provider/model-id` format
- `prompt` (string) - Default prompt to use when running `/commit` with no arguments
- `maxOutputCost` (number) - Maximum output cost per million tokens for "cheap" model filtering (default: 1.0)

### Example Configurations

**Cheapest model only:**
```json
{
  "mode": "google/gemini-2.0-flash"
}
```

**High-quality model:**
```json
{
  "mode": "anthropic/claude-opus",
  "prompt": "Write semantic commits following the writing-git-commits skill"
}
```

**Custom cost threshold:**
```json
{
  "mode": "openai/gpt-4o-mini",
  "maxOutputCost": 0.5
}
```

## Model Selection Strategy

### For `/commit` command:

1. **Explicit model** (if provided as argument to extension)
2. **Configured model** (from config file `mode` field)
3. **Auto-selected cheapest model** (fallback, respecting `maxOutputCost` threshold)

### Cost Calculation:

- **Cost Score** = `input_cost + (output_cost × 2)`
  - Weights output cost 2× heavier since commit messages have short input but longer output
- **Request-based models** (e.g., GitHub Copilot with $0/$0 pricing) are deprioritized
- **Token-based models** with clear per-token pricing are preferred
- **Fallback heuristic:** If no token-based models under threshold, uses name-based detection (mini, flash, haiku, lite, nano, micro, free)

## User Workflows

### First-Time Use

```bash
# Generate commit with auto-selected cheapest model
/commit "fix: typo in README"

# Check current config
cat ~/.pi/agent/generate-commit-message.json
```

### Configure Once, Use Forever

```bash
# Step 1: Choose your preferred model interactively
/commit-model

# Navigate picker with arrow keys
# Sort by cost with 'c' key
# Press Enter on your choice

# Step 2: Generate commits (all use configured model now)
/commit
/commit "docs: update changelog"
/commit "refactor: extract function"
```

### Quick Configure by Model Name

```bash
# Set model without opening picker
/commit-model anthropic/claude-opus

# Verify
cat ~/.pi/agent/generate-commit-message.json
```

### Switch Models Later

```bash
# Change configuration anytime
/commit-model

# Or directly specify new model
/commit-model openai/gpt-4o-mini
```

## Integration Points

### Model Registry

The extension queries available models via `ctx.modelRegistry.getAvailable()`, which returns model info including:
- `id` - Model identifier
- `provider` - Provider name
- `cost` - Input/output/cache pricing per 1M tokens

### Agent Discovery

Uses pi's agent discovery system to find available subagents:
1. Looks in nearest `.pi/agents/` directory (walking up from cwd)
2. Looks in user agents directory (`~/.pi/agent/agents/`)
3. Prefers agents in order: `general`, `worker`, `default`, `scout`
4. Creates fallback `commit-writer` agent if none found

### Skill Integration

Delegates to the `writing-git-commits` skill for actual commit generation. This skill handles:
- Analyzing staged changes
- Writing semantic commit messages
- Following Conventional Commits specification
- Staging the commit

### Subagent Execution

Dispatches work via `pi.sendUserMessage()` with:
```typescript
{
  agent: "selected-agent-name",
  task: "prompt for commit generation",
  model: "provider/model-id",
  skill: "writing-git-commits",
  clarify: false,
  agentScope: "both"
}
```

## Architecture

### Key Components

**`calculateCostScore(model)`**
- Converts model pricing to comparable score
- Deprioritizes request-based pricing ($0/$0)
- Returns Infinity for non-token-based models

**`pickCheapestModel(ctx, maxOutputCost)`**
- Filters models by cost threshold
- Falls back to name-based heuristics
- Returns model with lowest cost score

**`selectModelInteractive(ctx)`**
- Renders full-width overlay picker
- Handles keyboard input (navigation, sorting, selection)
- Returns selected model ID or null if cancelled

**`getModelCost(ctx, modelString)`**
- Looks up pricing for configured model
- Parses `provider/model-id` format
- Returns null if not found in registry

**`formatCost(cost)`**
- Formats pricing per 1M tokens
- Preserves meaningful decimals for small prices
- Handles $0 pricing gracefully

### UI Elements

**Model Picker Widget:**
- Full-width overlay with box-drawing borders
- Header with sort status indicator
- Model list with left-aligned names, right-aligned prices
- Interactive navigation and sorting
- Theme-aware colors (accent, text, muted, dim)
- Instructions footer

## Performance

- **Model list caching:** Fetched once per command invocation
- **Cost calculations:** Only computed for displayed models
- **UI rendering:** Full redraw on each keyboard input (acceptable for overlay)
- **String operations:** Efficient padding and truncation

## Troubleshooting

### No models appear in picker

**Cause:** Model registry is empty  
**Solution:** Ensure at least one model is configured in pi's model registry

### Configuration not saving

**Cause:** File write permission issue  
**Solution:** Check that `~/.pi/agent/` directory is writable
```bash
chmod 755 ~/.pi/agent
touch ~/.pi/agent/test.json && rm ~/.pi/agent/test.json
```

### Model name not recognized

**Cause:** Model format is `provider/model-id` but something else was provided  
**Solution:** Use `/commit-model` without arguments to see available models and their exact names

### Fallback agent not working

**Cause:** No agents found in project or user directories  
**Solution:** A fallback `commit-writer` agent is auto-created. Check:
```bash
cat ~/.pi/agent/agents/commit-writer.md
```

## File Structure

```
devtools/files/pi/agent/extensions/generate-commit-message/
├── index.ts          # Main extension code
├── package.json      # Dependencies (pi-extension-config)
└── README.md         # This file
```

## Development

### Building

The extension is TypeScript. Ensure your build system compiles it:
```bash
# With tsc
tsc devtools/files/pi/agent/extensions/generate-commit-message/index.ts

# With esbuild or bundler configured in your pi setup
```

### Types

Uses pi's extension API types:
```typescript
import type {
  ExtensionAPI,
  ExtensionContext,
} from "@mariozechner/pi-coding-agent";
```

### Testing

To test the extension:
1. Ensure it compiles without errors
2. Run `/commit` and verify model is auto-selected
3. Run `/commit-model` and verify interactive picker works
4. Verify configuration is saved to `~/.pi/agent/generate-commit-message.json`
5. Run `/commit` again and verify it uses the configured model

## Design Principles

1. **Separation of Concerns:** Configuration is separate from generation
2. **Cost Transparency:** Users see what models cost before selection
3. **Fallback Robustness:** Works even with missing agents or models
4. **Theme Consistency:** UI respects user's pi theme settings
5. **Keyboard-First:** Full keyboard navigation without mouse required
6. **Minimal Dependencies:** Relies only on pi's model registry and agent discovery

## Future Enhancements

- Model history/recently used
- Model filtering by capability (reasoning support, context window)
- Pricing calculator for estimated commit costs
- Custom cost thresholds per model category
- Agent-specific model configuration
- Commit preview before staging
- Batch commit generation for multiple files

## Related Skills

- `writing-git-commits` - Semantic commit message writing
- `superpowers:writing-git-commits` - Extended guide with examples and FAQ

## See Also

- `.memory/learning-fc61d42a-generate-commit-message-extension.md` - Distilled architecture and design patterns
- `.memory/research-f1e37c82-commit-modal-fixes.md` - Modal UI fixes and analysis
