---
id: ze11ij01
title: Zellij Preset-Based Tab Management Extension
created_at: 2026-01-23T13:05:00+10:30
updated_at: 2026-01-23T13:05:00+10:30
status: planning
---

# Zellij Preset-Based Tab Management Extension

## Vision/Goal

Create a Pi agent extension that enables users to quickly create Zellij tabs with predefined layouts and running programs via named presets. This allows for rapid workspace setup without manual tab/pane configuration.

## Success Criteria

- [ ] Users can create named presets that define tab layouts and pane commands
- [ ] Users can list all available presets
- [ ] Users can create new tabs with preset configurations
- [ ] Presets are stored in `~/.pi/agent/pi-zellij.json`
- [ ] Extension gracefully handles missing Zellij binary
- [ ] Commands execute within active Zellij sessions

## Core Features

### 1. Preset Management

**Commands:**
- `/zellij preset create <preset-name>` - Interactively create a preset
- `/zellij preset list` - List all available presets
- `/zellij preset edit <preset-name>` - Edit an existing preset (optional)
- `/zellij preset delete <preset-name>` - Delete a preset

**Data Structure:**
```typescript
interface ZellijPreset {
  layout: string; // layout file name in ~/.config/zellij/layouts/
  panes: Array<{
    id: string;      // unique pane identifier
    command: string; // command to run
    args?: string[]; // optional command args
    cwd?: string;    // optional working directory
  }>;
}

type ZellijPresetMap = Record<string, ZellijPreset>;
```

**Storage:** `~/.pi/agent/pi-zellij.json`

### 2. Tab Creation

**Commands:**
- `/zellij tab new <tab-name> <cwd> [--preset <preset-name>]`
  - Creates blank tab if no preset specified
  - Applies preset layout and runs commands if specified

**Implementation Flow:**
1. Execute `zellij action new-tab --layout <layout> --cwd <cwd> --name <tab-name>`
2. For each pane in preset:
   - Focus pane by ID/position
   - Execute command with optional args and cwd

### 3. Tab Removal

**Command:**
- `/zellij tab close [<tab-name>]`
  - Closes current tab if no name specified
  - Closes named tab if specified

## Technical Architecture

### File Structure
```
~/.pi/agent/pi-zellij.json       # Preset storage
~/.config/zellij/layouts/*.kdl   # Zellij layout files (referenced)
devtools/files/pi/agent/extensions/zellij/
  └── index.ts                   # Extension implementation
```

### Key Components

1. **Preset Manager**
   - Load/save presets from JSON
   - Validate preset structure
   - Interactive preset creation

2. **Tab Controller**
   - Create tabs with layouts
   - Focus panes programmatically
   - Execute commands in panes

3. **CLI Wrapper**
   - Execute `zellij action` commands
   - Handle errors gracefully
   - Check for Zellij binary

## Phases

1. **Phase 1: Core Infrastructure** - Preset storage, loading, validation
2. **Phase 2: Preset Management** - Create, list, delete presets
3. **Phase 3: Tab Creation** - Apply presets to new tabs
4. **Phase 4: Polish & Testing** - Error handling, edge cases, documentation

## Dependencies

- Zellij must be installed and in PATH
- User must be inside an active Zellij session for tab commands
- Layout files must exist in `~/.config/zellij/layouts/`

## Future Enhancements (Out of Scope)

- Git integration for auto-naming
- Session management
- Floating panes
- Worktree integration
- Status displays
- Auto-attach behavior

## Notes

- Focus is on **simplicity and speed** - quick workspace setup
- Preset-driven approach allows reusable configurations
- Layout files are created separately in Zellij config (not managed by extension)
- Commands assume user is already in a Zellij session
