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

# log "> set zsh as shell"
# chsh -s /bin/zsh $(whoami)

log "> install shellspec"
[ ! -d "$HOME/.local/lib/shellspec" ] \
    && curl -fsSL https://git.io/shellspec | sh

log "> install nvm"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh \
    | sh
    
log "> install tusk"
curl -sL https://git.io/tusk \
    | sh -s -- -b /usr/local/bin latest
tusk --install-completion zsh

log "> install qfc"
git clone https://github.com/pindexis/qfc $HOME/.qfc


log "Done"
