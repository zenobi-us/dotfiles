#!/bin/bash/env zsh
. "${DOTFILE_ROOT}/lib/sh/case.sh"
. "${DOTFILE_ROOT}/lib/sh/osinformation.sh"
. "${DOTFILE_ROOT}/lib/sh/absolutepath.sh"
. "${DOTFILE_ROOT}/lib/zsh/loadparts.zsh"
. "${DOTFILE_ROOT}/lib/zsh/config.zsh"

load-parts "config.d/enabled/*__env"
load-parts "config.d/enabled/*__env-${OSINFO_PLATFORM}"
load-parts "secrets.d/*"
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

export PNPM_HOME="/home/zenobius/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

# tabtab source for electron-forge package
# uninstall by removing these lines or running `tabtab uninstall electron-forge`
[[ -f /home/zenobius/.pnpm-store/v3/tmp/_npx/157790/5/node_modules/.pnpm/tabtab@2.2.2/node_modules/tabtab/.completions/electron-forge.zsh ]] && . /home/zenobius/.pnpm-store/v3/tmp/_npx/157790/5/node_modules/.pnpm/tabtab@2.2.2/node_modules/tabtab/.completions/electron-forge.zsh