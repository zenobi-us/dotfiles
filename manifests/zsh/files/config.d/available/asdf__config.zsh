#!/usr/bin/env zsh
ASDF_VERSION=v0.8.1
ASDF_HOME=$HOME/.asdf
ASDF_BIN=$ASDF_HOME/asdf.sh

if [[ ! -f "${ASDF_BIN}" ]]; then
    git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch $ASDF_VERSION
fi

. $ASDF_BIN
. $ASDF_HOME/plugins/java/set-java-home.zsh

fpath=(${ASDF_HOME}/completions $fpath)
autoload -Uz compinit
compinit
