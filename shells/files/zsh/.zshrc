#!/usr/bin/env zsh

# shellcheck disable=SC1091
. "${DOTFILE_ROOT}/lib/bashkit.sh"
. "${DOTFILE_ROOT}/lib/case.sh"
. "${DOTFILE_ROOT}/lib/osinformation.sh"
. "${DOTFILE_ROOT}/lib/absolutepath.sh"

source "${DOTFILE_ROOT}/zinit.zsh"
zinit_load_profile_modules
zinit_load_interactive_modules

# Codex Desktop Linux launcher
alias codex-desktop='/home/zenobius/codex-linux-desktop/codex-desktop-linux/codex-app/start.sh --no-sandbox'
