#!/bin/sh
log() {
	echo "[SETUP/linux] $@"
}
. $HERE/setup.d/setup.linux.user.sh

if [ "$EUID" -eq 0 ]; then
    . $HERE/zfunctions/os.sh
    setup_path="${HERE}/setup.d/setup.linux-${OS_ID}-${ARCH}.sh"
    log "setting up ${OS_ID} ${VER} ${ARCH}"
    log "setupfile: ${setup_path}"

    [ -f "$setup_path" ] && . $setup_path
    [ ! -f "$setup_path" ] && echo "doesnt exist: $setup_path"
fi
