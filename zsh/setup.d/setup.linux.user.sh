#!/bin/sh

log "User> Setup"

cd ~;
log "User> cleaning ~/.z*"
rm -rf ~/.z*

log "User> linking zsh files"
[ -f ${HERE}/.zshrc ] && ln -s ${HERE}/.zshrc ~/
[ -f ${HERE}/.zprofile ] && ln -s ${HERE}/.zprofile ~/
[ -f ${HERE}/.zshenv ] && ln -s ${HERE}/.zshenv ~/

log "User> set zsh as shell"
chsh -s /bin/zsh $(whoami)
