# Try selection without running a command

For Dotfiles users. Updated 2026-11-27.

## Result

Provide word movement and selection-aware editing widgets.

## Prerequisites

An interactive Zsh session and terminal keys matching the configured escape sequences.

## Steps

1. Type harmless sample text without pressing Enter.
2. Use Shift+Left/Right to select characters and Ctrl+Left/Right to move by word.
3. Use Backspace on a selection, then Ctrl+C to discard the entire input line.

## Verification

Selection and deletion affect only the intended command-line text.

## Recovery

Discard the input with Ctrl+C if a key inserts literal escape text. Review terminal key mappings before changing widgets.

[Capability overview](README.md)
