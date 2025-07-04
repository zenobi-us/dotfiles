#!/bin/bash/env zsh
. "${DOTFILE_ROOT}/lib/case.sh"
. "${DOTFILE_ROOT}/lib/osinformation.sh"
. "${DOTFILE_ROOT}/lib/absolutepath.sh"
. "${DOTFILE_ROOT}/lib/loadparts.zsh"
. "${DOTFILE_ROOT}/lib/config.zsh"

load-parts "config.d/enabled/*__env"
load-parts "config.d/enabled/*__env-${OSINFO_PLATFORM}"
load-parts "config.d/enabled/*__aliases"
load-parts "config.d/enabled/*__aliases-${OSINFO_PLATFORM}"


load-parts "config.d/enabled/*__config"
load-parts "config.d/enabled/*__config-${OSINFO_PLATFORM}"
