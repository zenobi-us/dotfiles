#!/usr/bin/env zsh
# store path to this directory
export HEREDIR="$(cd "$(dirname "$(readlink -f "${(%):-%N}")")" && pwd)"
export DOTFILE_REPO_ROOT="$(git -C "${HEREDIR}" rev-parse --show-toplevel 2>/dev/null || echo "${HEREDIR}")"
export DOTFILE_ROOT="$HEREDIR/.zsh"

. "${DOTFILE_ROOT}/lib/loadparts.zsh";

if [[ "$SSH_TTY" && "$SHLVL" -eq 1 && ! -o LOGIN ]]; then
  load-parts "$DOTFILE_ROOT" "config.d/*__env"
fi

if [[ "$SSH_TTY" && "$SHLVL" -eq 1 && ! -o LOGIN && -s "${ZDOTDIR:-$HOME}/.zprofile" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprofile"
fi

alias assume=". assume"
