#!/bin/bash/env zsh
source "${DOTFILE_ROOT}/zfunctions/common.zsh";

load-parts "tools/zgen"
load-parts "secrets.d/*"
load-parts "config.d/*__env"
load-parts "config.d/*__aliases"

if ! zgen saved; then
    echo "[zgen update]"
    load-parts "config.d/*__zgen"
    zgen save
fi

load-parts "config.d/*__config"
