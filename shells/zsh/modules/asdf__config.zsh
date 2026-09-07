ASDF_HOME=$HOME/.asdf
ASDF_BIN=$ASDF_HOME/asdf.sh

[ -d "$ASDF_HOME/plugins/java/set-java-home.zsh" ] && . $ASDF_HOME/plugins/java/set-java-home.zsh


[ -f "$ASDF_HOME/plugins/java/set-java-home.zsh" ] && {
    . "$ASDF_HOME/plugins/java/set-java-home.zsh"
}
