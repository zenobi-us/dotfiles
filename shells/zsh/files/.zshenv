#!/usr/bin/env zsh
# store path to this directory
export DOTFILE_ROOT=$(dirname $(readlink "${(%):-%x}"))
. "${DOTFILE_ROOT}/lib/zsh/loadparts.zsh";

if [[ "$SSH_TTY" && "$SHLVL" -eq 1 && ! -o LOGIN ]]; then
  . "${DOTFILE_ROOT}/lib/zsh/loadparts.zsh";
  load-parts "config.d/*__env"
fi

if [[ "$SSH_TTY" && "$SHLVL" -eq 1 && ! -o LOGIN && -s "${ZDOTDIR:-$HOME}/.zprofile" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprofile"
fi
