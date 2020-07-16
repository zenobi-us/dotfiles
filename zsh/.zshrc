#!/bin/bash/env zsh
source "${DOTFILE_ROOT}/zfunctions/common.zsh";

load-parts "secrets.d/*"

load-parts "tools/zgen"
load-parts "config.d/*__env"
load-parts "config.d/*__aliases"

if ! zgen saved; then
    echo "[zgen update]"
    load-parts "config.d/*__zgen"
    zgen save
fi

load-parts "config.d/*__config"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
