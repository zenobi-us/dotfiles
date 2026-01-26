---
id: qa-zellij
title: Zellij Extension Development Q&A
created_at: 2026-01-23T12:51:00+10:30
updated_at: 2026-01-23T12:51:00+10:30
status: in-progress
related_epic: zellij-extension-development
tags: [research, qa, zellij, extension]
---

# Zellij Extension Development Q&A

## Summary

This document contains questions for clarifying the requirements and design of the Zellij extension, modeled after the worktree extension.

## Questions for Human

Please answer the numbered questions below. You can answer inline after each question or provide answers in a separate section at the bottom.

---

### 1. Core Functionality Scope

**Question**: Which Zellij features are MUST-HAVE vs NICE-TO-HAVE?

The worktree extension focuses on: create, list, remove, status, cd, prune.

For Zellij, I've identified these potential commands:
- session (create/attach)
- list (sessions)
- tab (create)
- pane (create with direction)
- floating (create floating pane)
- kill (session)
- delete (session)
- status (current session info)

Should I:
- [ ] Keep all of these
- [ ] Remove some (which ones?)
- [x] Add others (please specify)

**Your Answer:**
I just wanted to start with: 

- creating new tabs with a particular layout and programs running in them.
- removing tabs.

So in my mind, initial cmds are: 

