#!/bin/bash/env zsh
export DOTFILE_ROOT=$(dirname $(readlink "${(%):-%x}"))
export GO_ENV=~/.goenvs
if [[ "$SHLVL" -eq 1 && ! -o LOGIN && -s "${ZDOTDIR:-$HOME}/.zprofile" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprofile"
fi

