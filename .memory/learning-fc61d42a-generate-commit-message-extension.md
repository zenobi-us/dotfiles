---
id: fc61d42a
title: Generate Commit Message Extension - Model Selection & Configuration
created_at: 2026-02-16T23:58:00Z
updated_at: 2026-02-16T23:58:00Z
status: completed
tags: [extensions, pi-extensions, commit-automation, model-selection, cli-design]
learned_from: [epic-4dd87a16, research-pi-subagents-overlay-patterns.md]
---

# Generate Commit Message Extension - Model Selection & Configuration

## Overview

The generate-commit-message extension provides two commands for semantic commit creation:
- `/commit` - Generate commits using a configured model
- `/commit-model` - Configure which model to use (with interactive picker)

Configuration persists to `~/.pi/agent/generate-commit-message.json`.

## Architecture

### Two-Command Design
**Pattern:** Separate configuration from execution

| Command | Function | UI | Persistence |
|---------|----------|----|----|
| `/commit [prompt]` | Generate commits | UI feedback (model name, cost) | Uses config |
| `/commit-model [model]` | Configure model | Interactive picker OR direct save | Writes to config file |

### Model Selection Strategy

**Priority Order (for `/commit`):**
1. Explicitly provided model (if passed as arg)
2. Configured model from config file
3. Auto-selected cheapest model (fallback)

**Cost Calculation:**
- Token-based models: Compared by `input + (output × 2)`
- Request-based models ($0/$0): Deprioritized in favor of transparent pricing
- "Cheap-sounding" names (mini, flash, haiku, lite): Secondary heuristic

### Interactive Model Picker

**Rendering:**
- Full-width overlay with box-drawing borders
- Model names left-aligned, prices right-aligned
- Theme-aware colors (accent, text, muted, dim)
- Highlight bar for selected item with `▶` indicator

**Sorting:** Press key to toggle (same key = reverse)
- `n` - Sort by name (A→Z)
- `p` - Sort by provider (grouped)
- `c` - Sort by cost (cheapest first)

**Navigation:**
- `↑`/`↓` or `j`/`k` - Navigate
- `Enter`/`Space` - Select & save
- `Esc`/`q` - Cancel without saving

### Configuration File

```json
{
  "mode": "anthropic/claude-opus"
}
```

**Optional fields:**
- `prompt` - Default prompt (used if no args to `/commit`)
- `maxOutputCost` - Max output cost per million tokens (default: 1.0)

## Implementation Details

### Key Functions

**`calculateCostScore(model)`**
- Weights output cost 2× heavier than input
- Returns Infinity for $0/$0 models (deprioritize request-based)
- Enables fair comparison across different pricing models

**`pickCheapestModel(ctx, maxOutputCost)`**
- Filters available models by cost threshold
- Falls back to name-based heuristics if no token-based options
- Returns fallback model if registry is empty

**`selectModelInteractive(ctx)`**
- Builds custom TUI widget with dynamic rendering
- Implements keyboard input handling
- Returns selected model ID or null if cancelled

**`getModelCost(ctx, modelString)`**
- Looks up pricing from model registry
- Handles `provider/model-id` format parsing

**`formatCost(cost)`**
- Formats prices per 1M tokens with appropriate precision
- Preserves meaningful decimals for small prices ($0.0375)
- Prevents rounding up micro-prices

### Fallback Agent

If no agents found in project or user dirs, creates:
- File: `~/.pi/agent/agents/commit-writer.md`
- Skills: `writing-git-commits`
- Tools: `read`, `bash`

This ensures `/commit` always has a subagent to delegate to.

## User Workflows

### First-Time Setup
```bash
1. /commit                    # Auto-selects cheapest model
2. /commit-model              # Opens picker if you want to change
3. c                          # Sort by cost
4. Enter                      # Save cheapest option
```

### Ongoing Usage
```bash
/commit                          # Uses configured model
/commit "fix: update dependencies"  # Custom prompt
```

### Model Configuration
```bash
/commit-model                              # Interactive picker
/commit-model anthropic/claude-opus        # Direct config
/commit-model openai/gpt-4o-mini           # Switch models
```

## Design Patterns

### Cost-Aware Model Selection
- **Token-based priority:** Clear, comparable pricing
- **Fallback to naming:** Heuristic when pricing unavailable
- **Threshold filtering:** Configurable max cost per user preference

### UI/UX Elements
- **Full-width overlay:** Maximizes readability, respects theme
- **Alignment:** Models left-aligned, costs right-aligned (visual balance)
- **Multiple sort modes:** Name, provider, cost (user choice)
- **Vim keybindings:** `j`/`k` in addition to arrow keys
- **Escape affordance:** Multiple ways to cancel (`Esc`, `q`)

### Separation of Concerns
- Configuration = `/commit-model` only
- Execution = `/commit` only
- State = Config file (not hardcoded)

## Integration Points

- **Model Registry:** `ctx.modelRegistry.getAvailable()`
- **UI System:** `ctx.ui.notify()` for feedback, `ctx.ui.custom()` for picker
- **Agent Discovery:** `findNearestProjectAgentsDir()`, `listAgentNamesInDir()`
- **Subagent Execution:** `pi.sendUserMessage()` with task payload
- **Skills:** Uses `writing-git-commits` skill for commit generation

## Performance Considerations

- **Model list caching:** Fetched once per command
- **Cost calculations:** Only for displayed models
- **String formatting:** Uses efficient padding and slicing
- **UI rendering:** Full redraw on each input (acceptable for overlay)

## Future Enhancements

- Recent models history in picker
- Model filtering by capability (reasoning, context window)
- Pricing calculator for large commits
- Custom cost thresholds per model category
- Agent-per-model configuration (different agents for different models)

## Key Takeaways

1. **Two commands = Two concerns:** Config is separate from generation
2. **Cost transparency matters:** Users want to know what they're spending
3. **Fallbacks must be robust:** No model? Use fallback agent. No pricing? Use naming heuristics
4. **UI must be theme-aware:** Respects user's theme settings for consistency
5. **Keyboard-first:** Vim keys + arrows + Escape for power users
