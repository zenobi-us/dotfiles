#!/usr/bin/env sh

function SetupLinux () {
(
    log() {
        echo "[SETUP/linux] $@"
    }
    # attempt to run user setup task for general linux
    task "${HEREPATH}/setup.d/setup.linux.user.sh"

    log "Done"
)
}

SetupLinux
