# Extension Inspiration

Real-world extension examples and patterns to learn from.

## Example: Ghostty Shaders Extension

**Purpose:** Manage Ghostty terminal shaders with live preview

**Key Features:**
- Interactive shader picker with fuzzy search
- Live preview (applies shader on cursor movement)
- Favorites management
- Multiple source types (GitHub repos, local paths, URLs)
- Config backup/restore on cancel

**Patterns Used:**
- Subcommand routing (`/shaders list`, `/shaders add`, etc.)
- XDG-compliant data storage
- External process execution (git clone, curl)
- Hierarchical escape (clear filter → cancel)
- Sorted list (favorites first)

**File:** `devtools/files/pi/agent/extensions/ghostty-shaders.ts`

---

## Example: pi-subagents Agent Manager

**Purpose:** Manage AI agent definitions

**Key Features:**
- Multi-screen overlay (list → detail → picker)
- Create/edit/delete agents
- Model and skill selection
- Scope management (user/project)

**Patterns Used:**
- State machine for screens
- Separate render files per view
- Reusable render-helpers module
- Type-safe action results

**Source:** https://github.com/nicobailon/pi-subagents

---

## Common Extension Ideas

### Developer Tools
- **Model Alias Manager** - Quick switch between LLM models
- **Snippet Manager** - Store and insert code snippets
- **Environment Switcher** - Toggle between dev/staging/prod configs
- **Session History** - Browse and restore previous conversations

### Productivity
- **Quick Notes** - Capture ideas without leaving pi
- **Timer/Pomodoro** - Track focused work sessions
- **Bookmark Manager** - Save and organize file locations

### Integration
- **GitHub Issues** - Create/view issues from pi
- **Jira Integration** - Link work to tickets
- **Slack Notifications** - Send messages to channels
- **CI/CD Status** - Monitor build pipelines

### Customization
- **Theme Switcher** - Quick theme selection
- **Keybinding Editor** - Customize shortcuts
- **Prompt Templates** - Manage system prompts

---

## Extension Complexity Levels

### Level 1: Simple Command
Single command, no UI, just logic + notifications.

```typescript
pi.registerCommand("uuid", {
  description: "Generate a UUID",
  handler: async (args, ctx) => {
    const uuid = crypto.randomUUID();
    ctx.ui.notify(uuid, "info");
  },
});
```

### Level 2: Command + Subcommands
Multiple operations, argument parsing, data persistence.

```typescript
// /notes add "My note"
// /notes list
// /notes search <query>
// /notes rm <id>
```

### Level 3: Interactive Picker
Overlay with list, search, selection.

```typescript
// Single-screen overlay
// Fuzzy search
// Keyboard navigation
// Action on selection
```

### Level 4: Multi-Screen Overlay
Multiple views, state machine, CRUD operations.

```typescript
// List view → Detail view → Edit view
// Confirmation dialogs
// Form validation
// Complex state management
```

---

## Design Principles

1. **Escape always works** - Users can always exit with Escape
2. **Preview when possible** - Show effects before committing
3. **Provide feedback** - Notify success/failure of operations
4. **Respect conventions** - Follow existing pi UI patterns
5. **Fail gracefully** - Handle errors without crashing
6. **Be discoverable** - Clear help text and command descriptions

---

## Testing Extensions

```bash
# Run pi with extension
pi --extension ./my-extension/index.ts

# Test specific command
# Then type: /mycommand

# Check for TypeScript errors
npx tsc --noEmit ./my-extension/index.ts
```

---

## Publishing Extensions

Extensions can be:
1. **Local files** - `pi --extension ./path/to/extension.ts`
2. **npm packages** - `pi --extension my-pi-extension`
3. **GitHub repos** - Share as gists or repositories

For npm publishing:
```json
{
  "name": "pi-extension-myfeature",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "peerDependencies": {
    "@mariozechner/pi-coding-agent": "^0.50.0"
  }
}
```
