#!/usr/bin/env sh
function SetupLinuxUser () {
(
    log() {
        echo "[SETUP/linux.user] $@"
    }

    log "> Setup"

    cd ~;
    log "> cleaning ~/.z*"
    rm -rf ~/.z*

    log "> linking zsh files"
    [ -f ${HEREPATH}/.zshrc ] && ln -s ${HEREPATH}/.zshrc ~/
    [ -f ${HEREPATH}/.zprofile ] && ln -s ${HEREPATH}/.zprofile ~/
    [ -f ${HEREPATH}/.zshenv ] && ln -s ${HEREPATH}/.zshenv ~/

    # log "> set zsh as shell"
    chsh -s /bin/zsh $(whoami)

    log "> install shellspec"
    [ ! -d "$HOME/.local/lib/shellspec" ] \
        && curl -fsSL https://git.io/shellspec | sh

    log "> install nvm"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh \
        | sh

    log "> install tusk"
    curl -sL https://git.io/tusk \
        | sh -s -- -b ~/bin latest

    log "> install qfc"
    git clone https://github.com/pindexis/qfc $HOME/.qfc

    log "> install mkdkr"
    curl https://raw.githubusercontent.com/rosineygp/mkdkr/master/.mkdkr > .mkdkr


    log "Done"
)
}

SetupLinuxUser