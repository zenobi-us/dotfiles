#!/usr/bin/env zsh
ASDF_VERSION=v0.8.1
ASDF_HOME=$HOME/.asdf
ASDF_BIN=$ASDF_HOME/asdf.sh
export PATH="$HOME/.asdf/shims:$HOME/.asdf/bin:$PATH"

[ -d "$ASDF_HOME/plugins/java/set-java-home.zsh" ] && . $ASDF_HOME/plugins/java/set-java-home.zsh

fpath=($ASDF_HOME/completions $fpath)

autoload -Uz compinit && compinit
