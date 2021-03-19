#!/bin/bash/env zsh
. "${DOTFILE_ROOT}/lib/sh/case.sh";
. "${DOTFILE_ROOT}/lib/sh/osinformation.sh";
. "${DOTFILE_ROOT}/lib/sh/absolutepath.sh";
. "${DOTFILE_ROOT}/lib/zsh/loadparts.zsh";

load-parts "config.d/*__env"
load-parts "config.d/*__env-${OSINFO_PLATFORM}"
load-parts "secrets.d/*"
load-parts "tools/zgen"
load-parts "config.d/*__aliases"
load-parts "config.d/*__aliases-${OSINFO_PLATFORM}"

if ! zgen saved; then
    echo "[zgen update]"
    load-parts "config.d/*__zgen"
    load-parts "config.d/*__zgen-${OSINFO_PLATFORM}"
    zgen save
fi

load-parts "config.d/*__config"
load-parts "config.d/*__config-${OSINFO_PLATFORM}"
