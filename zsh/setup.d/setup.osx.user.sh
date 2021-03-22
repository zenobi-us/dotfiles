#!/usr/bin/env sh

log () {
	echo "[SETUP/osx.user] $@"
}

cd ~;
log "Removing old zsh links"
rm ~/.z*

log "Linking zsh files to: ${HEREPATH}"
[ -f ${HEREPATH}/.zshrc ] && ln -s ${HEREPATH}/.zshrc ~/
[ -f ${HEREPATH}/.zprofile ] && ln -s ${HEREPATH}/.zprofile ~/
[ -f ${HEREPATH}/.zshenv ] && ln -s ${HEREPATH}/.zshenv ~/

log "Done"
