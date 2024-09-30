#!/usr/bin/env zsh
# store path to this directory
export DOTFILE_ROOT="$HOME/.zsh"
. "${DOTFILE_ROOT}/lib/loadparts.zsh";

if [[ "$SSH_TTY" && "$SHLVL" -eq 1 && ! -o LOGIN ]]; then
  load-parts "config.d/*__env"
fi

if [[ "$SSH_TTY" && "$SHLVL" -eq 1 && ! -o LOGIN && -s "${ZDOTDIR:-$HOME}/.zprofile" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprofile"
fi

