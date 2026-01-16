# Task: Update Zellij Config with Ctrl+/ Leader Key

**Status:** ✅ Complete  
**Priority:** Medium  
**Created:** 2026-01-15  
**Completed:** 2026-01-16  
**Epic:** N/A (Standalone configuration task)

## Objective

Update the Zellij configuration to use `Ctrl+/` as the leader key with a minimal keymap that includes only essential bindings for sessions, tabs, panes, and resize mode.

## Outcome

Successfully restructured Zellij configuration with:

1. **Mode-based architecture** using tmux-style leader key (`Ctrl /`)
2. **Hierarchical mode navigation**:
   - Normal → `Ctrl /` → tmux mode
   - tmux mode → `t` → tab mode
   - tmux mode → `p` → pane mode
   - Any mode → `esc` → back

3. **Fixed critical bug**: Missing `SwitchToMode "normal"` calls were preventing keybindings from working after entering tmux mode.

## Final Configuration

```kdl
keybinds clear-defaults=true {
    normal {
        bind "Ctrl /" { SwitchToMode "tmux"; }
    }

    tmux {
        bind "d" { Detach; SwitchToMode "normal"; }
        bind "s" { LaunchOrFocusPlugin "session-manager" {...}; SwitchToMode "normal"; }
        bind "t" { SwitchToMode "tab"; }
        bind "p" { SwitchToMode "pane"; }
        bind "Left/Down/Up/Right" { MoveFocus "..."; SwitchToMode "normal"; }
        bind "esc" { SwitchToMode "normal"; }
    }

    pane {
        bind "v" { NewPane "right"; SwitchToMode "normal"; }
        bind "h" { NewPane "down"; SwitchToMode "normal"; }
        bind "q" { CloseFocus; SwitchToMode "normal"; }
        bind "f" { ToggleFocusFullscreen; SwitchToMode "normal"; }
        bind "esc" { SwitchToMode "tmux"; }
    }

    tab {
        bind "c" { NewTab; SwitchToMode "normal"; }
        bind "n/p" { GoToNextTab/GoToPreviousTab; SwitchToMode "normal"; }
        bind "x" { CloseTab; SwitchToMode "normal"; }
        bind "r" { SwitchToMode "renametab"; TabNameInput 0; }
        bind "esc" { SwitchToMode "tmux"; }
    }

    resize {
        bind "Left/Down/Up/Right" { Resize "Increase ..."; }
        bind "+/-" { Resize "Increase/Decrease"; }
        bind "esc" { SwitchToMode "normal"; }
    }

    renametab {
        bind "esc" { UndoRenameTab; SwitchToMode "normal"; }
    }
}
```

## Key Learnings

1. **Zellij 0.43.1 quirks**:
   - `"Escape"` is NOT a valid key name - use lowercase `"esc"`
   - Every action in a non-normal mode MUST include `SwitchToMode "normal"` to return control
   - Without explicit mode switching, you get stuck in the mode

2. **Validation command**: `zellij setup --check` - validates config syntax before deployment

3. **Configuration location**: `~/.config/zellij/config.kdl` (symlinked from dotfiles)

## Commits

- `471a8647` - fix(zellij): restructure keybindings with proper mode handling

## Validation Checklist

- [x] Configuration file updated with `Ctrl /` leader key
- [x] Session mode bindings (s for session manager, d for detach)
- [x] Tab mode bindings (t to enter, c/n/p/x/r operations)
- [x] Pane mode bindings (p to enter, v/h/q/f operations)
- [x] Resize mode bindings (arrow keys + plus/minus)
- [x] Mode escape bindings (esc returns to tmux or normal)
- [x] Configuration validated with `zellij setup --check`
- [x] Configuration tested and working
- [x] Changes committed with conventional commit message
- [x] Pushed to remote

## Files Modified

- `shells/files/zellij/config.kdl` - Main configuration file
