#!/usr/bin/env zsh
ASDF_VERSION=v0.8.1
ASDF_HOME=$HOME/.asdf
ASDF_BIN=$ASDF_HOME/asdf.sh

export PATH="$HOME/.asdf/shims:$HOME/.asdf/bin:$PATH"

if [[ ! -f "${ASDF_BIN}" ]]; then
    sh $DOTFILE_ROOT/lib/setup.bash
fi

. $ASDF_BIN
[ -f "$ASDF_HOME/completions/asdf.bash" ] && . $ASDF_HOME/completions/asdf.bash
[ -f "$ASDF_HOME/plugins/java/set-java-home.zsh" ] && . $ASDF_HOME/plugins/java/set-java-home.zsh
