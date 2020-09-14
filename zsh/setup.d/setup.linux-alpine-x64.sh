#!/bin/sh
log() {
	echo "[SETUP/linux-alpine-x64] $@"
}

log "System> Setup"

set -e
log "System> install tools"
apk --update add \
    util-linux \
    pciutils \
    usbutils \
    coreutils \
    binutils \
    findutils \
    grep \
    shadow
    
log "System> install buildtools"
apk --update add \
    build-base \
    gcc \
    abuild \
    binutils \
    binutils-doc \
    gcc-doc \
    cmake \
    cmake-doc \
    extra-cmake-modules \
    extra-cmake-modules-doc \
    ccache \
    ccache-doc
    
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
    curl \
    python3
    
pip3 install \
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

log "System> install qfc"
git clone https://github.com/pindexis/qfc $HOME/.qfc

log "Done"
