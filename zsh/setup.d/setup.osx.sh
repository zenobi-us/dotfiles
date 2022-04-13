#!/usr/bin/env sh

function SetupOsx () {
(
    log() {
        echo "[SETUP/osx] $@"
    }
    # attempt to run user setup task for general linux
    task "${HEREPATH}/setup.d/setup.osx.user.sh"

    log "Done"
)
}

SetupOsx
