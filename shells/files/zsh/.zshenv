#!/usr/bin/env zsh
# store path to this directory
export DOTFILE_ROOT="$HOME/.zsh"
. "${DOTFILE_ROOT}/lib/loadparts.zsh";

HEREDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)";
export DOTFILE_REPO_ROOT="$(git -C "${HEREDIR}" rev-parse --show-toplevel 2>/dev/null || echo "${HEREDIR}")";


if [[ "$SSH_TTY" && "$SHLVL" -eq 1 && ! -o LOGIN ]]; then
  load-parts "config.d/*__env"
fi

if [[ "$SSH_TTY" && "$SHLVL" -eq 1 && ! -o LOGIN && -s "${ZDOTDIR:-$HOME}/.zprofile" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprofile"
fi

alias assume=". assume"
