#!/bin/sh
log "System> Setup"

set -e

log "System> install buildtools"
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

log "System> install shellspec"
[ ! -d ~/.local/lib/shellspec ] && curl -fsSL https://git.io/shellspec | sh

log "System> install nvm"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | sh

log "System> install tusk"
curl -sL https://git.io/tusk | bash -s -- -b /usr/local/bin latest
