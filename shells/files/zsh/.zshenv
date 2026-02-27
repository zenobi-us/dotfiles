#!/usr/bin/env zsh
# store path to this directory
export HEREDIR="$(cd "$(dirname "$(readlink -f "${(%):-%N}")")" && pwd)"
export DOTFILE_REPO_ROOT="$(git -C "${HEREDIR}" rev-parse --show-toplevel 2>/dev/null || echo "${HEREDIR}")"
export DOTFILE_ROOT="$HEREDIR"

source "${DOTFILE_ROOT}/zinit.zsh"
zinit_load_env_modules

if [[ "$SSH_TTY" && "$SHLVL" -eq 1 && ! -o LOGIN && -s "${ZDOTDIR:-$HOME}/.zprofile" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprofile"
fi

alias assume=". assume"
