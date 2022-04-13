#!/usr/bin/env sh
function SetupOsxUser () {
(
    log() {
        echo "[SETUP/osx.user] $@"
    }

    log "> Setup"

    cd ~;
    log "> cleaning ~/.z*"
    rm -rf ~/.z*

    log "> linking zsh files"
    [ -f ${HEREPATH}/.zshrc ] && ln -s ${HEREPATH}/.zshrc ~/
    [ -f ${HEREPATH}/.zprofile ] && ln -s ${HEREPATH}/.zprofile ~/
    [ -f ${HEREPATH}/.zshenv ] && ln -s ${HEREPATH}/.zshenv ~/

    log "Done"
)
}

SetupOsxUser
