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
. /home/zenobius/.asdf/asdf.sh
. /home/zenobius/.asdf/completions/asdf.bash


# tabtab source for packages
# uninstall by removing these lines
[[ -f ~/.config/tabtab/zsh/__tabtab.zsh ]] && . ~/.config/tabtab/zsh/__tabtab.zsh || true

# tabtab source for yarn package
# uninstall by removing these lines or running `tabtab uninstall yarn`
[[ -f /tmp/xfs-a592f79e/dlx-2288069/node_modules/tabtab/.completions/yarn.zsh ]] && . /tmp/xfs-a592f79e/dlx-2288069/node_modules/tabtab/.completions/yarn.zsh

PID=`pgrep -n -u $USER gnome-session`
if [ -n "$PID" ]; then
    export DISPLAY=`awk 'BEGIN{FS="="; RS="\0"}  $1=="DISPLAY" {print $2; exit}' /proc/$PID/environ`
    echo "DISPLAY set to $DISPLAY"
else
    echo "Could not set DISPLAY"
fi
unset PID1
