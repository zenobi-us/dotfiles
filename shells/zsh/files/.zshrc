#!/bin/bash/env zsh
. "${DOTFILE_ROOT}/lib/sh/case.sh"
. "${DOTFILE_ROOT}/lib/sh/osinformation.sh"
. "${DOTFILE_ROOT}/lib/sh/absolutepath.sh"
. "${DOTFILE_ROOT}/lib/zsh/loadparts.zsh"
. "${DOTFILE_ROOT}/lib/zsh/config.zsh"

load-parts "config.d/enabled/*__env"
load-parts "config.d/enabled/*__env-${OSINFO_PLATFORM}"
load-parts "tools/zgen"
load-parts "config.d/enabled/*__aliases"
load-parts "config.d/enabled/*__aliases-${OSINFO_PLATFORM}"

if ! zgen saved; then
    echo "[zgen update]"
    load-parts "config.d/enabled/*__zgen"
    load-parts "config.d/enabled/*__zgen-${OSINFO_PLATFORM}"
    zgen save
fi

load-parts "config.d/enabled/*__config"
load-parts "config.d/enabled/*__config-${OSINFO_PLATFORM}"