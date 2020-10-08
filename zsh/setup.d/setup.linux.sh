#!/bin/sh
log() {
	echo "[SETUP/linux] $@"
}

. "${HEREPATH}/lib/sh/linux-osinformation.zsh";

log "OS: ${OSINFO_ID} ${OSINFO_VERSION} ${ARCH}"

if [ "$EUID" -eq 0 ]; then
    task "${HEREPATH}/setup.d/setup.linux-${OS_ID}-${ARCH}.sh"
    task "${HEREPATH}/setup.d/setup.linux.system.sh"
else
    task "${HEREPATH}/setup.d/setup.linux-${OS_ID}-${ARCH}.user.sh"
    task "${HEREPATH}/setup.d/setup.linux.user.sh"
    task "${HEREPATH}/setup.d/setup.user.sh"
fi
