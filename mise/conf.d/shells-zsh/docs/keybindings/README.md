# Selection-aware Zsh keybindings

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Provide word movement and selection-aware editing widgets.

For Dotfiles users. Updated 2026-11-27.

The shared configuration uses Emacs bindings. Shift movement selects text; ordinary movement deselects; Delete/Backspace remove an active region. The loader activates Linux-specific bindings on Linux, but does not call the Darwin-specific file. Terminal escape sequences determine behavior.

## Complete a task

[Try selection without running a command](HOWTO.md)

## Source files

- **Source:** [modules/keybindings__config.zsh](../../modules/keybindings__config.zsh)
- **Source:** [modules/keybindings__config-linux.zsh](../../modules/keybindings__config-linux.zsh)
- **Source:** [modules/keybindings__config-darwin.zsh](../../modules/keybindings__config-darwin.zsh)
- **Source:** [zinit.zsh](../../zinit.zsh)

[Module overview](../../README.md)
