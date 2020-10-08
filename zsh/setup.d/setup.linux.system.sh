#!/bin/sh
log() {
	echo "[SETUP/linux.system] $@"
}

log "> install go-task"
curl -sL https://taskfile.dev/install.sh \
    | BINDIR=/usr/local/bin sh