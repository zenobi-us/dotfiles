#!/usr/bin/env bats

SCRIPT="/mnt/Store/Projects/Mine/Github/Dotfiles/shells/files/zsh/modules/pokemon__config.zsh"
DOTFILE_ROOT_PATH="/mnt/Store/Projects/Mine/Github/Dotfiles/shells/files/zsh"

@test "pokemon__config.zsh can be executed standalone without DOTFILE_ROOT" {
  run env -u DOTFILE_ROOT "$SCRIPT" glalie
  [ "$status" -eq 0 ]
  [ -n "$output" ]
}

@test "pokemon__config.zsh can be sourced in a non-interactive shell" {
  run env DOTFILE_ROOT="$DOTFILE_ROOT_PATH" zsh -c 'source "$1"' -- "$SCRIPT"
  [ "$status" -eq 0 ]
  [ -z "$output" ]
}