`/zellij preset create <preset-name>` - creates an entry in `~/.pi/agent/pi-zellij.json#presets, which is ZellijPresetMap = Record<string, ZellijPreset>

`/zellij preset list` - lists all available presets.

`/zellij tab new <tab-name> <cwd> [--preset <preset-name>]` - creates a new tab based on a preset. If no preset is given, just creates a blank tab.


ZellijPreset is:

```typescript
interface ZellijPreset {
  layout: string; name of the layout file in `~/.config/zellij/layouts/`,
  panes: [
    {
      id: string; // unique pane identifier
      command: string; // command to run in the pane
      args?: string[]; // optional args for the command
      cwd?: string; // optional cwd for the pane
    }
  ]
}
```

Creating a tab with a preset, would:

1. run `zellij action new-tab --layout <layout>` and then,
2. for each pane in the preset, somehow focus that pane and run the command in it.

---

### 2. Zellij Session List Parsing

**Question**: How should we parse `zellij list-sessions` output?

The worktree extension parses `git worktree list --porcelain` which has a structured format.

`zellij list-sessions` output looks like:
```
session-name [Created: timestamp] (attached)
another-session [Created: timestamp]
```

Should I:
- [ ] Parse this human-readable format (fragile but simple)
- [ ] Look for a JSON/structured output option (if it exists)
- [ ] Mock/stub this for now and implement later
- [ ] Use a different approach (please specify)

**Your Answer:**

I don't need this yet, so we can defer it for now.

---

### 3. Integration with Git/Project Context

**Question**: Should the extension be git-aware like worktree?

The worktree extension heavily integrates with git (branches, repo detection, etc.).

For Zellij, should we:
- [ ] Integrate with git to auto-name sessions based on branch (e.g., `myproject-feature-auth`)
- [ ] Keep it git-agnostic and use only CWD/directory names
- [ ] Make git integration optional via settings
- [ ] Other approach (please specify)

**Your Answer:**

I don't need git integration for now, so we can keep it git-agnostic.


---

### 4. Session Naming Convention

**Question**: What should the default session naming format be?

The worktree extension uses `feature/<name>` for branches.

For Zellij sessions, should the default be:
- [ ] `{{project}}` - Just the project name
- [ ] `{{project}}-{{feature}}` - Project + feature name
- [ ] `{{project}}-{{branch}}` - Project + git branch
- [ ] User-configurable only (no default)
- [ ] Other (please specify)

**Your Answer:**

Don't need this for now.

---

### 5. Tab and Pane Creation Arguments

**Question**: How much control should users have over tab/pane creation?

The skeleton currently has basic commands. Should we support:
- [ ] Just direction (right/down/left/up) for panes
- [ ] Direction + command to run in pane
- [ ] Direction + command + cwd
- [ ] Full argument passthrough to `zellij action new-pane --<args>`
- [ ] Named presets (e.g., `/zellij pane backend` → opens specific layout)

**Your Answer:**

see question 1 above.


---

### 6. Layout File Support

**Question**: Should the extension support Zellij layout files?

The worktree extension doesn't have an equivalent, but Zellij supports layout files for complex workspace setups.

Should we:
- [ ] Not support layouts (keep it simple)
- [ ] Support loading predefined layouts from ~/.config/zellij/layouts/
- [ ] Support custom layout paths
- [ ] Support inline layout definition (advanced)
- [ ] Defer this to a future version

**Your Answer:**

See question 1 above.

---

### 7. Integration with Worktree Extension

**Question**: Should the zellij extension integrate with the worktree extension?

Potential use case: `/worktree create auth-feature` could auto-create a Zellij session for that worktree.

Should we:
- [ ] Keep them completely separate
- [ ] Add a `/zellij worktree <name>` command that opens a session for a worktree
- [ ] Add hooks so worktree onCreate can launch a Zellij session
- [ ] Full bidirectional integration (ambitious)
- [ ] Other approach (please specify)

**Your Answer:**

See question 1 above.

Not needed for now.

---

### 8. onCreate Hook Use Cases

**Question**: What should the onCreate hook support?

The worktree extension runs commands after creating a worktree (e.g., `mise setup`).

For Zellij sessions, what should onCreate do?
- [ ] Run a command in the session (e.g., start a dev server)
- [ ] Create a predefined tab layout
- [ ] Source a shell configuration
- [ ] All of the above
- [ ] Nothing (keep it simple)
- [x] Other (please specify)

**Your Answer:**

Don't need this for now.

---

### 9. Error Handling for Missing Zellij

**Question**: How should we handle cases where Zellij is not installed?

Should we:
- [x] Fail gracefully with a helpful error message
- [ ] Provide installation instructions
- [ ] Detect OS and offer installation commands
- [ ] Check for Zellij binary on extension load and warn
- [ ] Other approach (please specify)

**Your Answer:**

Fail gracefully with a helpful error message.

---

### 10. Interactive Mode Requirements

**Question**: Which commands MUST have interactive UI vs CLI-only?

The worktree extension has `/worktree init` for interactive setup.

For Zellij, should these be interactive:
- [ ] init (settings configuration) - interactive
- [ ] session creation - interactive confirmation
- [ ] session deletion - interactive confirmation
- [ ] All commands should work both interactively and CLI-only
- [ ] Other preference (please specify)

**Your Answer:**

I don't understand the question. This is a command inside pi-mono.

---

### 11. Status Command Details

**Question**: What information should `/zellij status` show?

Should it display:
- [ ] Current session name only
- [ ] Session name + attached state
- [ ] Session name + tab count + pane count
- [ ] Full session tree (tabs and panes)
- [ ] Session + Zellij version info
- [ ] Custom/configurable fields

**Your Answer:**

don't need this for now.

---

### 12. Floating Pane Defaults

**Question**: What should the default size/position be for floating panes?

The skeleton includes a `/zellij floating` command. Defaults should be:
- [ ] Zellij's default (usually centered, medium size)
- [ ] Large (90% width, 90% height) for main work
- [ ] Medium (80% width, 60% height) for quick tasks
- [ ] Configurable in settings
- [ ] Accept arguments like `--width 80% --height 60%`

**Your Answer:**

Don't need this for now.

---

### 13. Priority for Implementation

**Question**: Which features should I implement FIRST?

Given the skeleton is complete, please rank these by priority (1 = highest):

- [ ] ___ Session create/attach
- [ ] ___ Session list
- [1] ___ Tab creation
- [ ] ___ Pane creation (split)
- [ ] ___ Settings management (init/get/set)
- [ ] ___ Status display
- [ ] ___ Session kill/delete

**Your Answer (rank 1-7):**

See question 1 above.

- Tab creation - 1
- Preset creation - 2
- Preset listing - 3

---

### 14. Additional Features

**Question**: Are there any Zellij features I'm missing that you'd like?

Examples:
- Rename session/tab/pane
- Switch to session by name
- Plugin management
- Other?

**Your Answer:**

See question 1 above.

---

## Your Answers Section

If you prefer, you can write all answers here in one block:

```
1. 
2. 
3. 
4. 
5. 
6. 
7. 
8. 
9. 
10. 
11. 
12. 
13. 
14. 
```

---

## Next Steps

After you provide answers, I will:
1. Create an epic document for the zellij extension
2. Break down implementation into phases
3. Create task files for specific implementation work
4. Update the skeleton based on your requirements
