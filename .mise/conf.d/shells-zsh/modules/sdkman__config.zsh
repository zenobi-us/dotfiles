export SDKMAN_HOME="$HOME/.sdkman"
export SDKMAN_BIN="$SDKMAN_HOME/bin"
export SDKMAN_DIR="$SDKMAN_HOME"

[[ ! -d $SDKMAN_BIN ]] && curl -s "https://get.sdkman.io" | bash

#THIS MUST BE AT THE END OF THE FILE FOR SDKMAN TO WORK!!!
[[ -s "$SDKMAN_BIN/sdkman-init.sh" ]] && source "$SDKMAN_BIN/sdkman-init.sh"

[ ! $(command -v gradle) ] && sdk install gradle
