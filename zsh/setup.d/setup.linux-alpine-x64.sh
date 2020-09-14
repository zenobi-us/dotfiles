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

log "Done"
