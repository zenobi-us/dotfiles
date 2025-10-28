#!/bin/bash zsh

# shellcheck disable=SC1091
. "${DOTFILE_ROOT}/lib/bashkit.sh"
. "${DOTFILE_ROOT}/lib/case.sh"
. "${DOTFILE_ROOT}/lib/osinformation.sh"
. "${DOTFILE_ROOT}/lib/absolutepath.sh"
. "${DOTFILE_ROOT}/lib/loadparts.zsh"
. "${DOTFILE_ROOT}/lib/config.zsh"

load-parts "config.d/enabled/*__env"
load-parts "config.d/enabled/*__env-${MACHINE_OS}"
load-parts "config.d/enabled/*__aliases"
load-parts "config.d/enabled/*__aliases-${MACHINE_OS}"
load-parts "config.d/enabled/*__config"
load-parts "config.d/enabled/*__config-${MACHINE_OS}"

COLORTERM=truecolor
