RBENV_HOME="$HOME/.rbenv"
RBENV_BIN="$RBENV_HOME/bin"

[[ ! -d $RBENV_HOME ]] && curl -fsSL https://github.com/rbenv/rbenv-installer/raw/master/bin/rbenv-installer | bash
export PATH=$RBENV_BIN:$PATH

eval "$(rbenv init -)"
