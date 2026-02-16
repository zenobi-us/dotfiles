---
id: m0d3st03
title: Model Picker Sub-View
created_at: 2026-02-16T20:31:00+10:30
updated_at: 2026-02-16T20:45:00+10:30
status: cancelled
epic_id: m0d3la1s
phase_id: m0d3ph01
priority: high
story_points: 5
research: research-pi-subagents-overlay-patterns.md
---

# Model Picker Sub-View

## User Story

As a **pi user**, I want to **select a provider and model from a list of available options** so that **I can easily change which underlying model an alias points to**.

## Acceptance Criteria

- [ ] Selecting the "Model" field in settings opens the model picker view
- [ ] Model picker displays within the same modal (screen swap)
- [ ] Models grouped by provider with separator headers
- [ ] Format: `{model-name}` with provider shown in separator
- [ ] Current selection shown with `▸` cursor in accent color
- [ ] Currently assigned model marked with `●` indicator
- [ ] Arrow keys navigate (skip separator lines)
- [ ] Enter selects the model and returns to settings view
- [ ] Escape cancels and returns to settings view (no change)
- [ ] Viewport scrolling for long lists

## Implementation Pattern (from pi-subagents template-select)

### Model List Data Structure

```typescript
type PickerItem = 
  | { type: "separator"; label: string }  // Provider header
  | { type: "model"; id: string; name: string; provider: string };

interface PickerState {
  cursor: number;
  scrollOffset: number;
  currentModelId: string;  // The model currently assigned
}
```

### Building the Picker List

```typescript
function buildPickerItems(models: ModelInfo[], currentId: string): PickerItem[] {
  const items: PickerItem[] = [];
  const byProvider = groupBy(models, m => m.provider);
  
  for (const [provider, providerModels] of Object.entries(byProvider)) {
    items.push({ type: "separator", label: provider });
    for (const model of providerModels) {
      items.push({ 
        type: "model", 
        id: `${provider}/${model.id}`,
        name: model.name || model.id,
        provider 
      });
    }
  }
  return items;
}
```

### Navigation (Skip Separators)

```typescript
function nextSelectableIndex(items: PickerItem[], current: number, direction: 1 | -1): number {
  let next = current + direction;
  while (next >= 0 && next < items.length && items[next].type === "separator") {
    next += direction;
  }
  if (next < 0 || next >= items.length) return current;
  return next;
}
```

### Rendering

```typescript
function renderPicker(state: PickerState, items: PickerItem[], width: number, theme: Theme): string[] {
  const lines: string[] = [];
  
  lines.push(renderFullWidthHeader(" Select Model ", width, theme));
  lines.push("");  // Empty line
  
  const VIEWPORT = 12;
  const start = state.scrollOffset;
  const visible = items.slice(start, start + VIEWPORT);
  
  for (let i = 0; i < visible.length; i++) {
    const idx = start + i;
    const item = visible[i];
    
    if (item.type === "separator") {
      const label = `── ${item.label} `;
      const line = theme.fg("dim", label + "─".repeat(Math.max(0, width - visibleWidth(label) - 2)));
      lines.push(` ${line}`);
    } else {
      const isCursor = idx === state.cursor;
      const isCurrent = item.id === state.currentModelId;
      const cursor = isCursor ? theme.fg("accent", "▸") : " ";
      const marker = isCurrent ? theme.fg("success", "●") : " ";
      const name = isCursor ? theme.fg("accent", item.name) : item.name;
      lines.push(` ${cursor}${marker} ${name}`);
    }
  }
  
  // Pad viewport
  for (let i = visible.length; i < VIEWPORT; i++) {
    lines.push("");
  }
  
  lines.push("");
  lines.push(renderFullWidthFooter(" [enter] select  [esc] cancel ", width, theme));
  
  return lines;
}
```

## Visual Reference

```
─────────────────────────── Select Model ──────────────────────────────────────
                                                                               
 ── anthropic ─────────────────────────────────────────────────────────────────
 ●  claude-sonnet-4                                                            
    claude-sonnet-4-20250514                                                   
    claude-opus-4                                                              
 ── openai ────────────────────────────────────────────────────────────────────
 ▸  gpt-4o                                                                     
    gpt-4o-mini                                                                
 ── google ────────────────────────────────────────────────────────────────────
    gemini-2.5-pro                                                             
    gemini-2.5-flash                                                           
                                                                               
────────────────────────── [enter] select  [esc] cancel ───────────────────────
```

## Data Source

Pi's `ModelRegistry` provides available models:

```typescript
import { ModelRegistry } from "@mariozechner/pi-coding-agent";

// In extension context
const models = ModelRegistry.getModels();  // All configured models
const available = ModelRegistry.getAvailableModels();  // Models with valid API keys
```

Each model has:
- `id` - Full model ID (e.g., "anthropic/claude-sonnet-4")
- `name` - Display name (optional)
- `provider` - Provider name
- `reasoning` - Supports reasoning
- `input` - Input types array
- `contextWindow` - Context size
- `maxTokens` - Max output

## Navigation Hierarchy

```
List View → Settings View → Model Picker
    ↑           ↑               │
    └───esc─────┴───────esc─────┘
                        │
                      enter
                        ↓
              Returns to Settings with selected model
```

## Edge Cases

- **No available models** - Show "No models configured" message
- **API key missing** - Still show model but mark as unavailable (dimmed)
- **Many providers** - Viewport scrolling with scroll indicators
- **Long model names** - Truncate with ellipsis

## Out of Scope

- Adding new providers
- Configuring provider credentials
- Model capability details (shown in settings view)
- Search/filter within models (future enhancement)
- Fuzzy search (future enhancement)

## Tasks

*(To be created during task breakdown)*
