#!/bin/sh
log "System> Setup"

set -e

log "System> install sudo"
apk --update add \
    sudo
mkdir -p /etc/sudoers.d/
echo '%sudo ALL=(ALL) ALL' | tee /etc/sudoers.d/sudo_group

log "System> install buildtools"
apk --update add \
    libstdc++ \
    zsh \
    openssh \
    gnupg \
    git \
    curl
    cmake \
    cmake-doc \
    extra-cmake-modules \
    extra-cmake-modules-doc \
    python3
pip3 install \
    pyenv \
    pipenv

log "System> install shellspec"
[ ! -d "$HOME/.local/lib/shellspec" ] \
    && curl -fsSL https://git.io/shellspec | sh

log "System> install nvm"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh \
    | sh
log "System> install tusk"
curl -sL https://git.io/tusk \
    | sh -s -- -b /usr/local/bin latest
tusk --install-completion zsh

