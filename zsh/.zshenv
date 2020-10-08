#!/bin/bash/env zsh
export DOTFILE_ROOT=$(dirname $(readlink "${(%):-%x}"))

if [[ "$SHLVL" -eq 1 && ! -o LOGIN ]]; then
  . "${DOTFILE_ROOT}/lib/zsh/loadparts.zsh";
  load-parts "config.d/*__env"
fi

if [[ "$SHLVL" -eq 1 && ! -o LOGIN && -s "${ZDOTDIR:-$HOME}/.zprofile" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprofile"
fi
