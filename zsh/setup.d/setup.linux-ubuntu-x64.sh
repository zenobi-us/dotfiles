#!/usr/bin/env sh
function SetupLinuxUbuntu () {
(
    log() {
        echo "[SETUP/linux-ubuntu-x64] System> $@"
    }

    set -e

    log "install buildtools"
    apt update
    apt install -y \
        zsh \
        openssh-server \
        openssh-client \
        git \
        curl \
        python3 \
        python3-pip
    pip3 install \
        pyenv \
        pipenv

    log "install shellspec"
    [ ! -d ~/.local/lib/shellspec ] && curl -fsSL https://git.io/shellspec | sh

    log "install nvm"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | sh

    log "install tusk"
    curl -sL https://git.io/tusk | bash -s -- -b /usr/local/bin latest

    log "Done"
)
}

SetupLinuxUbuntu