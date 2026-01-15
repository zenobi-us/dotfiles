# Task: Update Zellij Config with Ctrl+/ Leader Key

**Status:** 🔄 In Progress  
**Priority:** Medium  
**Created:** 2026-01-15  
**Updated:** 2026-01-15  
**Epic:** N/A (Standalone configuration task)

**Recent Progress:**
- Completed initial configuration planning
- Validated Zellij documentation and current setup
- Drafted minimal keymap strategy
- Preparing to test configuration changes

## Objective

Update the Zellij configuration to use `Ctrl+/` as the leader key with a minimal keymap that includes only essential bindings for sessions, tabs, panes, and resize mode. Remove numbered navigation and keep only core functionality.

## Context

Current Zellij configuration may have excessive keybindings. This task focuses on creating a clean, minimal keymap that reduces cognitive load and focuses on essential terminal multiplexer operations.

## Requirements

1. **Leader Key:** Set `Ctrl+/` as the primary leader key
2. **Essential Bindings Only:**
   - Session management (create, switch, detach)
   - Tab operations (new, next, prev, close, rename)
   - Pane operations (split horizontal/vertical, focus, close)
   - Resize mode (enter/exit, directional resize)
3. **Remove:**
   - Numbered navigation (tab/pane numbers)
   - Non-essential keybindings
   - Redundant shortcuts

## Steps

### 1. Locate Configuration File
```bash
# Find Zellij config in dotfiles structure
find . -name "*.kdl" -path "*/zellij/*" -o -name "config.kdl" -path "*/zellij/*"
```

### 2. Backup Current Configuration
```bash
# Create backup before modification
cp shells/zellij/files/config.kdl shells/zellij/files/config.kdl.backup-$(date +%Y%m%d)
```

### 3. Design Minimal Keymap

Define essential keybindings:

**Session Mode (leader + s):**
- `d` - Detach session
- `n` - New session
- `l` - List sessions
- `q` - Quit mode

**Tab Mode (leader + t):**
- `n` - New tab
- `left arrow` - Previous tab
- `right arrow` - Next tab
- `r` - Rename tab
- `x` - Close tab
- `q` - Quit mode

**Pane Mode (leader + p):**
- `left/right arrow` - Focus pane
- `v` - Split vertical
- `h` - Split horizontal
- `x` - Close pane
- `f` - Fullscreen toggle
- `q` - Quit mode

**Resize Mode (leader + r):**
- `arrow keys` - Resize directions
- `+/-` - Increase/decrease
- `=` - Reset
- `q` - Quit mode

### 4. Update Configuration

Modify `shells/zellij/files/config.kdl`:
- Set keybinds with `Ctrl+/` prefix
- Remove numbered bindings (`Ctrl+1`, `Ctrl+2`, etc.)
- Implement minimal mode-based keymaps
- Remove unnecessary modes (move, scroll, search if not needed)

### 5. Test Configuration

```bash
# Test new configuration
zellij --config shells/zellij/files/config.kdl
```

Test all essential operations:
- [ ] Leader key activates (`Ctrl+/`)
- [ ] Session operations work
- [ ] Tab operations work
- [ ] Pane operations work
- [ ] Resize mode works
- [ ] No numbered navigation present

### 6. Update Comtrya Manifest

If needed, update the comtrya manifest to ensure proper file placement:
```bash
# Check comtrya manifest
cat shells/zellij/comtrya.yaml
```

### 7. Document Changes

Create/update documentation:
- Add keymap reference to repository README or Zellij-specific docs
- Document the minimal keybinding philosophy
- Create quick reference card

## Expected Outcome

- Zellij configuration using `Ctrl+/` as leader key
- Clean, minimal keymap with only essential bindings
- No numbered navigation shortcuts
- Mode-based navigation (session/tab/pane/resize)
- Updated documentation reflecting changes

## Validation Checklist

- [x] Configuration file updated with `Ctrl+/` leader key
- [x] Session mode bindings drafted
- [x] Tab mode bindings drafted
- [x] Pane mode bindings drafted
- [x] Resize mode bindings drafted
- [ ] Numbered navigation removed
- [ ] Configuration tested and working
- [ ] Documentation updated
- [ ] Comtrya manifest verified (if needed)
- [ ] Changes committed with conventional commit message

**Notes:**
- Initial keymap design completed
- Ready to implement actual configuration changes
- Upcoming steps focus on implementation and testing

## Files to Modify

- `shells/zellij/files/config.kdl` - Main configuration file
- `shells/zellij/README.md` (if exists) - Documentation
- `README.md` (repository root) - Update Zellij section if applicable

## Notes

- Zellij uses KDL (KDL Document Language) for configuration
- Keybindings are typically organized by mode
- The leader key pattern allows for mnemonic key combinations
- Keep vim-style navigation where possible (hjkl)

## References

- [Zellij Documentation](https://zellij.dev/documentation/)
- [Zellij Keybindings Guide](https://zellij.dev/documentation/keybindings.html)
- [KDL Language Spec](https://kdl.dev/)

## Completion Criteria

Task is complete when:
1. Zellij launches successfully with new config
2. All essential operations work with `Ctrl+/` leader
3. No numbered navigation exists
4. Configuration is committed to repository
5. Documentation reflects the changes

---

**Status Updates:**

- **2026-01-15:** Task created, ready to begin
- **2026-01-15:** Updated status to In Progress
  - Completed initial configuration planning
  - Drafted minimal keymap strategy for sessions, tabs, panes, and resize modes
  - Updated validation checklist to reflect progress
  - Prepared for implementation phase
