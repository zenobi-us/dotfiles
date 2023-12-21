ASDF_HOME=$HOME/.asdf
ASDF_BIN=$ASDF_HOME/asdf.sh

if [[ ! -f "${ASDF_BIN}" ]]; then
    echo "Missing ASDF installation. Installing..."
    sh $DOTFILE_ROOT/lib/setup.bash
fi

. "$ASDF_HOME/asdf.sh"
. "$ASDF_HOME/completions/asdf.bash"
. "$ASDF_HOME/plugins/java/set-java-home.zsh"
