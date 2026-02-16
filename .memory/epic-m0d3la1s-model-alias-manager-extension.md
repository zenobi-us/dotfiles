---
id: m0d3la1s
title: Model Alias Manager Extension
created_at: 2026-02-16T20:31:00+10:30
updated_at: 2026-02-16T20:31:00+10:30
status: cancelled
---

# Model Alias Manager Extension

## Vision/Goal

Create a Pi coding agent extension that provides a TUI (Terminal User Interface) for managing model aliases. The extension enables users to view, edit, and configure model aliases through an intuitive overlay-based interface with hierarchical navigation between settings views.

**Key UX Goals:**
- Full-width modal overlay with minimal chrome (top/bottom borders only, no side borders)
- Select list displaying aliases with clear visual hierarchy: `<accent>{name}</accent> - <muted>{provider}/{model}</muted>`
- Drill-down navigation pattern: list → settings → sub-settings
- Escape-key navigation to return to previous view

## Success Criteria

- [ ] Full-width modal overlay renders correctly with top/bottom borders only
- [ ] Model alias list displays with proper styling (accent for name, muted for provider/model)
- [ ] Selecting an alias transitions to an editable settings view
- [ ] Settings view allows editing all alias fields (name, id, reasoning, input types, context window, etc.)
- [ ] "Available models" field selection opens a provider/model picker sub-view
- [ ] Escape key navigates back through the view hierarchy
- [ ] All transitions are smooth and intuitive
- [ ] Extension follows pi-mono component patterns (learned from theme-palette epic)

## Phases

1. **Research & Design** - Understand pi-mono model alias structure and overlay patterns
2. **Core Infrastructure** - Modal component, view state management, overlay registration
3. **Alias List View** - Main view with styled alias list
4. **Settings Editor View** - Field editing interface with data binding
5. **Model Picker Sub-view** - Provider/model selection overlay

## Dependencies

- Pi-mono TUI components (learned from Epic 2: Theme Development Tools)
- Modal/overlay patterns (researched in previous epics)
- Understanding of pi-mono's model alias configuration structure
- Previous learning: [component-architecture-patterns](learning-62c593ff-component-architecture-patterns.md)
- Previous learning: [layout-systems](learning-96aa4357-layout-systems.md)

## Technical Context

### Pi Model Aliases
Model aliases in pi allow users to define named configurations that map to underlying provider/model combinations with additional settings like:
- `name` - Display name for the alias
- `id` - Unique identifier
- `provider` - The model provider (anthropic, openai, etc.)
- `model` - The specific model ID
- `reasoning` - Whether extended thinking is enabled
- `inputTypes` - Supported input modalities (text, image, etc.)
- `contextWindow` - Token limit for context

### UI Architecture (from user request)
```
┌─────────────────────────────────────────────────────────────────────┐
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  ← top border
│                                                                     │
│   <accent>claude-sonnet</accent> - <muted>anthropic/claude-sonnet-4</muted> ...details    │
│   <accent>gpt-fast</accent> - <muted>openai/gpt-4o-mini</muted> ...details                │
│   <accent>local-llama</accent> - <muted>ollama/llama-3.2</muted> ...details               │
│                                                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  ← bottom border
└─────────────────────────────────────────────────────────────────────┘
           (no side borders - full width modal)

View Hierarchy:
  [List View] ──select──► [Settings View] ──select model field──► [Model Picker]
       ▲                        │                                       │
       └────────esc─────────────┴───────────────esc─────────────────────┘
```

## Notes

- This epic builds on component patterns established in Epic 2 (Theme Development Tools)
- The modal pattern aligns with the ThemeApp/Modal architecture planned in Epic 3
- Consider reusable settings list component for other extension configurations
