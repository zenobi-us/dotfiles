#!/bin/bash/env zsh
echo ".zshenv"
DOTFILE_ROOT=$(dirname $(readlink "${(%):-%x}"))

echo "DOTFILE_ROOT: ${DOTFILE_ROOT}"
export GO_ENV=~/.goenvs

if [[ "$SHLVL" -eq 1 && ! -o LOGIN && -s "${ZDOTDIR:-$HOME}/.zprofile" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprofile"
fi

