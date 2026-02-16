---
id: m0d3st02
title: Settings Editor for Alias Fields
created_at: 2026-02-16T20:31:00+10:30
updated_at: 2026-02-16T20:45:00+10:30
status: cancelled
epic_id: m0d3la1s
phase_id: m0d3ph01
priority: high
story_points: 8
research: research-pi-subagents-overlay-patterns.md
---

# Settings Editor for Alias Fields

## User Story

As a **pi user**, I want to **edit the fields of a selected model alias in a settings view** so that **I can customize how the alias behaves without manually editing config files**.

## Acceptance Criteria

- [ ] Selecting an alias from the list transitions to a settings view
- [ ] Settings view displays within the same modal overlay (screen swap, not new modal)
- [ ] Title shows alias name being edited
- [ ] All editable fields are displayed as a settings list:
  - [ ] Name (text input)
  - [ ] Model (special field - opens model picker) with `→` indicator
  - [ ] Reasoning mode (toggle: off/on or select)
  - [ ] Input types (shows current: "text" or "text, image")
  - [ ] Context window (number display)
  - [ ] Max tokens (number display)
- [ ] Each field shows label and current value
- [ ] Current field highlighted with `▸` cursor
- [ ] Selecting "Model" field opens the Model Picker sub-view (story-m0d3st03)
- [ ] Escape returns to the alias list view
- [ ] Changes saved to `~/.pi/agent/models.json`

## Implementation Pattern (from pi-subagents)

### Screen State Machine

```typescript
type Screen = "list" | "editor" | "model-picker";

interface ComponentState {
  screen: Screen;
  listState: ListState;
  editorState: EditorState | null;
  pickerState: PickerState | null;
  currentAliasId: string | null;
}
```

### Editor State

```typescript
interface EditorState {
  cursor: number;         // Which field is selected
  scrollOffset: number;   // For scrolling if many fields
  draft: ModelAlias;      // Working copy of alias being edited
  isDirty: boolean;       // Has changes
}

interface ModelAlias {
  name: string;           // Display name (alias)
  id: string;             // Model ID sent to API
  provider: string;       // Provider name (for grouping)
  reasoning?: boolean;    // Supports reasoning/thinking
  input?: string[];       // ["text"] or ["text", "image"]
  contextWindow?: number; // Context window size
  maxTokens?: number;     // Max output tokens
}
```

### Field Rendering

```typescript
const FIELDS = [
  { key: "name", label: "Name", type: "text" },
  { key: "model", label: "Model", type: "picker", hasArrow: true },
  { key: "reasoning", label: "Reasoning", type: "toggle" },
  { key: "input", label: "Input Types", type: "display" },
  { key: "contextWindow", label: "Context", type: "display" },
  { key: "maxTokens", label: "Max Tokens", type: "display" },
] as const;

function renderEditorRow(
  field: Field, 
  value: string, 
  isCursor: boolean, 
  width: number, 
  theme: Theme
): string {
  const cursor = isCursor ? theme.fg("accent", "▸") : " ";
  const label = pad(field.label, 14);
  const arrow = field.hasArrow ? theme.fg("dim", " →") : "";
  const valueText = isCursor ? theme.fg("accent", value) : value;
  
  return `${cursor} ${theme.fg("dim", label)} ${valueText}${arrow}`;
}
```

### Input Handling

```typescript
function handleEditorInput(state: EditorState, data: string): EditorAction | undefined {
  if (matchesKey(data, "up")) {
    state.cursor = Math.max(0, state.cursor - 1);
    return;
  }
  if (matchesKey(data, "down")) {
    state.cursor = Math.min(FIELDS.length - 1, state.cursor + 1);
    return;
  }
  if (matchesKey(data, "escape")) {
    return { type: "back" };
  }
  if (matchesKey(data, "return")) {
    const field = FIELDS[state.cursor];
    if (field.type === "picker") {
      return { type: "open-picker", field: field.key };
    }
    if (field.type === "toggle") {
      state.draft.reasoning = !state.draft.reasoning;
      state.isDirty = true;
      return;
    }
    // For text fields, enter inline edit mode
    if (field.type === "text") {
      return { type: "edit-inline", field: field.key };
    }
  }
}
```

## Visual Reference

```
────────────────────────── Edit: sonnet ───────────────────────────────────────
                                                                               
▸ Name           sonnet                                                        
  Model          anthropic/claude-sonnet-4                                  →  
  Reasoning      on                                                            
  Input Types    text, image                                                   
  Context        200000                                                        
  Max Tokens     8192                                                          
                                                                               
──────────────────────── [enter] edit  [esc] back ─────────────────────────────
```

## Field Types Mapping

| Field | Type | Edit Mode | Notes |
|-------|------|-----------|-------|
| Name | string | inline text | The alias display name |
| Model | provider/model | sub-view picker | Opens model-picker screen |
| Reasoning | boolean | toggle on enter | Cycles true/false |
| Input Types | string[] | display only | Derived from model |
| Context | number | display only | Derived from model |
| Max Tokens | number | display only | Derived from model |

## Persistence

Changes are saved to `~/.pi/agent/models.json` on exiting the editor:

```typescript
async function saveAlias(alias: ModelAlias): Promise<void> {
  const configPath = path.join(os.homedir(), ".pi/agent/models.json");
  const config = JSON.parse(await fs.readFile(configPath, "utf-8"));
  
  // Find or create provider entry
  // Upsert model in provider's models array
  // Write back to file
  
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}
```

## Edge Cases

- **Name collision** - Warn if name already exists
- **Invalid model selected** - Model no longer available (show warning)
- **File write error** - Show error message, don't lose draft

## Out of Scope

- Validation error display (future enhancement)
- Undo/redo functionality
- Field reordering
- Custom field definitions
- Inline number editing (display only for now)

## Tasks

*(To be created during task breakdown)*
