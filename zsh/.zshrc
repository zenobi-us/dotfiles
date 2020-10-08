#!/bin/bash/env zsh
. "${DOTFILE_ROOT}/lib/zsh/loadparts.zsh";
. "${DOTFILE_ROOT}/lib/sh/absolutepath.sh";

load-parts "secrets.d/*"

load-parts "tools/zgen"
load-parts "config.d/*__aliases"

if ! zgen saved; then
    echo "[zgen update]"
    load-parts "config.d/*__zgen"
    zgen save
fi

load-parts "config.d/*__config"
