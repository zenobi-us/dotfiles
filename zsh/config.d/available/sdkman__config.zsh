SDKMAN_HOME="$HOME/.sdkman"
SDKMAN_BIN="$SDKMAN_HOME/bin"

[[ ! -d $SDKMAN_BIN ]] && curl -s "https://get.sdkman.io" | bash

. "$SDKMAN_BIN/sdkman-init.sh"
