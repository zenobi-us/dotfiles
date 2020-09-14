#!/bin/sh
log() {
	echo "[SETUP/linux.user] $@"
}

log "> Setup"

cd ~;
log "> cleaning ~/.z*"
rm -rf ~/.z*

log "> linking zsh files"
[ -f ${HERE}/.zshrc ] && ln -s ${HERE}/.zshrc ~/
[ -f ${HERE}/.zprofile ] && ln -s ${HERE}/.zprofile ~/
[ -f ${HERE}/.zshenv ] && ln -s ${HERE}/.zshenv ~/

log "> set zsh as shell"
chsh -s /bin/zsh $(whoami)

log "Done"
