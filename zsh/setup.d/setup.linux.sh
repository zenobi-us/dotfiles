#!/usr/bin/env sh

function SetupLinux () {
(
    log() {
        echo "[SETUP/linux] $@"
    }

    if [ "$EUID" -eq 0 ]; then
        # attempt to run system setup task for specific OS
        task "${HEREPATH}/setup.d/setup.linux-${OSINFO_NAME}-${OSINFO_ARCH}.sh"
        # attempt to run system setup task for general linux
        task "${HEREPATH}/setup.d/setup.linux.system.sh"
    else
        # attempt to run user setup task for specific OS
        task "${HEREPATH}/setup.d/setup.linux-${OSINFO_NAME}-${OSINFO_ARCH}.user.sh"
        # attempt to run user setup task for general linux
        task "${HEREPATH}/setup.d/setup.linux.user.sh"
    fi

    log "Done"
)
}

SetupLinux