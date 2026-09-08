---
name: creating-pi-extensions
description: Use when creating pi coding agent extensions with slash commands, keyboard shortcuts, or interactive TUI overlay modals - covers extension API patterns, command registration, and overlay implementation
---

# Skill: Creating Pi Extensions

## When to Use

- Creating new pi extensions with slash commands
- Building interactive overlay modals (pickers, editors, lists)
- Adding keyboard shortcuts to pi
- Understanding pi extension API patterns

## Quick Start

```typescript
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function myExtension(pi: ExtensionAPI) {
  pi.registerCommand("mycommand", {
    description: "Does something useful",
    handler: async (args, ctx) => {
      ctx.ui.notify("Hello from extension!", "info");
    },
  });
}
```

## Reference Documents

Read these in order based on your task:

| Document | Use When |
|----------|----------|
| [File Structure](references/filestructure.md) | Starting a new extension |
| [Code Patterns](references/code-patterns.md) | Implementing extension logic |
| [UX Patterns](references/ux-patterns.md) | Designing user interactions |
| [TUI: Overlay Basics](references/tui-overlay-basics.md) | Creating modal dialogs |
| [TUI: Lists & Pickers](references/tui-lists-pickers.md) | Building scrollable lists with search |
| [TUI: Forms & Input](references/tui-forms-input.md) | Text input and form fields |
| [Inspiration](references/inspiration.md) | Real-world extension examples |

## Key Imports

```typescript
// Extension API types
import type { ExtensionAPI, ExtensionCommandContext, Theme } from "@mariozechner/pi-coding-agent";

// TUI utilities
import { matchesKey, visibleWidth } from "@mariozechner/pi-tui";

// Configuration (recommended)
import { createConfigService } from "pi-extension-config";
```

## Extension Entry Point

Extensions export a default function that receives the pi API:

```typescript
export default function extensionName(pi: ExtensionAPI) {
  // Register commands, shortcuts, etc.
}
```

## Checklist

Before submitting an extension:

- [ ] Commands have clear descriptions
- [ ] Keyboard shortcuts don't conflict with pi defaults
- [ ] Overlays handle Escape to cancel
- [ ] Error states show helpful messages via `ctx.ui.notify()`
- [ ] Theme colors used consistently (`accent`, `border`, `dim`, `muted`, `warning`, `error`)
