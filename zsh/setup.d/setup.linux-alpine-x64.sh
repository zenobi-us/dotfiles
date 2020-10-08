#!/usr/bin/env sh
function SetupLinuxAlpine () {
(
    log() {
        echo "[SETUP/linux-alpine-x64] System> $@"
    }

    log "Setup"

    set -e
    log "install tools"
    apk --update add \
        util-linux \
        pciutils \
        usbutils \
        coreutils \
        binutils \
        findutils \
        grep \
        shadow

    log "install buildtools"
    apk --update add \
        build-base \
        gcc \
        abuild \
        binutils \
        binutils-doc \
        gcc-doc \
        cmake \
        cmake-doc \
        ccache \
        ccache-doc

    log "install sudo"
    apk --update add \
        sudo
    mkdir -p /etc/sudoers.d/
    echo '%sudo ALL=(ALL) ALL' | tee /etc/sudoers.d/sudo_group

    log "install buildtools"
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
)
}

SetupLinuxAlpine